import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { roomAvailability, roomPrices, units } from '@/db/schema';
import { monthRange } from '@/lib/pricing-core';
import { PRIVATE_POOL_VILLA } from '@/lib/units';

export { CURRENCY, monthRange, normalizePricePayload, priceBatchSchema, priceInputSchema, validatePriceInput, formatPrice, RATE_CODE } from '@/lib/pricing-core';

export function getPrivatePoolVilla() {
  return db.select({ id: units.id, slug: units.slug, displayName: units.displayName })
    .from(units)
    .where(and(eq(units.slug, PRIVATE_POOL_VILLA.slug), eq(units.active, true)))
    .get();
}

export function getActiveUnits() {
  const villa = getPrivatePoolVilla();
  return villa ? [{ ...villa, displayName: PRIVATE_POOL_VILLA.displayName }] : [];
}

export function getMonthlyPrices(month: string) {
  const { start, end } = monthRange(month);
  const villa = getPrivatePoolVilla();
  if (!villa) return { month, start, end, units: [], prices: [], availability: [] };

  const prices = db.select({
    id: roomPrices.id,
    unitId: roomPrices.unitId,
    rateCode: roomPrices.rateCode,
    date: roomPrices.date,
    amountMinorUnits: roomPrices.amountMinorUnits,
    currency: roomPrices.currency,
  })
    .from(roomPrices)
    .where(and(eq(roomPrices.unitId, villa.id), gte(roomPrices.date, start), lte(roomPrices.date, end)))
    .orderBy(asc(roomPrices.date))
    .all()
    .filter((price) => Number.isInteger(price.amountMinorUnits) && price.amountMinorUnits > 0);

  const availability = db.select({
    id: roomAvailability.id,
    unitId: roomAvailability.unitId,
    date: roomAvailability.date,
    status: roomAvailability.status,
    reason: roomAvailability.reason,
  })
    .from(roomAvailability)
    .where(and(eq(roomAvailability.unitId, villa.id), gte(roomAvailability.date, start), lte(roomAvailability.date, end), eq(roomAvailability.status, 'sold_off')))
    .orderBy(asc(roomAvailability.date))
    .all();

  return { month, start, end, units: [{ ...villa, displayName: PRIVATE_POOL_VILLA.displayName }], prices, availability };
}

export function getPriceByKey(unitId: string, rateCode: string, date: string) {
  return db.select().from(roomPrices).where(and(eq(roomPrices.unitId, unitId), eq(roomPrices.rateCode, rateCode), eq(roomPrices.date, date))).get();
}

export type MonthlyPrices = ReturnType<typeof getMonthlyPrices>;
export type PriceRecord = MonthlyPrices['prices'][number];
