import 'server-only';

import { db } from '@/db';
import { guests, invoicePayments, invoices, paymentProofs, reservations, units } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { buildInvoiceWorkspace, type InvoiceListQuery } from './invoice-list-model';

export async function getInvoiceWorkspace(query: InvoiceListQuery) {
  await requireAdmin();

  const [invoiceRows, paymentRows, proofRows] = await Promise.all([
    db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      reservationId: reservations.id,
      reservationNumber: reservations.reservationNumber,
      version: invoices.version,
      invoiceStatus: invoices.status,
      bookingStatus: reservations.bookingStatus,
      totalMinorUnits: invoices.totalMinorUnits,
      advanceMinorUnits: invoices.advanceMinorUnits,
      createdAt: invoices.createdAt,
      issuedAt: invoices.issuedAt,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      guestName: guests.fullName,
      unitName: units.displayName,
    })
      .from(invoices)
      .innerJoin(reservations, eq(invoices.reservationId, reservations.id))
      .innerJoin(guests, eq(reservations.guestId, guests.id))
      .innerJoin(units, eq(reservations.unitId, units.id))
      .all(),
    db.select({
      invoiceId: invoicePayments.invoiceId,
      amountMinorUnits: invoicePayments.amountMinorUnits,
      paymentStatus: invoicePayments.paymentStatus,
      reference: invoicePayments.reference,
    }).from(invoicePayments).all(),
    db.select({
      invoiceId: paymentProofs.invoiceId,
      status: paymentProofs.status,
      verifiedAmountMinorUnits: paymentProofs.verifiedAmountMinorUnits,
      paymentReference: paymentProofs.paymentReference,
    }).from(paymentProofs).all(),
  ]);

  return buildInvoiceWorkspace({
    invoices: invoiceRows,
    payments: paymentRows,
    proofs: proofRows,
    query,
  });
}
