import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import crypto from 'crypto';
import { db, databaseProvider, dbReady } from '@/db';
import { auditEvents, paymentAttempts, paymentEvents } from '@/db/schema';
import { applyPayment } from '@/lib/payments/apply-payment';
import { getPaymentProviderConfig, normalizeWebhookEvent, verifyWebhookSignature } from '@/lib/payments/provider';

const postgresDb = db as unknown as { transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> };

function eventIdFromRequest(rawBody: string, request: NextRequest) {
  return request.headers.get('x-payment-event-id') || request.headers.get('x-event-id') || crypto.createHash('sha256').update(rawBody).digest('hex');
}

export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider.trim().toLowerCase();
  const rawBody = await request.text();
  const config = getPaymentProviderConfig(provider);
  const signature = request.headers.get('x-payment-signature') || request.headers.get('x-webhook-signature') || request.headers.get('x-signature');
  const providerEventId = eventIdFromRequest(rawBody, request);

  if (databaseProvider !== 'postgres') {
    return NextResponse.json({ error: 'Automated payment webhooks require the PostgreSQL runtime' }, { status: 503 });
  }

  if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
    try {
      const insert = db.insert(paymentEvents).values({ id: crypto.randomUUID(), provider, providerEventId: `invalid:${providerEventId}`, eventType: 'invalid_signature', signatureValid: false, payload: rawBody.slice(0, 32_000), receivedAt: new Date() });
      if (databaseProvider === 'postgres') { await dbReady; await insert.execute(); } else insert.run();
    } catch (error) {
      console.error('Unable to record invalid payment webhook:', error);
    }
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = normalizeWebhookEvent(rawBody, request.headers);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payment event' }, { status: 400 });
  }

  try {
    const processEvent = async (tx: any) => {
      const inserted = await tx.insert(paymentEvents).values({ id: crypto.randomUUID(), provider, providerEventId: event.eventId, eventType: event.eventType, signatureValid: true, payload: rawBody.slice(0, 32_000), receivedAt: new Date() }).onConflictDoNothing().returning({ id: paymentEvents.id }).execute();
      if (!inserted.length) return { duplicate: true };

      const attempt = (await tx.select().from(paymentAttempts).where(or(eq(paymentAttempts.id, event.attemptReference), eq(paymentAttempts.providerRef, event.attemptReference))).execute())[0];
      if (!attempt) {
        await tx.update(paymentEvents).set({ outcome: 'ignored', error: 'Unknown payment attempt', processedAt: new Date() }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'ignored' };
      }
      await tx.update(paymentEvents).set({ attemptId: attempt.id }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();

      const now = new Date();
      if (event.eventType === 'payment.failed') {
        await tx.update(paymentAttempts).set({ status: 'failed', failureCode: event.failureCode || 'provider_failed', lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
        await tx.update(paymentEvents).set({ outcome: 'failed', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'failed', attemptId: attempt.id };
      }
      if (event.eventType === 'payment.pending') {
        if (['created', 'pending'].includes(attempt.status)) await tx.update(paymentAttempts).set({ status: 'pending', lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
        await tx.update(paymentEvents).set({ outcome: 'pending', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'pending', attemptId: attempt.id };
      }
      if (event.eventType === 'payment.expired') {
        if (['created', 'pending'].includes(attempt.status)) await tx.update(paymentAttempts).set({ status: 'expired', lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
        await tx.update(paymentEvents).set({ outcome: 'expired', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'expired', attemptId: attempt.id };
      }

      const amountMatches = event.amountMinorUnits === attempt.amountMinorUnits && event.currency === attempt.currency;
      const late = attempt.status === 'expired' || now > new Date(attempt.expiresAt);
      if (!amountMatches) {
        await tx.update(paymentAttempts).set({ status: 'mismatch', paidAmountMinorUnits: event.amountMinorUnits ?? null, providerPaymentId: event.providerPaymentId ?? null, utr: event.utr ?? null, lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
        await tx.update(paymentEvents).set({ outcome: 'mismatch', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        await tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: null, entityType: 'payment_attempt', entityId: attempt.id, eventType: 'MISMATCH', afterJson: JSON.stringify({ expected: attempt.amountMinorUnits, received: event.amountMinorUnits, currency: event.currency }), createdAt: now }).execute();
        return { outcome: 'mismatch', attemptId: attempt.id };
      }
      if (late) {
        await tx.update(paymentAttempts).set({ status: 'late', paidAmountMinorUnits: event.amountMinorUnits, providerPaymentId: event.providerPaymentId ?? null, utr: event.utr ?? null, paidAt: event.paidAt ?? now, lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
        await tx.update(paymentEvents).set({ outcome: 'late', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'late', attemptId: attempt.id };
      }
      if (attempt.status === 'paid') {
        await tx.update(paymentEvents).set({ outcome: 'duplicate', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
        return { outcome: 'duplicate', attemptId: attempt.id };
      }

      const posted = await applyPayment(tx, { invoiceId: attempt.invoiceId, amountMinorUnits: attempt.amountMinorUnits, mode: 'UPI', reference: event.utr || event.providerPaymentId || attempt.providerRef || undefined, providerPaymentId: event.providerPaymentId, attemptId: attempt.id, source: 'auto', actorUserId: null, note: `Automated payment via ${provider}` });
      await tx.update(paymentAttempts).set({ status: 'paid', paidAmountMinorUnits: event.amountMinorUnits, providerPaymentId: event.providerPaymentId ?? null, utr: event.utr ?? null, paidAt: event.paidAt ?? now, lastCheckedAt: now, updatedAt: now }).where(eq(paymentAttempts.id, attempt.id)).execute();
      await tx.update(paymentEvents).set({ outcome: posted.status === 'duplicate' ? 'duplicate' : 'applied', processedAt: now }).where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, event.eventId))).execute();
      return { outcome: posted.status === 'duplicate' ? 'duplicate' : 'applied', attemptId: attempt.id, paymentId: posted.paymentId };
    };

    const result = databaseProvider === 'postgres'
      ? await (await dbReady, postgresDb.transaction(processEvent))
      : await processEvent(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Payment webhook processing failed:', error);
    return NextResponse.json({ error: 'Temporary payment processing failure' }, { status: 500 });
  }
}
