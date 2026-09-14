import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db, databaseProvider, dbReady, postgresPool } from '@/db';
import { auditEvents, roomAvailability, roomPrices } from '@/db/schema';
import { getMonthlyPrices, getPrivatePoolVilla, CURRENCY, RATE_CODE } from '@/lib/pricing';
import { dateSchema } from '@/lib/pricing-core';
import { requireAdmin } from '@/lib/session';
import { PRIVATE_POOL_VILLA } from '@/lib/units';
import { publishPricingEvent } from '@/lib/pricing-events';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  amountMinorUnits: z.number().int().positive().max(100_000_000).optional(),
  soldOff: z.boolean().optional(),
  reason: z.string().max(200).optional(),
}).refine((input) => input.endDate >= input.startDate, { message: 'End date must be on or after start date' })
  .refine((input) => [input.startDate, input.endDate].every((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }), { message: 'Start and end dates must be valid calendar dates' })
  .refine((input) => input.amountMinorUnits !== undefined || input.soldOff !== undefined, { message: 'Provide a price or sold-off state' });

function authError(error: unknown) {
  if (error instanceof Error && error.message.includes('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function dateList(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (dates.length > 366) throw new Error('Date range cannot exceed 366 days');
  }
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbReady;
    const month = request.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    return NextResponse.json(await getMonthlyPrices(month));
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
    await dbReady;
    const input = rangeSchema.parse(await request.json());
    const dates = dateList(input.startDate, input.endDate);
    const villa = await getPrivatePoolVilla();
    if (!villa) return NextResponse.json({ error: `${PRIVATE_POOL_VILLA.displayName} is not configured.` }, { status: 409 });

    if (databaseProvider === 'postgres' && postgresPool) {
      const client = await postgresPool.connect();
      try {
        await client.query('BEGIN');
        const now = new Date();
        for (const date of dates) {
          if (input.amountMinorUnits !== undefined) {
            await client.query(`INSERT INTO room_prices (id, unit_id, rate_code, date, amount_minor_units, currency, created_at, updated_at)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$7) ON CONFLICT (unit_id, rate_code, date)
              DO UPDATE SET amount_minor_units = EXCLUDED.amount_minor_units, currency = EXCLUDED.currency, updated_at = EXCLUDED.updated_at`,
              [crypto.randomUUID(), villa.id, RATE_CODE, date, input.amountMinorUnits, CURRENCY, now]);
          }
          if (input.soldOff === true) {
            await client.query(`INSERT INTO room_availability (id, unit_id, date, status, reason, created_at, updated_at)
              VALUES ($1,$2,$3,'sold_off',$4,$5,$5) ON CONFLICT (unit_id, date)
              DO UPDATE SET status = 'sold_off', reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at`,
              [crypto.randomUUID(), villa.id, date, input.reason || null, now]);
          } else if (input.soldOff === false) {
            await client.query('DELETE FROM room_availability WHERE unit_id = $1 AND date = $2', [villa.id, date]);
          }
        }
        await client.query(`INSERT INTO audit_events (id, actor_user_id, entity_type, entity_id, event_type, after_json, request_id, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [crypto.randomUUID(), session.userId, 'private_pool_villa_calendar', villa.id,
          input.soldOff === true ? 'sold_off' : input.soldOff === false ? 'sold_off_reversed' : 'price_range_update',
          JSON.stringify({ ...input, dates: { start: input.startDate, end: input.endDate } }), request.headers.get('x-request-id'), now]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      const result = { updatedDates: dates.length, unit: { ...villa, displayName: PRIVATE_POOL_VILLA.displayName } };
      publishPricingEvent({
        eventId: crypto.randomUUID(),
        action: input.amountMinorUnits !== undefined ? 'price_updated' : input.soldOff === true ? 'sold_off' : 'sold_off_reversed',
        unitId: villa.id, dates, startDate: input.startDate, endDate: input.endDate,
        ...(input.amountMinorUnits !== undefined ? { amountMinorUnits: input.amountMinorUnits, currency: CURRENCY } : {}),
        soldOff: input.soldOff === true,
      });
      return NextResponse.json(result);
    }

    const result = db.transaction((tx) => {
      const now = new Date();
      for (const date of dates) {
        if (input.amountMinorUnits !== undefined) {
          tx.insert(roomPrices).values({
            id: crypto.randomUUID(), unitId: villa.id, rateCode: RATE_CODE, date,
            amountMinorUnits: input.amountMinorUnits, currency: CURRENCY, createdAt: now, updatedAt: now,
          }).onConflictDoUpdate({
            target: [roomPrices.unitId, roomPrices.rateCode, roomPrices.date],
            set: { amountMinorUnits: input.amountMinorUnits, currency: CURRENCY, updatedAt: now },
          }).run();
        }
        if (input.soldOff === true) {
          tx.insert(roomAvailability).values({
            id: crypto.randomUUID(), unitId: villa.id, date, status: 'sold_off', reason: input.reason || null, createdAt: now, updatedAt: now,
          }).onConflictDoUpdate({
            target: [roomAvailability.unitId, roomAvailability.date],
            set: { status: 'sold_off', reason: input.reason || null, updatedAt: now },
          }).run();
        } else if (input.soldOff === false) {
          tx.delete(roomAvailability).where(and(eq(roomAvailability.unitId, villa.id), eq(roomAvailability.date, date))).run();
        }
      }
      tx.insert(auditEvents).values({
        id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'private_pool_villa_calendar', entityId: villa.id,
        eventType: input.soldOff === true ? 'sold_off' : input.soldOff === false ? 'sold_off_reversed' : 'price_range_update',
        afterJson: JSON.stringify({ ...input, dates: { start: input.startDate, end: input.endDate } }),
        requestId: request.headers.get('x-request-id'), createdAt: now,
      }).run();
      return { updatedDates: dates.length, unit: { ...villa, displayName: PRIVATE_POOL_VILLA.displayName } };
    });
    publishPricingEvent({
      eventId: crypto.randomUUID(),
      action: input.amountMinorUnits !== undefined ? 'price_updated' : input.soldOff === true ? 'sold_off' : 'sold_off_reversed',
      unitId: villa.id,
      dates,
      startDate: input.startDate,
      endDate: input.endDate,
      ...(input.amountMinorUnits !== undefined ? { amountMinorUnits: input.amountMinorUnits, currency: CURRENCY } : {}),
      soldOff: input.soldOff === true,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid pricing payload.' }, { status: 400 });
  }
}
