'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/db';
import { reservations, paymentProofs, invoicePayments, auditEvents, invoices, reservationLineItems } from '@/db/schema';
import { eq, desc, sum } from 'drizzle-orm';
import crypto from 'crypto';
import { calculateInvoice } from '@/lib/invoice';

import { adminReviewProofSchema, rejectProofSchema } from '@/lib/validations';

export async function verifyProofAction(
  proofId: string, 
  verifiedAmountMinorUnits: number, 
  paymentMode: string, 
  paymentReference: string, 
  adminNote: string
) {
  try {
    const parseResult = adminReviewProofSchema.safeParse({
      proofId,
      verifyAmountMinorUnits: verifiedAmountMinorUnits,
      paymentMode,
      paymentReference,
      adminNote
    });

    if (!parseResult.success) {
      return { error: parseResult.error.issues[0]?.message || 'Invalid input', success: false };
    }

    const session = await requireAdmin();

    return db.transaction((tx) => {
      const proof = tx.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
      if (!proof) throw new Error('Proof not found');
      if (proof.status !== 'pending_review' && proof.status !== 'resubmit_requested') {
        throw new Error('Proof is not in a verifiable state');
      }

      const invoice = tx.select().from(invoices).where(eq(invoices.id, proof.invoiceId)).get();
      if (!invoice) throw new Error('Invoice not found');

      const reservation = tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');

      // Update the proof
      tx.update(paymentProofs).set({
        status: 'verified',
        reviewedAt: new Date(),
        reviewedBy: session.userId,
        verifiedAmountMinorUnits,
        paymentMode,
        paymentReference,
        adminNote,
        updatedAt: new Date(),
      }).where(eq(paymentProofs.id, proofId)).run();

      // A verified proof is a payment ledger entry. Recompute from the invoice's
      // advance plus every completed payment so repeated proofs and partial
      // payments cannot leave the reservation or invoice in a stale state.
      tx.insert(invoicePayments).values({
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        amountMinorUnits: verifiedAmountMinorUnits,
        paymentMode,
        paymentStatus: 'completed',
        receivedAt: new Date(),
        reference: paymentReference || null,
        notes: adminNote || null,
        recordedBy: session.userId,
        createdAt: new Date(),
      }).run();

      const paymentTotals = tx.select({ total: sum(invoicePayments.amountMinorUnits) })
        .from(invoicePayments)
        .where(eq(invoicePayments.invoiceId, invoice.id))
        .get();
      const totalPaid = (invoice.advanceMinorUnits ?? 0) + Number(paymentTotals?.total ?? 0);
      const balanceMinorUnits = Math.max(0, invoice.totalMinorUnits - totalPaid);
      const newPaymentStatus = totalPaid >= invoice.totalMinorUnits ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'not_requested';

      tx.update(invoices).set({ balanceMinorUnits }).where(eq(invoices.id, invoice.id)).run();

      tx.update(reservations).set({
        paymentStatus: newPaymentStatus,
        updatedAt: new Date(),
      }).where(eq(reservations.id, reservation.id)).run();

      // Audit event
      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'payment_proof',
        entityId: proofId,
        eventType: 'VERIFY_PROOF',
        afterJson: JSON.stringify({ verifiedAmountMinorUnits, totalPaid, balanceMinorUnits, paymentMode, paymentReference, newPaymentStatus }),
        createdAt: new Date(),
      }).run();

      return { success: true };
    });
  } catch (err: any) {
    console.error('verifyProofAction error:', err);
    return { error: err.message || 'Failed to verify proof', success: false };
  }
}

