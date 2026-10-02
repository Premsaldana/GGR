import crypto from 'crypto';

export type NormalizedPaymentEventType = 'payment.succeeded' | 'payment.failed' | 'payment.pending' | 'payment.expired';

export interface NormalizedPaymentEvent {
  eventId: string;
  eventType: NormalizedPaymentEventType;
  attemptReference: string;
  providerPaymentId?: string;
  amountMinorUnits?: number;
  currency: string;
  utr?: string;
  paidAt?: Date;
  failureCode?: string;
}

export interface PaymentProviderConfig {
  enabled: boolean;
  provider: string;
  upiId: string;
  payeeName: string;
  expiryMinutes: number;
  webhookSecret: string;
}

function envFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export function getPaymentProviderConfig(provider = process.env.PAYMENT_PROVIDER || 'manual_upi'): PaymentProviderConfig {
  const normalizedProvider = provider.trim().toLowerCase();
  const providerSecretName = `PAYMENT_WEBHOOK_SECRET_${normalizedProvider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return {
    enabled: envFlag(process.env.PAYMENT_AUTOVERIFY_ENABLED),
    provider: normalizedProvider,
    upiId: (process.env.PAYMENT_UPI_ID || process.env.MANUAL_UPI_ID || '').trim(),
    payeeName: (process.env.PAYMENT_PAYEE_NAME || process.env.MANUAL_PAYEE_NAME || '').trim(),
    expiryMinutes: Math.max(5, Number(process.env.PAYMENT_ATTEMPT_EXPIRY_MINUTES || 15)),
    webhookSecret: (process.env[providerSecretName] || process.env.PAYMENT_WEBHOOK_SECRET || '').trim(),
  };
}

export function buildUpiIntent(input: { upiId: string; payeeName: string; amountMinorUnits: number; attemptReference: string }) {
  const amount = (input.amountMinorUnits / 100).toFixed(2);
  return `upi://pay?pa=${encodeURIComponent(input.upiId)}&pn=${encodeURIComponent(input.payeeName)}&am=${amount}&tr=${encodeURIComponent(input.attemptReference)}&cu=INR`;
}

function signatureBuffer(signature: string) {
  const value = signature.trim().replace(/^sha256=/i, '');
  return Buffer.from(value, 'hex');
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const received = signatureBuffer(signature);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function parseDate(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeEventType(value: unknown): NormalizedPaymentEventType | null {
  const status = String(value || '').toLowerCase();
  if (['success', 'succeeded', 'paid', 'captured', 'payment.succeeded'].includes(status)) return 'payment.succeeded';
  if (['failed', 'failure', 'declined', 'payment.failed'].includes(status)) return 'payment.failed';
  if (['pending', 'processing', 'authorized', 'payment.pending'].includes(status)) return 'payment.pending';
  if (['expired', 'cancelled', 'canceled', 'payment.expired'].includes(status)) return 'payment.expired';
  return null;
}

export function normalizeWebhookEvent(rawBody: string, headers: Headers): NormalizedPaymentEvent {
  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === 'object' ? payload.data : payload) as Record<string, unknown>;
  const eventId = String(payload.eventId || payload.event_id || headers.get('x-payment-event-id') || headers.get('x-event-id') || crypto.createHash('sha256').update(rawBody).digest('hex'));
  const eventType = normalizeEventType(payload.eventType || payload.event_type || payload.status || data.eventType || data.status);
  if (!eventType) throw new Error('Unsupported payment event status');
  const attemptReference = String(data.attemptReference || data.attempt_reference || data.orderId || data.order_id || data.reference || data.merchantReference || '');
  if (!attemptReference) throw new Error('Payment event has no attempt reference');
  const rawAmount = data.amountMinorUnits ?? data.amount_minor_units ?? data.amountPaise ?? data.amount_paise;
  const amountMinorUnits = rawAmount === undefined ? undefined : Number(rawAmount);
  if (amountMinorUnits !== undefined && (!Number.isInteger(amountMinorUnits) || amountMinorUnits <= 0)) throw new Error('Invalid payment amount');
  return {
    eventId,
    eventType,
    attemptReference,
    providerPaymentId: data.providerPaymentId ? String(data.providerPaymentId) : data.paymentId ? String(data.paymentId) : undefined,
    amountMinorUnits,
    currency: String(data.currency || payload.currency || 'INR').toUpperCase(),
    utr: data.utr ? String(data.utr) : data.rrn ? String(data.rrn) : undefined,
    paidAt: parseDate(data.paidAt || data.paid_at || data.timestamp),
    failureCode: data.failureCode ? String(data.failureCode) : data.failure_code ? String(data.failure_code) : undefined,
  };
}
