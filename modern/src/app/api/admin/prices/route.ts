import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { auditEvents, roomPrices, units } from '@/db/schema';
import { getMonthlyPrices, normalizePricePayload, priceBatchSchema } from '@/lib/pricing';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

function authError(error: unknown) {
  if (error instanceof Error && error.message.includes('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const month = request.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    return NextResponse.json(getMonthlyPrices(month));
  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN', 'MFA_REQUIRED', 'FORBIDDEN_EMAIL', 'UNAUTHORIZED_USER_ID'].some((value) => error.message.includes(value))) return authError(error);
    return NextResponse.json({ error: 'Unable to load prices.' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (error) {
    return authError(error);
  }

  try {
    const body = priceBatchSchema.parse(await request.json());
    const prices = body.prices.map(normalizePricePayload);
    const dates = prices.map((price) => price.date);
    const minDate = dates.sort()[0];
    const maxDate = dates.sort().at(-1) ?? minDate;
    if (!minDate || !maxDate || minDate < '2000-01-01' || maxDate > '2100-12-31') throw new Error('Date range is outside the supported window');

    const result = db.transaction((tx) => {
      const saved = [];
      for (const price of prices) {
        const unit = tx.select({ id: units.id }).from(units).where(and(eq(units.id, price.unitId), eq(units.active, true))).get();
        if (!unit) throw new Error('INVALID_UNIT');
        const before = tx.select().from(roomPrices).where(and(eq(roomPrices.unitId, price.unitId), eq(roomPrices.rateCode, price.rateCode), eq(roomPrices.date, price.date))).get();
        const now = new Date();
        const id = before?.id ?? crypto.randomUUID();
        tx.insert(roomPrices).values({ id, ...price, createdAt: before?.createdAt ?? now, updatedAt: now }).onConflictDoUpdate({
          target: [roomPrices.unitId, roomPrices.rateCode, roomPrices.date],
          set: { amountMinorUnits: price.amountMinorUnits, currency: price.currency, updatedAt: now },
        }).run();
        tx.insert(auditEvents).values({
          id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'room_price', entityId: id,
          eventType: before ? 'update' : 'create', beforeJson: before ? JSON.stringify(before) : null,
          afterJson: JSON.stringify({ ...price, id }), requestId: request.headers.get('x-request-id'), createdAt: now,
        }).run();
        saved.push({ ...price, id });
      }
      return saved;
    });
    return NextResponse.json({ prices: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_UNIT') return NextResponse.json({ error: 'One or more units are invalid or inactive.' }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid pricing payload.' }, { status: 400 });
  }
}
