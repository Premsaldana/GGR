"use client";

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

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

type Unit = { id: string; displayName: string; slug: string };
type Price = { id: string; unitId: string; rateCode: string; date: string; amountMinorUnits: number; currency: string };
type Data = { units: Unit[]; prices: Price[] };

export default function PricingEditor() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<Data | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error' | 'saved'>('loading');
  const [message, setMessage] = useState('');
  const days = useMemo(() => Array.from({ length: daysInMonth(month) }, (_, index) => index + 1), [month]);

  async function load() {
    setStatus('loading');
    try {
      const response = await fetch(`/api/admin/prices?month=${month}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load prices');
      const nextData = await response.json() as Data;
      const nextValues: Record<string, string> = {};
      nextData.prices.forEach((price) => { nextValues[`${price.unitId}:${price.date}`] = String(price.amountMinorUnits / 100); });
      setData(nextData); setValues(nextValues); setStatus('ready'); setMessage('');
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to load prices'); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [month]);

  async function save() {
    if (!data) return;
    setStatus('saving'); setMessage('');
    const prices = Object.entries(values).filter(([, value]) => value.trim() !== '').map(([key, value]) => {
      const [unitId, date] = key.split(':');
      return { unitId, rateCode: 'standard', date, amountMinorUnits: Math.round(Number(value) * 100), currency: 'INR' };
    });
    if (prices.some((price) => !Number.isFinite(price.amountMinorUnits) || price.amountMinorUnits <= 0)) { setStatus('error'); setMessage('Enter positive numeric prices, or leave a date blank.'); return; }
    try {
      const response = await fetch('/api/admin/prices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prices }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to save prices');
      setStatus('saved'); setMessage(`${prices.length} price${prices.length === 1 ? '' : 's'} saved.`); await load();
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Unable to save prices'); }
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-admin-terracotta)]">Revenue tools</p><h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold">Room prices</h2><p className="mt-2 text-sm text-[var(--color-admin-sage)]">Set the public nightly price for each room and date. Blank dates remain unavailable.</p></div>
      <div className="flex items-center gap-2"><button type="button" className="admin-button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ArrowLeft size={16} /></button><span className="min-w-36 text-center font-medium">{monthLabel(month)}</span><button type="button" className="admin-button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ArrowRight size={16} /></button></div>
    </header>
    {message && <p className={`rounded-lg border px-4 py-3 text-sm ${status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    {status === 'loading' && <p className="rounded-xl bg-white p-8 text-sm text-[var(--color-admin-sage)]">Loading prices…</p>}
    {status === 'error' && !data && <button type="button" className="admin-button admin-button--primary" onClick={() => void load()}>Try again</button>}
    {data && <section className="overflow-hidden rounded-xl border border-[var(--color-admin-mist)] bg-white shadow-sm"><div className="flex items-center justify-between border-b border-[var(--color-admin-mist)] px-5 py-4"><div><h3 className="font-semibold text-[var(--color-admin-forest)]">Standard rate · {monthLabel(month)}</h3><p className="mt-1 text-xs text-[var(--color-admin-sage)]">Amounts are entered in INR per night.</p></div><button type="button" className="admin-button admin-button--primary" onClick={() => void save()} disabled={status === 'saving'}><Save size={16} /> {status === 'saving' ? 'Saving…' : 'Save prices'}</button></div><div className="overflow-x-auto"><table className="min-w-[980px] w-full text-sm"><thead><tr className="bg-[var(--color-admin-mineral)]/60"><th className="sticky left-0 z-10 bg-[var(--color-admin-mineral)] px-4 py-3 text-left">Room</th>{days.map((day) => <th key={day} className="px-2 py-3 text-center text-xs text-[var(--color-admin-sage)]">{day}</th>)}</tr></thead><tbody>{data.units.map((unit) => <tr key={unit.id} className="border-t border-[var(--color-admin-mist)]"><th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-medium text-[var(--color-admin-forest)]">{unit.displayName}</th>{days.map((day) => { const date = `${month}-${String(day).padStart(2, '0')}`; const key = `${unit.id}:${date}`; return <td key={date} className="px-1 py-2"><label className="sr-only" htmlFor={key}>{unit.displayName} price for {date}</label><input id={key} inputMode="decimal" min="0" step="1" placeholder="—" value={values[key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="w-16 rounded-md border border-[var(--color-admin-mist)] bg-[var(--color-admin-mineral)]/30 px-1 py-2 text-center text-xs focus:border-[var(--color-admin-terracotta)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin-terracotta)]/20" /></td>; })}</tr>)}</tbody></table></div></section>}
  </div>;
}