export async function rejectProofAction(proofId: string, adminNote: string, requestResubmit: boolean = false) {
  try {
    const parseResult = rejectProofSchema.safeParse({
      proofId,
      adminNote,
      requestResubmit
    });

    if (!parseResult.success) {
      return { error: parseResult.error.issues[0]?.message || 'Invalid input', success: false };
    }

    const session = await requireAdmin();

    return db.transaction((tx) => {
      const proof = tx.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
      if (!proof) throw new Error('Proof not found');

      const newStatus = requestResubmit ? 'resubmit_requested' : 'rejected';

      tx.update(paymentProofs).set({
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: session.userId,
        adminNote,
        updatedAt: new Date(),
      }).where(eq(paymentProofs.id, proofId)).run();

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'payment_proof',
        entityId: proofId,
        eventType: 'REJECT_PROOF',
        afterJson: JSON.stringify({ newStatus, adminNote }),
        createdAt: new Date(),
      }).run();

      return { success: true };
    });
  } catch (err: any) {
    console.error('rejectProofAction error:', err);
    return { error: err.message || 'Failed to reject proof', success: false };
  }
}

export async function finalizeInvoiceAction(reservationId: string) {
  try {
    const session = await requireAdmin();

    return db.transaction((tx) => {
      const reservation = tx.select().from(reservations).where(eq(reservations.id, reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');
      if (reservation.paymentStatus !== 'paid') {
        throw new Error('Cannot finalize invoice unless payment status is paid');
      }

      // Get latest invoice
      const existingInvoices = tx.select().from(invoices)
        .where(eq(invoices.reservationId, reservationId))
        .orderBy(desc(invoices.version))
        .all();
      
      const latestInvoice = existingInvoices[0];
      if (!latestInvoice) throw new Error('No issued invoice found');

      if (latestInvoice.finalizedAt) {
        throw new Error('Invoice is already finalized');
      }

      // We generate a final snapshot
      const lineItemsRows = tx.select().from(reservationLineItems).where(eq(reservationLineItems.reservationId, reservationId)).all();
      const lineItems = lineItemsRows.map(li => ({
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        rateMinorUnits: li.rateMinorUnits,
        taxRate: li.taxRate ?? undefined,
      }));

      // Assuming all balance was paid, so advance + balance = total. We can simulate advanceReceived = total for calculation?
      // Wait, the calculation should reflect reality. The advance was X, they just paid the balance.
      // We will just use the latest invoice's inputs.
      const snapshot = JSON.parse(latestInvoice.snapshotJson || '{}');
      const input = snapshot.input || {
        lineItems,
        advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits ?? 0,
        refundableSecurityDepositMinorUnits: reservation.securityDepositMinorUnits ?? 500000,
      };

      const calcResult = calculateInvoice(input);
      const newVersion = latestInvoice.version + 1;
      const invoiceNumber = `GGR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const invoiceId = crypto.randomUUID();

      const newSnapshot = {
        input,
        calculation: calcResult,
        guestName: snapshot.guestName || 'Guest',
      };

      tx.insert(invoices).values({
        id: invoiceId,
        invoiceNumber,
        reservationId,
        version: newVersion,
        status: 'issued', // keeping 'issued' or maybe we can still call it issued but with finalizedAt
        issuedAt: new Date(),
        finalizedAt: new Date(),
        finalizedBy: session.userId,
        parentInvoiceId: latestInvoice.id, // reference the previous draft/issued
        currency: 'INR',
        subtotalMinorUnits: calcResult.subtotalMinorUnits,
        taxMinorUnits: calcResult.taxMinorUnits,
        securityDepositMinorUnits: calcResult.securityDepositMinorUnits,
        totalMinorUnits: calcResult.totalMinorUnits,
        advanceMinorUnits: calcResult.advanceMinorUnits,
        balanceMinorUnits: 0, // balance is now 0 since it is fully paid
        amountInWords: calcResult.amountInWords,
        snapshotJson: JSON.stringify(newSnapshot),
        createdBy: session.userId,
        createdAt: new Date(),
      }).run();

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'FINALIZE_INVOICE',
        createdAt: new Date(),
      }).run();

      return { success: true, invoiceId };
    });
  } catch (err: any) {
    console.error('finalizeInvoiceAction error:', err);
    return { error: err.message || 'Failed to finalize invoice', success: false };
  }
}
