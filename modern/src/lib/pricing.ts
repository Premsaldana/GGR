import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { roomPrices, units } from '@/db/schema';
import { monthRange } from '@/lib/pricing-core';

export { CURRENCY, monthRange, normalizePricePayload, priceBatchSchema, priceInputSchema, validatePriceInput, formatPrice, RATE_CODE } from '@/lib/pricing-core';

export function getActiveUnits() {
  return db.select({ id: units.id, slug: units.slug, displayName: units.displayName })
    .from(units)
    .where(eq(units.active, true))
    .orderBy(asc(units.displayName))
    .all();
}

export function getMonthlyPrices(month: string) {
  const { start, end } = monthRange(month);
  const activeUnits = getActiveUnits();
  const prices = db.select({
    id: roomPrices.id,
    unitId: roomPrices.unitId,
    rateCode: roomPrices.rateCode,
    date: roomPrices.date,
    amountMinorUnits: roomPrices.amountMinorUnits,
    currency: roomPrices.currency,
  })
    .from(roomPrices)
    .innerJoin(units, eq(roomPrices.unitId, units.id))
    .where(and(gte(roomPrices.date, start), lte(roomPrices.date, end), eq(units.active, true)))
    .orderBy(asc(roomPrices.date), asc(roomPrices.unitId))
    .all()
    .filter((price) => Number.isInteger(price.amountMinorUnits) && price.amountMinorUnits > 0);
  return { month, start, end, units: activeUnits, prices };
}

export function getPriceByKey(unitId: string, rateCode: string, date: string) {
  return db.select().from(roomPrices).where(and(eq(roomPrices.unitId, unitId), eq(roomPrices.rateCode, rateCode), eq(roomPrices.date, date))).get();
}

export type MonthlyPrices = ReturnType<typeof getMonthlyPrices>;
export type PriceRecord = MonthlyPrices['prices'][number];
