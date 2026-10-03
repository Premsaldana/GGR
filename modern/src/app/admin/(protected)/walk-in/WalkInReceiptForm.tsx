'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ReceiptText } from 'lucide-react';
import { createWalkInReceiptAction } from './actions';

type Unit = { id: string; displayName: string };
type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';

type Props = { units: Unit[] };

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function WalkInReceiptForm({ units }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    guestName: '', phone: '', email: '', unitId: units[0]?.id || '',
    checkInDate: today, checkOutDate: tomorrow, adults: '2', children: '0',
    accommodationRate: '', securityDeposit: '5000', amountPaid: '',
    paymentMode: 'CASH' as PaymentMode, paymentReference: '', notes: '',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ reservationId: string; invoiceId: string; reservationNumber: string } | null>(null);

  const nights = useMemo(() => {
    const start = new Date(form.checkInDate).getTime();
    const end = new Date(form.checkOutDate).getTime();
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, Math.round((end - start) / 86400000)) : 1;
  }, [form.checkInDate, form.checkOutDate]);
  const total = Math.max(0, Number(form.accommodationRate || 0) * nights);
  const balance = Math.max(0, total - Number(form.amountPaid || 0));

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const response = await createWalkInReceiptAction(form);
    if ('invoiceId' in response && response.success && response.reservationId && response.invoiceId) {
      setResult({ reservationId: response.reservationId, invoiceId: response.invoiceId, reservationNumber: response.reservationNumber || '' });
    } else {
      setError(response.error || 'Unable to create the walk-in receipt.');
    }
    setIsSaving(false);
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 text-green-600" size={52} />
        <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-admin-forest)]">Receipt created</h2>
        <p className="mt-2 text-sm text-[var(--color-admin-sage)]">{result.reservationNumber} was recorded as a walk-in booking. No QR or payment proof was created.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push(`/admin/reservations/${result.reservationId}?view=preview`)} className="admin-button admin-button--primary">Open receipt</button>
          <a href={`/api/invoice-pdf/${result.invoiceId}`} download className="admin-button admin-button--secondary">Download PDF</a>
          <button type="button" onClick={() => setResult(null)} className="rounded-md px-4 py-2 text-sm text-[var(--color-admin-sage)] hover:underline">Create another</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm">
        <ReceiptText className="mt-0.5 text-[var(--color-admin-terracotta)]" size={24} />
        <div><h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-admin-forest)]">Walk-in / direct payment receipt</h2><p className="mt-1 text-sm text-[var(--color-admin-sage)]">Use this for cash, card, bank transfer, or already-collected UPI payments. It creates the same reservation invoice and payment record, without QR generation or guest proof upload.</p></div>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="grid gap-4 rounded-xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm md:grid-cols-2">
        <h3 className="md:col-span-2 font-semibold text-[var(--color-admin-forest)]">Guest and stay</h3>
        <label className="text-sm font-medium">Guest name *<input required value={form.guestName} onChange={(e) => update('guestName', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Room type *<select required value={form.unitId} onChange={(e) => update('unitId', e.target.value)} className="admin-input mt-1 w-full bg-white">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayName}</option>)}</select></label>
        <label className="text-sm font-medium">Check-in *<input required type="date" value={form.checkInDate} onChange={(e) => update('checkInDate', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Check-out *<input required type="date" value={form.checkOutDate} onChange={(e) => update('checkOutDate', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Adults *<input required min="1" type="number" value={form.adults} onChange={(e) => update('adults', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Children<input min="0" type="number" value={form.children} onChange={(e) => update('children', e.target.value)} className="admin-input mt-1 w-full" /></label>
      </section>
      <section className="grid gap-4 rounded-xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm md:grid-cols-2">
        <h3 className="md:col-span-2 font-semibold text-[var(--color-admin-forest)]">Receipt and payment</h3>
        <label className="text-sm font-medium">Room rate per night (₹) *<input required min="0" step="0.01" type="number" value={form.accommodationRate} onChange={(e) => update('accommodationRate', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Security deposit (₹)<input min="0" step="0.01" type="number" value={form.securityDeposit} onChange={(e) => update('securityDeposit', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Amount received (₹) *<input required min="0.01" step="0.01" type="number" value={form.amountPaid} onChange={(e) => update('amountPaid', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Payment mode *<select value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)} className="admin-input mt-1 w-full bg-white"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="UPI">UPI already received</option></select></label>
        <label className="text-sm font-medium">Reference / receipt no.<input value={form.paymentReference} onChange={(e) => update('paymentReference', e.target.value)} className="admin-input mt-1 w-full" /></label>
        <label className="text-sm font-medium">Notes<input value={form.notes} onChange={(e) => update('notes', e.target.value)} className="admin-input mt-1 w-full" placeholder="Optional internal note" /></label>
        <div className="md:col-span-2 grid grid-cols-3 gap-3 rounded-lg bg-[var(--color-admin-mineral)]/60 p-4 text-sm"><div><span className="block text-xs text-[var(--color-admin-sage)]">Nights</span><strong>{nights}</strong></div><div><span className="block text-xs text-[var(--color-admin-sage)]">Invoice total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><div><span className="block text-xs text-[var(--color-admin-sage)]">Balance</span><strong className={balance > 0 ? 'text-[var(--color-admin-terracotta)]' : 'text-green-700'}>₹{balance.toLocaleString('en-IN')}</strong></div></div>
      </section>
      <button type="submit" disabled={isSaving || units.length === 0} className="admin-button admin-button--primary inline-flex items-center gap-2 disabled:opacity-50">{isSaving ? <Loader2 size={17} className="animate-spin" /> : <ReceiptText size={17} />}{isSaving ? 'Creating receipt…' : 'Create walk-in receipt'}</button>
    </form>
  );
}
