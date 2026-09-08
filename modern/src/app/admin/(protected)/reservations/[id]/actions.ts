'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/db';
import { reservations, paymentProofs, invoicePayments, auditEvents, invoices, reservationLineItems } from '@/db/schema';
import { eq, desc, sum } from 'drizzle-orm';
import crypto from 'crypto';
import { calculateInvoice } from '@/lib/invoice';
import { adminReviewProofSchema, rejectProofSchema } from '@/lib/validations';
import { publishRealtimeEvent } from '@/lib/realtime-publish';

export async function verifyProofAction(proofId: string, verifiedAmountMinorUnits: number, paymentMode: string, paymentReference: string, adminNote: string) {
  try {
    const parseResult = adminReviewProofSchema.safeParse({ proofId, verifyAmountMinorUnits: verifiedAmountMinorUnits, paymentMode, paymentReference, adminNote });
    if (!parseResult.success) return { error: parseResult.error.issues[0]?.message || 'Invalid input', success: false };
    const session = await requireAdmin();

    const result = db.transaction((tx) => {
      const proof = tx.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
      if (!proof) throw new Error('Proof not found');
      if (proof.status !== 'pending_review' && proof.status !== 'resubmit_requested') throw new Error('Proof is not in a verifiable state');
      const invoice = tx.select().from(invoices).where(eq(invoices.id, proof.invoiceId)).get();
      if (!invoice) throw new Error('Invoice not found');
      const reservation = tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');

      tx.update(paymentProofs).set({ status: 'verified', reviewedAt: new Date(), reviewedBy: session.userId, verifiedAmountMinorUnits, paymentMode, paymentReference, adminNote, updatedAt: new Date() }).where(eq(paymentProofs.id, proofId)).run();
      tx.insert(invoicePayments).values({ id: crypto.randomUUID(), invoiceId: invoice.id, amountMinorUnits: verifiedAmountMinorUnits, paymentMode, paymentStatus: 'completed', receivedAt: new Date(), reference: paymentReference || null, notes: adminNote || null, recordedBy: session.userId, createdAt: new Date() }).run();

      const paymentTotals = tx.select({ total: sum(invoicePayments.amountMinorUnits) }).from(invoicePayments).where(eq(invoicePayments.invoiceId, invoice.id)).get();
      const totalPaid = (invoice.advanceMinorUnits ?? 0) + Number(paymentTotals?.total ?? 0);
      const balanceMinorUnits = Math.max(0, invoice.totalMinorUnits - totalPaid);
      const newPaymentStatus = totalPaid >= invoice.totalMinorUnits ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'not_requested';
      tx.update(invoices).set({ balanceMinorUnits }).where(eq(invoices.id, invoice.id)).run();
      tx.update(reservations).set({ paymentStatus: newPaymentStatus, updatedAt: new Date() }).where(eq(reservations.id, reservation.id)).run();
      tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'payment_proof', entityId: proofId, eventType: 'VERIFY_PROOF', afterJson: JSON.stringify({ verifiedAmountMinorUnits, totalPaid, balanceMinorUnits, paymentMode, paymentReference, newPaymentStatus }), createdAt: new Date() }).run();
      return { success: true };
    });

    const verifiedProof = db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
    const verifiedInvoice = verifiedProof ? db.select().from(invoices).where(eq(invoices.id, verifiedProof.invoiceId)).get() : null;
    await publishRealtimeEvent({ type: 'proof.verified', invoiceId: verifiedProof?.invoiceId || '', reservationId: verifiedInvoice?.reservationId || '', proof: verifiedProof ? { ...verifiedProof } : undefined, invoice: verifiedInvoice ? { id: verifiedInvoice.id, status: verifiedInvoice.status, balanceMinorUnits: verifiedInvoice.balanceMinorUnits } : undefined });
    return result;
  } catch (err: any) {
    console.error('verifyProofAction error:', err);
    return { error: err.message || 'Failed to verify proof', success: false };
  }
}

