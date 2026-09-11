"use client";

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, LockKeyhole } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateForDisplay, formatPrice } from '@/lib/pricing-core';
import type { PricingEvent } from '@/lib/pricing-events';

type Props = { initialMonth: string };
type CalendarData = {
  units: Array<{ id: string; slug: string; displayName: string }>;
  prices: Array<{ id: string; unitId: string; date: string; amountMinorUnits: number; currency: string }>;
  availability: Array<{ id: string; unitId: string; date: string; status: string; reason: string | null }>;
};

type DayCell = { date: string; day: number; label: string | null; state: 'available' | 'sold-off' | 'unpriced' };

function daysInMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}
function firstWeekday(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
}
function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
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
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetch(`/api/prices?month=${month}`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Request failed'); return response.json() as Promise<CalendarData>; })
      .then((nextData) => { if (!cancelled) { setData(nextData); setStatus('ready'); setSelected(null); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    void refresh();
    const source = new EventSource('/api/prices/events');
    let hasOpened = false;
    source.onopen = () => {
      if (hasOpened) void refresh();
      hasOpened = true;
    };
    source.addEventListener('pricing', (event) => {
      const pricingEvent = JSON.parse((event as MessageEvent<string>).data) as PricingEvent;
      setData((current) => {
        if (!current || current.units[0]?.id !== pricingEvent.unitId) return current;
        const affected = new Set(pricingEvent.dates);
        const prices = pricingEvent.action === 'price_updated'
          ? [...current.prices.filter((price) => !affected.has(price.date)), ...pricingEvent.dates.map((date) => ({ id: pricingEvent.eventId + date, unitId: pricingEvent.unitId, date, amountMinorUnits: pricingEvent.amountMinorUnits ?? 0, currency: pricingEvent.currency ?? 'INR' }))]
          : current.prices;
        const availability = pricingEvent.action === 'sold_off'
          ? [...current.availability.filter((item) => !affected.has(item.date)), ...pricingEvent.dates.map((date) => ({ id: pricingEvent.eventId + date, unitId: pricingEvent.unitId, date, status: 'sold_off', reason: null }))]
          : pricingEvent.action === 'sold_off_reversed'
            ? current.availability.filter((item) => !affected.has(item.date))
            : current.availability;
        return { ...current, prices, availability };
      });
    });
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month);
    router.replace(`/availability?${params.toString()}`, { scroll: false });
    return () => { cancelled = true; source.close(); };
    // The URL is intentionally synchronized with the selected month only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const villa = data?.units[0];
  const priceMap = useMemo(() => new Map((data?.prices ?? []).map((price) => [price.date, price])), [data]);
  const soldOffSet = useMemo(() => new Set((data?.availability ?? []).filter((item) => item.status === 'sold_off').map((item) => item.date)), [data]);
  const cells = useMemo<DayCell[]>(() => Array.from({ length: daysInMonth(month) }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const price = priceMap.get(date);
    const soldOff = soldOffSet.has(date);
    return { date, day, label: soldOff ? null : price ? formatPrice(price.amountMinorUnits, price.currency) : null, state: soldOff ? 'sold-off' : price && formatPrice(price.amountMinorUnits, price.currency) ? 'available' : 'unpriced' };
  }), [month, priceMap, soldOffSet]);
  const leadingBlanks = useMemo(() => Array.from({ length: firstWeekday(month) }, (_, index) => index), [month]);
  const selectedCell = cells.find((cell) => cell.date === selected);
  const bookingHref = `/contact?room=${encodeURIComponent(villa?.slug ?? 'private-pool-villa')}${selectedCell ? `&checkIn=${selectedCell.date}` : ''}`;

  async function handleBookNow() {
    try {
      const { bookingProvider } = await import('@/integrations/booking/adapter');
      const result = await bookingProvider.createBookingRedirect({ roomSlug: villa?.slug ?? 'private-pool-villa', checkIn: selectedCell?.date });
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
          <h2 id="availability-heading">Private Pool Villa</h2>
          <p className="availability-lede">Current nightly prices for the entire villa. Sold-off dates are unavailable; dates without a configured price are shown separately.</p>
        </div>
        <div className="availability-actions" aria-label="Calendar controls">
          <button type="button" className="availability-icon-button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ArrowLeft size={18} aria-hidden="true" /></button>
          <span className="availability-month" aria-live="polite">{monthLabel(month)}</span>
          <button type="button" className="availability-icon-button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>

      <div className="availability-legend" aria-label="Price calendar legend">
        <span><i className="availability-dot availability-dot--priced" aria-hidden="true" /> Available</span>
        <span><i className="availability-dot availability-dot--sold" aria-hidden="true" /> Sold Off</span>
        <span><i className="availability-dot availability-dot--empty" aria-hidden="true" /> No price configured</span>
      </div>

      {status === 'error' && <div className="availability-state availability-state--error" role="alert"><p>Prices are temporarily unavailable.</p><button type="button" onClick={() => setMonth(month)}>Try again</button></div>}
      {status === 'loading' && <div className="availability-state" role="status">Loading current prices…</div>}
      {status === 'ready' && data && !villa && <div className="availability-state">Private Pool Villa inventory is currently unavailable.</div>}
      {status === 'ready' && villa && (
        <div className="availability-calendar" aria-label={`${monthLabel(month)} Private Pool Villa pricing calendar`}>
          <div className="availability-weekdays" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="availability-grid">
            {leadingBlanks.map((blank) => <span key={`blank-${blank}`} className="availability-blank" aria-hidden="true" />)}
            {cells.map((cell) => {
              const isSelected = cell.date === selected;
              const isAvailable = cell.state === 'available';
              return <button key={cell.date} type="button" className={`availability-day availability-day--${cell.state}${isSelected ? ' availability-day--selected' : ''}`} onClick={() => isAvailable && setSelected(cell.date)} disabled={!isAvailable} aria-pressed={isSelected} aria-label={`${formatDateForDisplay(cell.date)}: ${cell.state === 'available' ? cell.label : cell.state === 'sold-off' ? 'Sold Off' : 'No price configured'}`}>
                <span className="availability-day__number">{cell.day}</span>
                <span className="availability-day__status">{cell.state === 'available' ? <><Check size={13} aria-hidden="true" />{cell.label}</> : cell.state === 'sold-off' ? <><LockKeyhole size={13} aria-hidden="true" />Sold Off</> : 'No price'}</span>
              </button>;
            })}
          </div>
        </div>
      )}

      <div className="availability-booking-bar">
        <div><CalendarDays size={20} aria-hidden="true" /><p>{selectedCell ? `Selected: ${formatDateForDisplay(selectedCell.date)} · ${villa?.displayName}` : 'Select an available date to carry it into your enquiry.'}</p></div>
        <button type="button" className="button button--sun availability-book-button" onClick={handleBookNow}>Book now</button>
      </div>
    </section>
  );
}
