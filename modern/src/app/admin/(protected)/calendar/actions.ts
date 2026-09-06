'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/db';
import { guests, reservations, reservationLineItems, units, auditEvents } from '@/db/schema';
import { and, eq, lte, gte, or } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

export async function getUnits() {
  await requireAdmin();
  return db.select().from(units).where(eq(units.active, true)).all();
}

export async function getReservations(monthStart: string, monthEnd: string) {
  await requireAdmin();
  return db.select().from(reservations).where(
    and(
      lte(reservations.checkInDate, monthEnd),
      gte(reservations.checkOutDate, monthStart),
      or(eq(reservations.bookingStatus, 'pending'), eq(reservations.bookingStatus, 'confirmed'))
    )
  ).all();
}

const reservationSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  guestName: z.string().min(2, 'Guest name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  adults: z.number().min(1),
  children: z.number().min(0),
  bookingStatus: z.enum(['pending', 'confirmed', 'cancelled']),
  paymentMode: z.enum(['UPI', 'CASH', 'BANK_TRANSFER']).optional(),
  advanceReceivedMinorUnits: z.number().min(0).optional(),
  advanceReceivedAt: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().min(1),
    rateMinorUnits: z.number().min(0),
    amountMinorUnits: z.number().min(0)
  })).optional()
});

export async function createReservation(data: z.infer<typeof reservationSchema>) {
  let session;
  try {
    session = await requireAdmin();
  } catch (error: any) {
    return { error: 'Unauthorized', type: 'UNAUTHORIZED' };
  }

  const parseResult = reservationSchema.safeParse(data);
  if (!parseResult.success) {
    return { error: 'Invalid input data', type: 'VALIDATION', details: parseResult.error.format() };
  }
  const validData = parseResult.data;

  if (validData.checkOutDate <= validData.checkInDate) {
    return { error: 'Check-out date must be after check-in date', type: 'VALIDATION' };
  }

  try {
    // Synchronous transaction to prevent locking/concurrency issues
    const result = db.transaction((tx) => {
      const unit = tx.select().from(units).where(and(eq(units.id, validData.unitId), eq(units.active, true))).get();
      if (!unit) {
        throw new Error('INVALID_UNIT');
      }

      const overlapping = tx.select().from(reservations).where(
        and(
          eq(reservations.unitId, validData.unitId),
          or(eq(reservations.bookingStatus, 'pending'), eq(reservations.bookingStatus, 'confirmed')),
          lte(reservations.checkInDate, validData.checkOutDate),
          gte(reservations.checkOutDate, validData.checkInDate)
        )
      ).get();

      if (overlapping) {
        if (!(overlapping.checkOutDate <= validData.checkInDate || overlapping.checkInDate >= validData.checkOutDate)) {
          throw new Error('CONFLICT');
        }
      }

      const guestId = crypto.randomUUID();
      tx.insert(guests).values({
        id: guestId,
        fullName: validData.guestName,
        phone: validData.phone,
        email: validData.email || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();

      const reservationId = crypto.randomUUID();
      const resNum = `RES-${Date.now().toString().slice(-6)}`;
      tx.insert(reservations).values({
        id: reservationId,
        reservationNumber: resNum,
        guestId,
        unitId: validData.unitId,
        checkInDate: validData.checkInDate,
        checkOutDate: validData.checkOutDate,
        bookingStatus: validData.bookingStatus,
        paymentStatus: 'not_requested',
        adults: validData.adults,
        children: validData.children,
        paymentMode: validData.paymentMode || null,
        advanceReceivedMinorUnits: validData.advanceReceivedMinorUnits || null,
        advanceReceivedAt: validData.advanceReceivedAt ? new Date(validData.advanceReceivedAt) : null,
        notes: validData.notes || null,
        createdBy: session.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();

      if (validData.lineItems && validData.lineItems.length > 0) {
        const items = validData.lineItems.map((li, index) => ({
          id: crypto.randomUUID(),
          reservationId,
          category: li.category,
          description: li.description,
          quantity: li.quantity,
          rateMinorUnits: li.rateMinorUnits,
          amountMinorUnits: li.amountMinorUnits,
          sortOrder: index,
        }));
        tx.insert(reservationLineItems).values(items).run();
      }

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'reservation',
        entityId: reservationId,
        eventType: 'CREATE',
        createdAt: new Date(),
      }).run();

      return { reservationId, reservationNumber: resNum };
    });

    return { success: true, ...result };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'INVALID_UNIT') {
      return { error: 'The selected unit is invalid or inactive.', type: 'VALIDATION' };
    }
    if (error.message === 'CONFLICT') {
      return { error: 'The selected unit is already booked for these dates.', type: 'CONFLICT' };
    }
    console.error('Reservation creation failed', error);
    return { error: 'Failed to create reservation', type: 'SERVER_ERROR' };
  }
}

import { calculateInvoice, InvoiceCalculationInput } from '@/lib/invoice';
import { invoices } from '@/db/schema';

export async function calculateInvoiceAction(input: InvoiceCalculationInput) {
  await requireAdmin();
  try {
    return { success: true, data: calculateInvoice(input) };
  } catch (err: any) {
    return { error: err.message, type: 'VALIDATION_ERROR' };
  }
}

export async function issueInvoiceAction(reservationId: string, clientDepositMinorUnits?: number) {
  const session = await requireAdmin();
  
  try {
    const result = db.transaction((tx) => {
      // 1. Reload the reservation and line items from the database
      const reservation = tx.select().from(reservations).where(eq(reservations.id, reservationId)).get();
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const lineItemsRows = tx.select().from(reservationLineItems).where(eq(reservationLineItems.reservationId, reservationId)).all();
      
      const lineItems = lineItemsRows.map(li => ({
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        rateMinorUnits: li.rateMinorUnits,
        taxRate: li.taxRate ?? undefined,
      }));

      // 2. Recompute strictly on the server
      const input: InvoiceCalculationInput = {
        lineItems,
        advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits ?? 0,
        refundableSecurityDepositMinorUnits: clientDepositMinorUnits ?? 500000,
      };
      
      const calcResult = calculateInvoice(input);
      
      // Find existing invoice versions for this reservation
      const existingInvoices = tx.select().from(invoices)
        .where(eq(invoices.reservationId, reservationId))
        .all();
      
      const newVersion = existingInvoices.length + 1;
      const invoiceNumber = `GGR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const invoiceId = crypto.randomUUID();

      const snapshot = {
        input,
        calculation: calcResult,
      };

      tx.insert(invoices).values({
        id: invoiceId,
        invoiceNumber,
        reservationId,
        version: newVersion,
        status: 'issued',
        issuedAt: new Date(),
        currency: 'INR',
        subtotalMinorUnits: calcResult.subtotalMinorUnits,
        taxMinorUnits: calcResult.taxMinorUnits,
        securityDepositMinorUnits: calcResult.securityDepositMinorUnits,
        totalMinorUnits: calcResult.totalMinorUnits,
        advanceMinorUnits: calcResult.advanceMinorUnits,
        balanceMinorUnits: calcResult.balanceMinorUnits,
        amountInWords: calcResult.amountInWords,
        snapshotJson: JSON.stringify(snapshot),
        createdBy: session.userId,
        createdAt: new Date(),
      }).run();

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'ISSUE',
        createdAt: new Date(),
      }).run();

      return { invoiceId, invoiceNumber, version: newVersion };
    });
    return { success: true, ...result };
  } catch (err: any) {
    console.error('Invoice issuance failed', err);
    return { error: err.message || 'Failed to issue invoice', type: 'SERVER_ERROR' };
  }
}