export async function rejectProofAction(proofId: string, adminNote: string, requestResubmit: boolean = false) {
  try {
    const parseResult = rejectProofSchema.safeParse({ proofId, adminNote, requestResubmit });
    if (!parseResult.success) return { error: parseResult.error.issues[0]?.message || 'Invalid input', success: false };
    const session = await requireAdmin();

    const result = db.transaction((tx) => {
      const proof = tx.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
      if (!proof) throw new Error('Proof not found');
      const newStatus = requestResubmit ? 'resubmit_requested' : 'rejected';
      tx.update(paymentProofs).set({ status: newStatus, reviewedAt: new Date(), reviewedBy: session.userId, adminNote, updatedAt: new Date() }).where(eq(paymentProofs.id, proofId)).run();
      tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'payment_proof', entityId: proofId, eventType: 'REJECT_PROOF', afterJson: JSON.stringify({ newStatus, adminNote }), createdAt: new Date() }).run();
      return { success: true };
    });

    const rejectedProof = db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
    const rejectedInvoice = rejectedProof ? db.select().from(invoices).where(eq(invoices.id, rejectedProof.invoiceId)).get() : null;
    await publishRealtimeEvent({ type: requestResubmit ? 'proof.resubmit_requested' : 'proof.rejected', invoiceId: rejectedProof?.invoiceId || '', reservationId: rejectedInvoice?.reservationId || '', proof: rejectedProof ? { ...rejectedProof } : undefined });
    return result;
  } catch (err: any) {
    console.error('rejectProofAction error:', err);
    return { error: err.message || 'Failed to reject proof', success: false };
  }
}

export async function finalizeInvoiceAction(reservationId: string) {
  try {
    const session = await requireAdmin();
    const result = db.transaction((tx) => {
      const reservation = tx.select().from(reservations).where(eq(reservations.id, reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');
      if (reservation.paymentStatus !== 'paid') throw new Error('Cannot finalize invoice unless payment status is paid');
      const existingInvoices = tx.select().from(invoices).where(eq(invoices.reservationId, reservationId)).orderBy(desc(invoices.version)).all();
      const latestInvoice = existingInvoices[0];
      if (!latestInvoice) throw new Error('No issued invoice found');
      if (latestInvoice.finalizedAt) throw new Error('Invoice is already finalized');
      const lineItemsRows = tx.select().from(reservationLineItems).where(eq(reservationLineItems.reservationId, reservationId)).all();
      const lineItems = lineItemsRows.map((li) => ({ category: li.category, description: li.description, quantity: li.quantity, rateMinorUnits: li.rateMinorUnits, taxRate: li.taxRate ?? undefined }));
      const snapshot = JSON.parse(latestInvoice.snapshotJson || '{}');
      const input = snapshot.input || { lineItems, advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits ?? 0, refundableSecurityDepositMinorUnits: reservation.securityDepositMinorUnits ?? 500000 };
      const calcResult = calculateInvoice(input);
      const invoiceId = crypto.randomUUID();
      tx.insert(invoices).values({ id: invoiceId, invoiceNumber: `GGR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, reservationId, version: latestInvoice.version + 1, status: 'issued', issuedAt: new Date(), finalizedAt: new Date(), finalizedBy: session.userId, parentInvoiceId: latestInvoice.id, currency: 'INR', subtotalMinorUnits: calcResult.subtotalMinorUnits, taxMinorUnits: calcResult.taxMinorUnits, securityDepositMinorUnits: calcResult.securityDepositMinorUnits, totalMinorUnits: calcResult.totalMinorUnits, advanceMinorUnits: calcResult.advanceMinorUnits, balanceMinorUnits: 0, amountInWords: calcResult.amountInWords, snapshotJson: JSON.stringify({ ...snapshot, input, calculation: calcResult }), createdBy: session.userId, createdAt: new Date() }).run();
      tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'invoice', entityId: invoiceId, eventType: 'FINALIZE_INVOICE', createdAt: new Date() }).run();
      return { success: true, invoiceId };
    });
    const finalizedInvoice = db.select().from(invoices).where(eq(invoices.id, result.invoiceId)).get();
    await publishRealtimeEvent({ type: 'invoice.finalized', invoiceId: result.invoiceId, reservationId, invoice: finalizedInvoice ? { id: finalizedInvoice.id, status: finalizedInvoice.status, balanceMinorUnits: finalizedInvoice.balanceMinorUnits, finalizedAt: finalizedInvoice.finalizedAt } : undefined });
    return result;
  } catch (err: any) {
    console.error('finalizeInvoiceAction error:', err);
    return { error: err.message || 'Failed to finalize invoice', success: false };
  }
}
