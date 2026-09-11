"use client";

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/pricing-core';

type Props = { initialMonth: string };
type CalendarData = {
  units: Array<{ id: string; slug: string; displayName: string }>;
  prices: Array<{ id: string; unitId: string; rateCode: string; date: string; amountMinorUnits: number; currency: string }>;
};

function daysInMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return next.toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

export function PriceCalendar({ initialMonth }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(searchParams.get('month') || initialMonth);
  const [data, setData] = useState<CalendarData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<{ unitId: string; date: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/prices?month=${month}`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Request failed'); return response.json() as Promise<CalendarData>; })
      .then((nextData) => { if (!cancelled) { setData(nextData); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month);
    router.replace(`/availability?${params.toString()}`, { scroll: false });
    return () => { cancelled = true; };
    // The URL is intentionally synchronized with the selected month only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const days = useMemo(() => Array.from({ length: daysInMonth(month) }, (_, index) => index + 1), [month]);
  const priceMap = useMemo(() => new Map((data?.prices ?? []).map((price) => [`${price.unitId}:${price.date}`, price])), [data]);
  const selectedUnit = data?.units.find((unit) => unit.id === selected?.unitId);
  const bookingHref = selected ? `/contact?room=${encodeURIComponent(selectedUnit?.slug ?? '')}&checkIn=${selected.date}` : '/contact';

  async function handleBookNow() {
    try {
      const { bookingProvider } = await import('@/integrations/booking/adapter');
      const result = await bookingProvider.createBookingRedirect({ roomSlug: selectedUnit?.slug, checkIn: selected?.date });
      router.push(result.url);
    } catch {
      router.push(bookingHref);
    }
  }

  return (
    <section className="availability-shell" aria-labelledby="availability-heading">
      <div className="availability-toolbar">
        <div>
          <p className="eyebrow">Read-only price guide</p>
          <h2 id="availability-heading">Choose your dates</h2>
          <p className="availability-lede">View current nightly prices by room and move to the existing booking flow when you are ready.</p>
        </div>
        <div className="availability-actions" aria-label="Calendar controls">
          <button type="button" className="availability-icon-button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ArrowLeft size={18} aria-hidden="true" /></button>
          <span className="availability-month" aria-live="polite">{monthLabel(month)}</span>
          <button type="button" className="availability-icon-button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>

      <div className="availability-legend" aria-label="Price calendar legend">
        <span><i className="availability-dot availability-dot--priced" aria-hidden="true" /> Price available</span>
        <span><i className="availability-dot availability-dot--empty" aria-hidden="true" /> Price unavailable</span>
      </div>

      {status === 'error' && <div className="availability-state availability-state--error" role="alert"><p>Prices are temporarily unavailable.</p><button type="button" onClick={() => setMonth(month)}>Try again</button></div>}
      {status === 'loading' && <div className="availability-state" role="status">Loading current prices…</div>}
      {status === 'ready' && data && data.units.length === 0 && <div className="availability-state">No rooms are currently available to display.</div>}
      {status === 'ready' && data && data.units.length > 0 && (
        <div className="availability-table-wrap" tabIndex={0} aria-label="Scrollable price calendar">
          <table className="availability-table">
            <thead><tr><th scope="col" className="availability-sticky">Room / rate</th>{days.map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
            <tbody>{data.units.map((unit) => <tr key={unit.id}>
              <th scope="row" className="availability-sticky"><span>{unit.displayName}</span><small>Standard rate</small></th>
              {days.map((day) => {
                const date = `${month}-${String(day).padStart(2, '0')}`;
                const price = priceMap.get(`${unit.id}:${date}`);
                const label = price ? formatPrice(price.amountMinorUnits, price.currency) : null;
                return <td key={date}><button type="button" className={`availability-cell ${label ? 'availability-cell--priced' : 'availability-cell--empty'}`} onClick={() => label && setSelected({ unitId: unit.id, date })} aria-label={`${unit.displayName}, ${date}: ${label ?? 'price unavailable'}`} disabled={!label}>{label ?? '—'}</button></td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>
      )}

      <div className="availability-booking-bar">
        <div><CalendarDays size={20} aria-hidden="true" /><p>{selected ? `Selected: ${selectedUnit?.displayName} · ${selected.date}` : 'Select a priced date to carry it into your enquiry.'}</p></div>
        <button type="button" className="button button--sun availability-book-button" onClick={handleBookNow}>Book now</button>
      </div>
    </section>
  );
}
