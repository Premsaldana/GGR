import { z } from 'zod';

export const RATE_CODE = 'standard';
export const CURRENCY = 'INR';

export const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Month must use YYYY-MM format');
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');
export const priceInputSchema = z.object({
  unitId: z.string().min(1),
  rateCode: z.string().min(1).max(40).default(RATE_CODE),
  date: dateSchema,
  amountMinorUnits: z.number().int().positive().max(100_000_000),
  currency: z.literal(CURRENCY).default(CURRENCY),
});
export const priceBatchSchema = z.object({ prices: z.array(priceInputSchema).min(1).max(366) });

function isValidCalendarDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function monthRange(month: string) {
  monthSchema.parse(month);
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) throw new Error('Invalid month');
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { month, start, end };
}

export function validatePriceInput(input: z.input<typeof priceInputSchema>) {
  const parsed = priceInputSchema.parse(input);
  if (!isValidCalendarDate(parsed.date)) throw new Error('Invalid calendar date');
  return parsed;
}

export function formatPrice(amountMinorUnits: number, currency = CURRENCY) {
  if (!Number.isInteger(amountMinorUnits) || amountMinorUnits <= 0) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountMinorUnits / 100);
}

export function normalizePricePayload(input: z.input<typeof priceInputSchema>) {
  const parsed = validatePriceInput(input);
  return { ...parsed, rateCode: parsed.rateCode || RATE_CODE, currency: CURRENCY };
}

export function formatDateForDisplay(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
}

export function parseDisplayDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}
