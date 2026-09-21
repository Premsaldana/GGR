import { and, asc, eq, gte, lte, or, lt, gt } from 'drizzle-orm';
import { db, databaseProvider, dbReady } from '@/db';
import { roomAvailability, roomPrices, units, reservations } from '@/db/schema';
import { monthRange, nextIsoDate } from '@/lib/pricing-core';
import { PRIVATE_POOL_VILLA } from '@/lib/units';

export { CURRENCY, monthRange, normalizePricePayload, priceBatchSchema, priceInputSchema, validatePriceInput, formatPrice, RATE_CODE } from '@/lib/pricing-core';

export async function getPrivatePoolVilla() {
  await dbReady;
  const query = db.select({ id: units.id, slug: units.slug, displayName: units.displayName })
    .from(units)
    .where(and(eq(units.slug, PRIVATE_POOL_VILLA.slug), eq(units.active, true)));
  if (databaseProvider === 'postgres') {
    const rows = await query.execute();
    return rows[0];
  }
  return query.get();
}

export async function getActiveUnits() {
  const villa = await getPrivatePoolVilla();
  return villa ? [{ ...villa, displayName: PRIVATE_POOL_VILLA.displayName }] : [];
}

export async function getMonthlyPrices(month: string) {
  const { start, end } = monthRange(month);
  const villa = await getPrivatePoolVilla();
  if (!villa) return { month, start, end, units: [], prices: [], availability: [] };

  const priceQuery = db.select({
    id: roomPrices.id,
    unitId: roomPrices.unitId,
    rateCode: roomPrices.rateCode,
    date: roomPrices.date,
    amountMinorUnits: roomPrices.amountMinorUnits,
    currency: roomPrices.currency,
  })
    .from(roomPrices)
    .where(and(eq(roomPrices.unitId, villa.id), gte(roomPrices.date, start), lte(roomPrices.date, end)))
    .orderBy(asc(roomPrices.date));
  const todayIso = new Date().toISOString().slice(0, 10);
  const prices = (databaseProvider === 'postgres' ? await priceQuery.execute() : priceQuery.all())
    .filter((price) => Number.isInteger(price.amountMinorUnits) && price.amountMinorUnits > 0 && price.date >= todayIso);

  const availabilityQuery = db.select({
    id: roomAvailability.id,
    unitId: roomAvailability.unitId,
    date: roomAvailability.date,
    status: roomAvailability.status,
    reason: roomAvailability.reason,
  })
    .from(roomAvailability)
    .where(and(eq(roomAvailability.unitId, villa.id), gte(roomAvailability.date, start), lte(roomAvailability.date, end), eq(roomAvailability.status, 'sold_off')))
    .orderBy(asc(roomAvailability.date));
  const dbAvailability = databaseProvider === 'postgres' ? await availabilityQuery.execute() : availabilityQuery.all();

  const overlapQuery = db.select({
    id: reservations.id,
    unitId: reservations.unitId,
    checkInDate: reservations.checkInDate,
    checkOutDate: reservations.checkOutDate,
  })
    .from(reservations)
    .where(and(
      eq(reservations.unitId, villa.id),
      or(eq(reservations.bookingStatus, 'pending'), eq(reservations.bookingStatus, 'confirmed')),
      lt(reservations.checkInDate, end),
      gt(reservations.checkOutDate, start)
    ));
    
  const overlappingReservations = databaseProvider === 'postgres' ? await overlapQuery.execute() : overlapQuery.all();

  const availability = [...dbAvailability];

  for (const res of overlappingReservations) {
    let currDate = res.checkInDate;
    while (currDate < res.checkOutDate && currDate) {
      if (currDate >= start && currDate <= end) {
        if (!availability.some(a => a.date === currDate)) {
          availability.push({
            id: `res-${res.id}-${currDate}`,
            unitId: res.unitId,
            date: currDate,
            status: 'sold_off',
            reason: 'Booked'
          });
        }
      }
      currDate = nextIsoDate(currDate) || '';
    }
  }

  availability.sort((a, b) => a.date.localeCompare(b.date));

  return { month, start, end, units: [{ ...villa, displayName: PRIVATE_POOL_VILLA.displayName }], prices, availability };
}

export async function getPriceByKey(unitId: string, rateCode: string, date: string) {
  await dbReady;
  const query = db.select().from(roomPrices).where(and(eq(roomPrices.unitId, unitId), eq(roomPrices.rateCode, rateCode), eq(roomPrices.date, date)));
  if (databaseProvider === 'postgres') {
    const rows = await query.execute();
    return rows[0];
  }
  return query.get();
}

export type MonthlyPrices = Awaited<ReturnType<typeof getMonthlyPrices>>;
export type PriceRecord = MonthlyPrices['prices'][number];
