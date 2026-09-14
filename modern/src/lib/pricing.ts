import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db, databaseProvider, dbReady } from '@/db';
import { roomAvailability, roomPrices, units } from '@/db/schema';
import { monthRange } from '@/lib/pricing-core';
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
  const prices = (databaseProvider === 'postgres' ? await priceQuery.execute() : priceQuery.all())
    .filter((price) => Number.isInteger(price.amountMinorUnits) && price.amountMinorUnits > 0);

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
  const availability = databaseProvider === 'postgres' ? await availabilityQuery.execute() : availabilityQuery.all();

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
