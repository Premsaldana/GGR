import { db, databaseProvider } from '@/db';
import { reservations, roomAvailability, units } from '@/db/schema';
import { and, eq, or, lt, gte, gt } from 'drizzle-orm';
import { dateSchema } from './pricing-core';

export async function checkAvailability(checkIn: string, checkOut: string, rooms: number) {
  if (!dateSchema.safeParse(checkIn).success || !dateSchema.safeParse(checkOut).success) {
    return { available: false, reason: 'Invalid dates' };
  }

  if (checkOut <= checkIn) {
    return { available: false, reason: 'Check-out must be after check-in' };
  }

  if (rooms !== 1) {
    return { available: false, reason: 'Goa Garden Resort is offered as one complete private resort. Please select 1 room.' };
  }

  type DbQuery = { execute: () => Promise<unknown[]>, all: () => unknown[] };

  const unitQuery = db.select().from(units).where(and(eq(units.slug, 'private-pool-villa'), eq(units.active, true)));
  const unitList = databaseProvider === 'postgres' ? await (unitQuery as unknown as DbQuery).execute() : (unitQuery as unknown as DbQuery).all();
  const unit = unitList[0] as { id: string } | undefined;
  
  if (!unit) {
    return { available: false, reason: 'Resort unit not found' };
  }

  const soldOffQuery = db.select().from(roomAvailability).where(
    and(
      eq(roomAvailability.unitId, unit.id),
      eq(roomAvailability.status, 'sold_off'),
      gte(roomAvailability.date, checkIn),
      lt(roomAvailability.date, checkOut)
    )
  );
  
  const soldOffDates = databaseProvider === 'postgres' ? await (soldOffQuery as unknown as DbQuery).execute() : (soldOffQuery as unknown as DbQuery).all();
  if (soldOffDates.length > 0) {
    return { available: false, reason: 'These dates are currently unavailable. You can contact us on WhatsApp for alternative dates.' };
  }

  const overlapQuery = db.select().from(reservations).where(
    and(
      eq(reservations.unitId, unit.id),
      or(eq(reservations.bookingStatus, 'pending'), eq(reservations.bookingStatus, 'confirmed')),
      lt(reservations.checkInDate, checkOut),
      gt(reservations.checkOutDate, checkIn)
    )
  );
  
  const overlappingReservations = databaseProvider === 'postgres' ? await (overlapQuery as unknown as DbQuery).execute() : (overlapQuery as unknown as DbQuery).all();

  if (overlappingReservations.length > 0) {
    return { available: false, reason: 'The resort is not available for these dates. Please try different dates.' };
  }

  return { available: true };
}
