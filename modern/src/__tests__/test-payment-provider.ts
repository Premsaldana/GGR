import crypto from 'crypto';
import { buildUpiIntent, normalizeWebhookEvent, verifyWebhookSignature } from '../lib/payments/provider';

const rawBody = JSON.stringify({ eventId: 'evt-1', status: 'success', data: { attemptReference: 'GGR-INV-ATTEMPT', amountMinorUnits: 125000, currency: 'INR', providerPaymentId: 'pay-1', utr: 'UTR-1' } });
const secret = 'test-webhook-secret';
const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
if (!verifyWebhookSignature(rawBody, signature, secret)) throw new Error('valid webhook signature was rejected');
if (verifyWebhookSignature(rawBody, `${signature.slice(0, -2)}00`, secret)) throw new Error('invalid webhook signature was accepted');
const event = normalizeWebhookEvent(rawBody, new Headers({ 'x-payment-signature': signature }));
if (event.eventType !== 'payment.succeeded' || event.amountMinorUnits !== 125000 || event.attemptReference !== 'GGR-INV-ATTEMPT') throw new Error(`unexpected normalized event: ${JSON.stringify(event)}`);
const intent = buildUpiIntent({ upiId: 'goagarden@upi', payeeName: 'Goa Garden Resort', amountMinorUnits: 125000, attemptReference: 'GGR-INV-ATTEMPT' });
if (!intent.includes('am=1250.00') || !intent.includes('tr=GGR-INV-ATTEMPT')) throw new Error(`unexpected UPI intent: ${intent}`);
console.log('payment provider helper tests passed');
