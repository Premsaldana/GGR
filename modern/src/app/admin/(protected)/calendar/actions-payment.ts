'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/db';
import { invoices, invoicePayments, auditEvents, reservations } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';
import crypto from 'crypto';

export async function recordPaymentAction(
  invoiceId: string, 
  payload: { amountMinorUnits: number; paymentMode: string; reference?: string; notes?: string }
) {
  const session = await requireAdmin();

  if (payload.amountMinorUnits <= 0) {
    return { error: 'Payment amount must be positive' };
  }

  try {
    const result = db.transaction((tx) => {
      // Idempotency check based on reference (if provided)
      if (payload.reference) {
        const existing = tx.select().from(invoicePayments).where(eq(invoicePayments.reference, payload.reference)).get();
        if (existing && existing.invoiceId === invoiceId) {
          return { success: true, paymentId: existing.id, message: 'Payment already recorded' };
        }
      }

      const invoice = tx.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
      if (!invoice) throw new Error('Invoice not found');

      const reservation = tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');

      const paymentId = crypto.randomUUID();
      tx.insert(invoicePayments).values({
        id: paymentId,
        invoiceId,
        amountMinorUnits: payload.amountMinorUnits,
        paymentMode: payload.paymentMode,
        paymentStatus: 'completed',
        receivedAt: new Date(),
        reference: payload.reference || null,
        notes: payload.notes || null,
        recordedBy: session.userId,
        createdAt: new Date(),
      }).run();

      // Recompute totals
      const paymentsResult = tx.select({ total: sum(invoicePayments.amountMinorUnits) })
        .from(invoicePayments)
        .where(eq(invoicePayments.invoiceId, invoiceId))
        .get();
      
      const additionalPaid = paymentsResult?.total || 0;
      const totalPaid = invoice.advanceMinorUnits + Number(additionalPaid);
      
      let newStatus = reservation.paymentStatus;
      if (totalPaid >= invoice.totalMinorUnits) {
        newStatus = 'paid';
      } else if (totalPaid > invoice.advanceMinorUnits) {
        newStatus = 'partially_paid';
      }

      if (newStatus !== reservation.paymentStatus) {
        tx.update(reservations).set({ paymentStatus: newStatus, updatedAt: new Date() }).where(eq(reservations.id, reservation.id)).run();
      }

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'invoice_payment',
        entityId: paymentId,
        eventType: 'CREATE',
        createdAt: new Date(),
      }).run();

      return { success: true, paymentId, newStatus, totalPaid };
    });

    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getPaymentsAction(invoiceId: string) {
  await requireAdmin();
  return db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invoiceId)).all();
}
