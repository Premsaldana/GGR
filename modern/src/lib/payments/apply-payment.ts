'use server';

import crypto from 'crypto';
import { eq, or, sum } from 'drizzle-orm';
import { auditEvents, invoicePayments, invoices, reservations } from '@/db/schema';

export type PaymentSource = 'auto' | 'proof' | 'manual';

export interface ApplyPaymentInput {
  invoiceId: string;
  amountMinorUnits: number;
  mode: string;
  reference?: string;
  providerPaymentId?: string;
  attemptId?: string;
  source: PaymentSource;
  actorUserId: string | null;
  note?: string;
}

export interface ApplyPaymentResult {
  status: 'applied' | 'duplicate';
  paymentId: string;
  invoiceId: string;
  totalPaidMinorUnits: number;
  balanceMinorUnits: number;
  reservationPaymentStatus: string;
  duplicateOf?: string;
}

type QueryResult<T> = Promise<T[]> & { execute?: () => Promise<T[]> };
type TransactionLike = {
  select: (...args: unknown[]) => { from: (...args: unknown[]) => { where: (...args: unknown[]) => QueryResult<unknown> & { get?: () => unknown }; }; };
  insert: (...args: unknown[]) => { values: (...args: unknown[]) => { execute?: () => Promise<unknown>; run?: () => unknown } };
  update: (...args: unknown[]) => { set: (...args: unknown[]) => { where: (...args: unknown[]) => { execute?: () => Promise<unknown>; run?: () => unknown } } };
};

function rows<T>(result: QueryResult<T> & { get?: () => unknown }): Promise<T[]> | T[] {
  if (result.get) return [result.get() as T].filter(Boolean);
  return result;
}

async function finish<T>(result: { execute?: () => Promise<T>; run?: () => T }): Promise<T | undefined> {
  if (result.execute) return result.execute();
  return result.run?.();
}

/**
 * Posts one completed payment and recomputes the invoice ledger from source rows.
 * The caller must invoke this inside its database transaction. PostgreSQL callers
 * should lock the invoice row before calling it; SQLite serializes the transaction.
 */
export async function applyPayment(tx: unknown, input: ApplyPaymentInput): Promise<ApplyPaymentResult> {
  const transaction = tx as TransactionLike;
  if (!Number.isInteger(input.amountMinorUnits) || input.amountMinorUnits <= 0) {
    throw new Error('Payment amount must be a positive integer');
  }

  const duplicateFilters = [];
  if (input.providerPaymentId) duplicateFilters.push(eq(invoicePayments.providerPaymentId, input.providerPaymentId));
  if (input.mode === 'UPI' && input.reference) duplicateFilters.push(eq(invoicePayments.reference, input.reference));
  if (duplicateFilters.length) {
    const duplicateQuery = transaction.select().from(invoicePayments).where(or(...duplicateFilters)) as QueryResult<typeof invoicePayments.$inferSelect> & { get?: () => unknown };
    const duplicateRows = await rows(duplicateQuery);
    const duplicate = duplicateRows.find((payment) => payment.invoiceId === input.invoiceId);
    if (duplicate) {
      const invoiceQuery = transaction.select().from(invoices).where(eq(invoices.id, input.invoiceId)) as QueryResult<typeof invoices.$inferSelect> & { get?: () => unknown };
      const invoiceRows = await rows(invoiceQuery);
      const invoice = invoiceRows[0];
      return {
        status: 'duplicate', paymentId: duplicate.id, duplicateOf: duplicate.id,
        invoiceId: input.invoiceId, totalPaidMinorUnits: (invoice?.totalMinorUnits ?? 0) - (invoice?.balanceMinorUnits ?? 0),
        balanceMinorUnits: invoice?.balanceMinorUnits ?? 0,
        reservationPaymentStatus: 'unchanged',
      };
    }
  }

  const invoiceQuery = transaction.select().from(invoices).where(eq(invoices.id, input.invoiceId)) as QueryResult<typeof invoices.$inferSelect> & { get?: () => unknown };
  const invoiceRows = await rows(invoiceQuery);
  const invoice = invoiceRows[0];
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status === 'cancelled') throw new Error('Cannot record payment for a cancelled invoice');

  const reservationQuery = transaction.select().from(reservations).where(eq(reservations.id, invoice.reservationId)) as QueryResult<typeof reservations.$inferSelect> & { get?: () => unknown };
  const reservationRows = await rows(reservationQuery);
  const reservation = reservationRows[0];
  if (!reservation) throw new Error('Reservation not found');

  const paymentId = crypto.randomUUID();
  await finish(transaction.insert(invoicePayments).values({
    id: paymentId,
    invoiceId: input.invoiceId,
    amountMinorUnits: input.amountMinorUnits,
    paymentMode: input.mode,
    paymentStatus: 'completed',
    receivedAt: new Date(),
    reference: input.reference ?? null,
    notes: input.note ?? null,
    recordedBy: input.actorUserId,
    createdAt: new Date(),
    attemptId: input.attemptId ?? null,
    source: input.source,
    providerPaymentId: input.providerPaymentId ?? null,
  }));

  const totalsQuery = transaction.select({ total: sum(invoicePayments.amountMinorUnits) }).from(invoicePayments).where(eq(invoicePayments.invoiceId, input.invoiceId)) as QueryResult<{ total: number | null }> & { get?: () => unknown };
  const totalsRows = await rows(totalsQuery);
  const ledgerTotal = Number(totalsRows[0]?.total ?? 0);
  const totalPaidMinorUnits = (invoice.advanceMinorUnits ?? 0) + ledgerTotal;
  const balanceMinorUnits = Math.max(0, invoice.totalMinorUnits - totalPaidMinorUnits);
  const reservationPaymentStatus = totalPaidMinorUnits >= invoice.totalMinorUnits
    ? 'paid'
    : totalPaidMinorUnits > 0
      ? 'partially_paid'
      : reservation.paymentStatus;

  await finish(transaction.update(invoices).set({ balanceMinorUnits }).where(eq(invoices.id, input.invoiceId)));
  if (reservationPaymentStatus !== reservation.paymentStatus) {
    await finish(transaction.update(reservations).set({ paymentStatus: reservationPaymentStatus, updatedAt: new Date() }).where(eq(reservations.id, reservation.id)));
  }
  await finish(transaction.insert(auditEvents).values({
    id: crypto.randomUUID(), actorUserId: input.actorUserId, entityType: 'invoice_payment', entityId: paymentId,
    eventType: 'CREATE', beforeJson: JSON.stringify({ balanceMinorUnits: invoice.balanceMinorUnits, paymentStatus: reservation.paymentStatus }),
    afterJson: JSON.stringify({ amountMinorUnits: input.amountMinorUnits, totalPaidMinorUnits, balanceMinorUnits, source: input.source, providerPaymentId: input.providerPaymentId ?? null }),
    createdAt: new Date(),
  }));

  return { status: 'applied', paymentId, invoiceId: input.invoiceId, totalPaidMinorUnits, balanceMinorUnits, reservationPaymentStatus };
}
