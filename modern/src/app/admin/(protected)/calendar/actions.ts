'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/db';
import { guests, reservations, reservationLineItems, units, auditEvents } from '@/db/schema';
import { and, eq, lte, gte, or } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { toPaise } from '@/lib/invoice';
import { ALLOWED_UNITS, DEFAULT_CHECK_IN_TIME, DEFAULT_CHECK_OUT_TIME, getCanonicalRoomType, isAllowedUnit } from '@/lib/units';

function ensureAllowedUnits() {
  const existingUnits = db.select().from(units).all();
  const existingByType = new Map(
    existingUnits
      .map((unit) => [getCanonicalRoomType(unit), unit] as const)
      .filter((entry) => entry[0] !== null) as Array<readonly [string, typeof existingUnits[number]]>
  );

  for (const allowedUnit of ALLOWED_UNITS) {
    const existing = existingByType.get(allowedUnit.displayName);
    if (existing) {
      if (!existing.active || existing.displayName !== allowedUnit.displayName) {
        db.update(units).set({
          displayName: allowedUnit.displayName,
          active: true,
          capacityAdults: allowedUnit.capacityAdults,
          capacityChildren: allowedUnit.capacityChildren,
          defaultCheckInTime: DEFAULT_CHECK_IN_TIME,
          defaultCheckOutTime: DEFAULT_CHECK_OUT_TIME,
        }).where(eq(units.id, existing.id)).run();
      }
      continue;
    }

    db.insert(units).values({
      id: crypto.randomUUID(),
      displayName: allowedUnit.displayName,
      slug: allowedUnit.slug,
      active: true,
      capacityAdults: allowedUnit.capacityAdults,
      capacityChildren: allowedUnit.capacityChildren,
      defaultCheckInTime: DEFAULT_CHECK_IN_TIME,
      defaultCheckOutTime: DEFAULT_CHECK_OUT_TIME,
    }).run();
  }
}

