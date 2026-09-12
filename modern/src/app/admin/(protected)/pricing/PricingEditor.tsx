"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Save } from 'lucide-react';
import { formatDateForDisplay } from '@/lib/pricing-core';
import type { PricingEvent } from '@/lib/pricing-events';

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
}
function daysInMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}
function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

type Price = { date: string; amountMinorUnits: number; currency: string };
type Availability = { date: string; status: string; reason: string | null };
type Data = { units: Array<{ id: string; displayName: string; slug: string }>; prices: Price[]; availability: Availability[] };

type Operation = 'price' | 'sold-off' | 'restore';

export default function PricingEditor() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<Data | null>(null);
  const [operation, setOperation] = useState<Operation>('price');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error' | 'saved'>('loading');
  const [message, setMessage] = useState('');
  const startDatePickerRef = useRef<HTMLInputElement>(null);
  const endDatePickerRef = useRef<HTMLInputElement>(null);
  const days = useMemo(() => Array.from({ length: daysInMonth(month) }, (_, index) => index + 1), [month]);

  async function load() {
    setStatus('loading');
    try {
      const response = await fetch(`/api/admin/prices?month=${month}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load availability');
      setData(await response.json() as Data); setStatus('ready'); setMessage('');
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to load availability'); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [month]);

  useEffect(() => {
    const source = new EventSource('/api/prices/events');
    let hasOpened = false;
    source.onopen = () => {
      if (hasOpened) void load();
      hasOpened = true;
    };
    source.addEventListener('pricing', (event) => {
      const pricingEvent = JSON.parse((event as MessageEvent<string>).data) as PricingEvent;
      setData((current) => {
        if (!current || current.units[0]?.id !== pricingEvent.unitId) return current;
        const affected = new Set(pricingEvent.dates);
        const prices = pricingEvent.action === 'price_updated'
          ? [...current.prices.filter((item) => !affected.has(item.date)), ...pricingEvent.dates.map((date) => ({ date, amountMinorUnits: pricingEvent.amountMinorUnits ?? 0, currency: pricingEvent.currency ?? 'INR' }))]
          : current.prices;
        const availability = pricingEvent.action === 'sold_off'
          ? [...current.availability.filter((item) => !affected.has(item.date)), ...pricingEvent.dates.map((date) => ({ date, status: 'sold_off', reason: null }))]
          : pricingEvent.action === 'sold_off_reversed'
            ? current.availability.filter((item) => !affected.has(item.date))
            : current.availability;
        return { ...current, prices, availability };
      });
    });
    return () => source.close();
    // The stream is intentionally tied to the current month view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function dateForDay(day: number) { return `${month}-${String(day).padStart(2, '0')}`; }
  function dateState(date: string) {
    if (data?.availability.some((item) => item.date === date && item.status === 'sold_off')) return 'sold-off';
    if (data?.prices.some((item) => item.date === date && item.amountMinorUnits > 0)) return 'available';
    return 'unpriced';
  }
  function formatAdminPrice(date: string) {
    const value = data?.prices.find((item) => item.date === date)?.amountMinorUnits;
    return value ? `₹${(value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'No price';
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    const existing = data?.prices.find((item) => item.date === date)?.amountMinorUnits;
    setSelectedPrice(existing ? String(existing / 100) : '');
  }

  function setRangeStart(value: string) {
    setStartDate(value);
    setStartDateDisplay(value ? formatDateForDisplay(value) : '');
    if (endDate && value > endDate) {
      setEndDate('');
      setEndDateDisplay('');
    }
  }

  function setRangeEnd(value: string) {
    if (startDate && value < startDate) return;
    setEndDate(value);
    setEndDateDisplay(value ? formatDateForDisplay(value) : '');
  }

  function openDatePicker(ref: React.RefObject<HTMLInputElement | null>) {
    const picker = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker) return;
    if (typeof picker.showPicker === 'function') picker.showPicker();
    else picker.focus();
  }

  async function saveSingleAction(action: 'price' | 'sold-off' | 'restore') {
    if (!selectedDate) return;
    const body: Record<string, unknown> = { startDate: selectedDate, endDate: selectedDate };
    if (action === 'price') {
      const amountMinorUnits = Math.round(Number(selectedPrice) * 100);
      if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) { setStatus('error'); setMessage('Enter a positive nightly price in INR.'); return; }
      body.amountMinorUnits = amountMinorUnits;
    } else {
      body.soldOff = action === 'sold-off';
    }
    setStatus('saving'); setMessage('');
    try {
      const response = await fetch('/api/admin/prices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string; updatedDates?: number };
      if (!response.ok) throw new Error(result.error || 'Unable to save availability');
      setStatus('saved'); setMessage(`${formatDateForDisplay(selectedDate)} updated.`); await load();
      setSelectedDate(null);
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to save availability'); }
  }

  async function save() {
    if (!startDate || !endDate || endDate < startDate) { setStatus('error'); setMessage('Choose a valid start and end date.'); return; }
    const body: Record<string, unknown> = { startDate, endDate };
    if (operation === 'price') {
      const amountMinorUnits = Math.round(Number(price) * 100);
      if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) { setStatus('error'); setMessage('Enter a positive nightly price in INR.'); return; }
      body.amountMinorUnits = amountMinorUnits;
    } else {
      body.soldOff = operation === 'sold-off';
      if (reason.trim()) body.reason = reason.trim();
    }
    setStatus('saving'); setMessage('');
    try {
      const response = await fetch('/api/admin/prices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string; updatedDates?: number };
      if (!response.ok) throw new Error(result.error || 'Unable to save availability');
      setStatus('saved'); setMessage(`${result.updatedDates ?? 0} date${result.updatedDates === 1 ? '' : 's'} updated.`); await load();
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to save availability'); }
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-admin-terracotta)]">Revenue tools</p><h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold">Private Pool Villa</h2><p className="mt-2 max-w-2xl text-sm text-[var(--color-admin-sage)]">Manage nightly pricing and sold-off dates for the only GGR inventory. Sold Off always takes precedence over a configured price.</p></div>
      <div className="flex items-center gap-2"><button type="button" className="admin-button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ArrowLeft size={16} /></button><span className="min-w-36 text-center font-medium">{monthLabel(month)}</span><button type="button" className="admin-button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ArrowRight size={16} /></button></div>
    </header>

    {message && <p className={`rounded-lg border px-4 py-3 text-sm ${status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}

    <section className="rounded-xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm">
      <div className="mb-5"><h3 className="font-semibold text-[var(--color-admin-forest)]">Update a date range</h3><p className="mt-1 text-xs text-[var(--color-admin-sage)]">Use one action for a single date or a continuous range.</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium text-[var(--color-admin-forest)]">Action<select value={operation} onChange={(event) => setOperation(event.target.value as Operation)} className="admin-input mt-2 w-full"><option value="price">Set nightly price</option><option value="sold-off">Mark Sold Off</option><option value="restore">Reverse Sold Off</option></select></label>
        <label className="text-sm font-medium text-[var(--color-admin-forest)]">Start date<span className="relative mt-2 block"><button type="button" onClick={() => openDatePicker(startDatePickerRef)} className="admin-input w-full cursor-pointer text-left" aria-label="Choose start date">{startDateDisplay || 'DD-MM-YYYY'}</button><input ref={startDatePickerRef} type="date" value={startDate} max={endDate || undefined} onChange={(event) => setRangeStart(event.target.value)} className="absolute h-px w-px opacity-0" tabIndex={-1} aria-hidden="true" /></span></label>
        <label className="text-sm font-medium text-[var(--color-admin-forest)]">End date<span className="relative mt-2 block"><button type="button" onClick={() => openDatePicker(endDatePickerRef)} className="admin-input w-full cursor-pointer text-left" aria-label="Choose end date">{endDateDisplay || 'DD-MM-YYYY'}</button><input ref={endDatePickerRef} type="date" value={endDate} min={startDate || undefined} onChange={(event) => setRangeEnd(event.target.value)} className="absolute h-px w-px opacity-0" tabIndex={-1} aria-hidden="true" /></span></label>
        {operation === 'price' ? <label className="text-sm font-medium text-[var(--color-admin-forest)]">Nightly price (INR)<input type="number" min="1" step="1" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="admin-input mt-2 w-full" placeholder="e.g. 25000" /></label> : <label className="text-sm font-medium text-[var(--color-admin-forest)]">Reason <span className="font-normal text-[var(--color-admin-sage)]">(optional)</span><input value={reason} onChange={(event) => setReason(event.target.value)} className="admin-input mt-2 w-full" placeholder="Private event" /></label>}
      </div>
      <div className="mt-5 flex justify-end"><button type="button" className="admin-button admin-button--primary" onClick={() => void save()} disabled={status === 'saving'}><Save size={16} /> {status === 'saving' ? 'Saving…' : 'Save update'}</button></div>
    </section>

    {status === 'loading' && <p className="rounded-xl bg-white p-8 text-sm text-[var(--color-admin-sage)]">Loading availability…</p>}
    {status === 'error' && !data && <button type="button" className="admin-button admin-button--primary" onClick={() => void load()}>Try again</button>}
    {data?.units[0] && <section className="rounded-xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm"><div className="mb-4 flex items-end justify-between gap-4"><div><h3 className="font-semibold text-[var(--color-admin-forest)]">Current state · {monthLabel(month)}</h3><p className="mt-1 text-xs text-[var(--color-admin-sage)]">{data.units[0].displayName} · Standard rate · INR per night</p></div><div className="hidden gap-3 text-xs text-[var(--color-admin-sage)] sm:flex"><span className="flex items-center gap-1"><Check size={13} className="admin-pricing-available-text" /> Available</span><span className="flex items-center gap-1"><LockKeyhole size={13} className="text-red-700" /> Sold Off</span></div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{days.map((day) => { const date = dateForDay(day); const state = dateState(date); return <button type="button" key={date} onClick={() => selectDate(date)} aria-label={`Manage ${formatDateForDisplay(date)}`} className={`min-h-24 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-admin-terracotta)] ${state === 'available' ? 'admin-pricing-available-card' : state === 'sold-off' ? 'border-red-200 bg-red-50/60' : 'border-[var(--color-admin-mist)] bg-[var(--color-admin-mineral)]/30'}`}><p className="text-xs font-semibold text-[var(--color-admin-sage)]">{formatDateForDisplay(date)}</p><p className={`mt-3 text-sm font-semibold ${state === 'available' ? 'admin-pricing-available-text' : state === 'sold-off' ? 'text-red-800' : 'text-[var(--color-admin-sage)]'}`}>{state === 'sold-off' ? 'Sold Off' : state === 'available' ? formatAdminPrice(date) : 'No price'}</p></button>; })}</div>{selectedDate && <div className="mt-5 rounded-lg border border-[var(--color-admin-mist)] bg-[var(--color-admin-mineral)]/30 p-4" aria-label={`Actions for ${formatDateForDisplay(selectedDate)}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-terracotta)]">Selected date</p><p className="mt-1 font-medium text-[var(--color-admin-forest)]">{formatDateForDisplay(selectedDate)}</p><p className="mt-1 text-xs text-[var(--color-admin-sage)]">Sold Off takes precedence over any saved price.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-sm font-medium text-[var(--color-admin-forest)]">Nightly price (INR)<input type="number" min="1" step="1" inputMode="decimal" value={selectedPrice} onChange={(event) => setSelectedPrice(event.target.value)} className="admin-input mt-2 w-full sm:w-36" placeholder="e.g. 25000" /></label><button type="button" className="admin-button admin-button--primary" onClick={() => void saveSingleAction('price')} disabled={status === 'saving'}>Set price</button><button type="button" className="admin-button" onClick={() => void saveSingleAction('sold-off')} disabled={status === 'saving'}>Mark Sold Off</button><button type="button" className="admin-button" onClick={() => void saveSingleAction('restore')} disabled={status === 'saving'}>Reverse Sold Off</button><button type="button" className="admin-button" onClick={() => setSelectedDate(null)} disabled={status === 'saving'}>Cancel</button></div></div></div>}</section>}
  </div>;
}
