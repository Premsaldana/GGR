import assert from 'node:assert/strict';
import { publishPricingEvent, subscribeToPricingEvents, type PricingEvent } from '../lib/pricing-events';

const receivedA: PricingEvent[] = [];
const receivedB: PricingEvent[] = [];
const unsubscribeA = subscribeToPricingEvents((event) => receivedA.push(event));
const unsubscribeB = subscribeToPricingEvents((event) => receivedB.push(event));
const event: PricingEvent = {
  eventId: 'event-1', action: 'price_updated', unitId: 'villa-1', dates: ['2026-09-11', '2026-09-12'],
  startDate: '2026-09-11', endDate: '2026-09-12', amountMinorUnits: 250000, currency: 'INR', soldOff: false,
};
publishPricingEvent(event);
assert.deepEqual(receivedA, [event]);
assert.deepEqual(receivedB, [event]);
unsubscribeA();
publishPricingEvent({ ...event, eventId: 'event-2', action: 'sold_off', soldOff: true });
assert.equal(receivedA.length, 1);
assert.equal(receivedB.length, 2);
unsubscribeB();
console.log('pricing SSE broker tests passed');
