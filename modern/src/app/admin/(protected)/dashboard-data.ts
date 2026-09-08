import 'server-only';

import { db } from '@/db';
import {
  auditEvents,
  guests,
  invoicePayments,
  invoices,
  paymentProofs,
  reservations,
  units,
} from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/session';
import { buildDashboardSnapshot } from './dashboard-model';

export async function getDashboardSnapshot(now = new Date()) {
  await requireAdmin();

  const [reservationRows, invoiceRows, proofRows, paymentRows, auditRows] = await Promise.all([
    db.select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      bookingStatus: reservations.bookingStatus,
      paymentStatus: reservations.paymentStatus,
      adults: reservations.adults,
      children: reservations.children,
      guestName: guests.fullName,
      unitName: units.displayName,
    })
      .from(reservations)
      .innerJoin(guests, eq(reservations.guestId, guests.id))
      .innerJoin(units, eq(reservations.unitId, units.id))
      .all(),
    db.select({
      id: invoices.id,
      reservationId: invoices.reservationId,
      version: invoices.version,
      status: invoices.status,
      totalMinorUnits: invoices.totalMinorUnits,
      advanceMinorUnits: invoices.advanceMinorUnits,
      createdAt: invoices.createdAt,
    }).from(invoices).all(),
    db.select({
      id: paymentProofs.id,
      invoiceId: paymentProofs.invoiceId,
      status: paymentProofs.status,
      verifiedAmountMinorUnits: paymentProofs.verifiedAmountMinorUnits,
      paymentReference: paymentProofs.paymentReference,
      submittedAt: paymentProofs.submittedAt,
    }).from(paymentProofs).all(),
    db.select({
      id: invoicePayments.id,
      invoiceId: invoicePayments.invoiceId,
      amountMinorUnits: invoicePayments.amountMinorUnits,
      paymentStatus: invoicePayments.paymentStatus,
      reference: invoicePayments.reference,
    }).from(invoicePayments).all(),
    db.select({
      id: auditEvents.id,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      eventType: auditEvents.eventType,
      createdAt: auditEvents.createdAt,
    }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(24).all(),
  ]);

  return buildDashboardSnapshot({
    reservations: reservationRows,
    invoices: invoiceRows,
    proofs: proofRows,
    payments: paymentRows,
    auditEvents: auditRows,
    now,
  });
}