export async function getUnits() {
  await requireAdmin();
  ensureAllowedUnits();
  return db.select().from(units).where(eq(units.active, true)).all()
    .filter(isAllowedUnit)
    .map((unit) => ({ ...unit, displayName: getCanonicalRoomType(unit) || 'Private Pool Villa' }));
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

import { reservationFormSchema } from '@/lib/validations';

export async function createReservation(data: z.infer<typeof reservationFormSchema>) {
  let session;
  try {
    session = await requireAdmin();
  } catch (error: any) {
    return { error: 'Unauthorized', type: 'UNAUTHORIZED' };
  }

  const parseResult = reservationFormSchema.safeParse(data);
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
      if (!unit || !isAllowedUnit(unit)) {
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
        advanceReceivedMinorUnits: validData.advanceReceived !== undefined ? toPaise(validData.advanceReceived) : null,
        advanceReceivedAt: validData.advanceReceivedAt ? new Date(validData.advanceReceivedAt) : null,
        securityDepositMinorUnits: toPaise(validData.securityDeposit),
        notes: validData.notes || null,
        createdBy: session.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();

      const checkIn = new Date(validData.checkInDate);
      const checkOut = new Date(validData.checkOutDate);
      const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      
      const generatedLineItems = [];
      const accomRateMinor = toPaise(validData.accommodationRate);
      if (validData.isNightlyRate) {
        generatedLineItems.push({
          category: 'Accommodation',
          description: `Rent for ${nights} night(s)`,
          quantity: nights,
          rateMinorUnits: accomRateMinor,
          taxRate: validData.taxPercentage,
          amountMinorUnits: nights * accomRateMinor
        });
      } else {
        generatedLineItems.push({
          category: 'Accommodation',
          description: `Total Rent`,
          quantity: 1,
          rateMinorUnits: accomRateMinor,
          taxRate: validData.taxPercentage,
          amountMinorUnits: accomRateMinor
        });
      }

      const epRateMinor = toPaise(validData.extraPersonRate);
      if (validData.extraPersonQuantity > 0) {
        generatedLineItems.push({
          category: 'Additional charges',
          description: 'Extra Person',
          quantity: validData.extraPersonQuantity,
          rateMinorUnits: epRateMinor,
          taxRate: validData.taxPercentage,
          amountMinorUnits: validData.extraPersonQuantity * epRateMinor
        });
      }

      const eciMinor = toPaise(validData.earlyCheckIn);
      if (eciMinor > 0) {
        generatedLineItems.push({
          category: 'Additional charges',
          description: 'Early Check-in',
          quantity: 1,
          rateMinorUnits: eciMinor,
          taxRate: validData.taxPercentage,
          amountMinorUnits: eciMinor
        });
      }

      const lcoMinor = toPaise(validData.lateCheckOut);
      if (lcoMinor > 0) {
        generatedLineItems.push({
          category: 'Additional charges',
          description: 'Late Check-out',
          quantity: 1,
          rateMinorUnits: lcoMinor,
          taxRate: validData.taxPercentage,
          amountMinorUnits: lcoMinor
        });
      }

      if (validData.additionalServices) {
        for (const service of validData.additionalServices) {
          const sRateMinor = toPaise(service.rate);
          generatedLineItems.push({
            category: 'Additional services',
            description: service.description,
            quantity: service.quantity,
            rateMinorUnits: sRateMinor,
            taxRate: validData.taxPercentage,
            amountMinorUnits: service.quantity * sRateMinor
          });
        }
      }

      if (generatedLineItems.length > 0) {
        const items = generatedLineItems.map((li, index) => ({
          id: crypto.randomUUID(),
          reservationId,
          category: li.category,
          description: li.description,
          quantity: li.quantity,
          rateMinorUnits: li.rateMinorUnits,
          taxRate: li.taxRate,
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
import { getInvoiceStayMetadata } from '@/lib/invoiceMetadata';
import { publishRealtimeEvent } from '@/lib/realtime-publish';

export async function calculateInvoiceAction(input: InvoiceCalculationInput) {
  await requireAdmin();
  try {
    return { success: true, data: calculateInvoice(input) };
  } catch (err: any) {
    return { error: err.message, type: 'VALIDATION_ERROR' };
  }
}

export async function issueInvoiceAction(reservationId: string, clientDepositMinorUnits?: number) {
  try {
    const session = await requireAdmin();
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
        amountMinorUnits: li.amountMinorUnits,
      }));

      // 2. Recompute strictly on the server
      const input: InvoiceCalculationInput = {
        lineItems,
        advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits ?? 0,
        refundableSecurityDepositMinorUnits: reservation.securityDepositMinorUnits ?? clientDepositMinorUnits ?? 500000,
      };
      
      const calcResult = calculateInvoice(input);
      
      // Find existing invoice versions for this reservation
      const existingInvoices = tx.select().from(invoices)
        .where(eq(invoices.reservationId, reservationId))
        .all();
      
      const newVersion = existingInvoices.length + 1;
      const invoiceNumber = `GGR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const invoiceId = crypto.randomUUID();

      const guest = tx.select().from(guests).where(eq(guests.id, reservation.guestId)).get();
      const unit = tx.select().from(units).where(eq(units.id, reservation.unitId)).get();
      if (!unit) throw new Error('Unit not found');

      const snapshot = {
        input,
        calculation: calcResult,
        guestName: guest?.fullName || 'Guest name pending',
        ...getInvoiceStayMetadata(reservation, unit),
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
    await publishRealtimeEvent({
      type: 'invoice.issued',
      invoiceId: result.invoiceId,
      reservationId,
      invoice: { id: result.invoiceId, invoiceNumber: result.invoiceNumber, status: 'issued' },
    });
    return { success: true, ...result };
  } catch (err: any) {
    console.error('Invoice issuance failed with error:', err.message || 'Unknown error');
    return { error: 'Failed to issue invoice. Please verify your permissions and try again.', type: 'SERVER_ERROR' };
  }
}
