export type PricingEventAction = 'price_updated' | 'sold_off' | 'sold_off_reversed';

export type PricingEvent = {
  eventId: string;
  action: PricingEventAction;
  unitId: string;
  dates: string[];
  startDate: string;
  endDate: string;
  amountMinorUnits?: number;
  currency?: string;
  soldOff: boolean;
};

type Listener = (event: PricingEvent) => void;
const listeners = new Set<Listener>();

export function subscribeToPricingEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishPricingEvent(event: PricingEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // A disconnected client must never interrupt publication to other clients.
    }
  }
}
