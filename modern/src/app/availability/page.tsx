import type { Metadata } from 'next';
import { PriceCalendar } from '@/components/resort/PriceCalendar';

export const metadata: Metadata = {
  title: 'Availability & prices',
  description: 'View current room prices by date at Goa Garden Resort.',
};

export default function AvailabilityPage() {
  return (
    <main className="availability-page">
      <div className="availability-page__intro">
        <p className="eyebrow">Goa Garden Resort · Colva</p>
        <h1>Availability &amp; prices</h1>
        <p>Plan your stay with a clear view of current Private Pool Villa pricing. This calendar is read-only; booking continues through our existing enquiry flow.</p>
      </div>
      <PriceCalendar initialMonth={new Date().toISOString().slice(0, 7)} />
    </main>
  );
}
