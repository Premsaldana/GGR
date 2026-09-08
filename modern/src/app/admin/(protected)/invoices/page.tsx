import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  History,
  IndianRupee,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDateKey, GOA_TIME_ZONE } from '../dashboard-model';
import { getInvoiceWorkspace } from './invoice-data';
import {
  parseInvoiceListQuery,
  type InvoiceListItem,
  type InvoiceListQuery,
} from './invoice-list-model';
import type { InvoicePaymentState } from '@/lib/live-invoice';

export const dynamic = 'force-dynamic';

type InvoicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const paymentLabels: Record<InvoicePaymentState, string> = {
  payment_due: 'Payment due',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

function paymentStateClass(state: InvoicePaymentState): string {
  if (state === 'paid') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (state === 'partially_paid') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  if (state === 'cancelled') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return 'bg-slate-100 text-slate-700 ring-slate-500/20';
}

function PaymentBadge({ state }: { state: InvoicePaymentState }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${paymentStateClass(state)}`}>
      {paymentLabels[state]}
    </span>
  );
}

function invoiceHref(
  query: InvoiceListQuery,
  changes: Partial<Pick<InvoiceListQuery, 'q' | 'status' | 'versions' | 'page'>> = {},
): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.status !== 'all') params.set('status', next.status);
  if (next.versions !== 'latest') params.set('versions', next.versions);
  if (next.page > 1) params.set('page', String(next.page));
  const serialized = params.toString();
  return serialized ? `/admin/invoices?${serialized}` : '/admin/invoices';
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
      accent
        ? 'border-[var(--color-admin-botanical)] bg-[var(--color-admin-botanical)] text-white'
        : 'border-[var(--color-admin-mist)] bg-[var(--color-admin-shell)]'
    }`}>
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${accent ? 'bg-white/5' : 'bg-[var(--color-admin-mineral)]'}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${accent ? 'text-white/60' : 'text-[var(--color-admin-sage)]'}`}>{label}</p>
          <p className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-tight">{value}</p>
          <p className={`mt-1 text-xs ${accent ? 'text-white/65' : 'text-[var(--color-admin-sage)]'}`}>{detail}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${accent ? 'bg-white/10' : 'bg-[var(--color-admin-mineral)] text-[var(--color-admin-terracotta)]'}`}>{icon}</span>
      </div>
    </article>
  );
}

function InvoiceActions({ invoice }: { invoice: InvoiceListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/reservations/${invoice.reservationId}#invoice`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-admin-terracotta)] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#99492f]"
      >
        Open <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
      <a
        href={`/api/invoice-pdf/${invoice.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-admin-mist)] bg-white px-3 py-2 text-xs font-bold transition hover:border-[var(--color-admin-sage)]"
        aria-label={`Download ${invoice.invoiceNumber} as PDF`}
      >
        <Download size={14} aria-hidden="true" /> PDF
      </a>
    </div>
  );
}

function InvoiceCard({ invoice, showVersion }: { invoice: InvoiceListItem; showVersion: boolean }) {
  return (
    <article className="rounded-2xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-[var(--font-display)] text-lg font-semibold">{invoice.invoiceNumber}</h3>
            {showVersion && <span className="rounded-full bg-[var(--color-admin-mineral)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-admin-sage)]">v{invoice.version}</span>}
          </div>
          <p className="mt-1 text-xs text-[var(--color-admin-sage)]">{invoice.reservationNumber}</p>
        </div>
        <PaymentBadge state={invoice.paymentState} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Guest & stay</p>
          <p className="mt-1 font-semibold">{invoice.guestName}</p>
          <p className="mt-0.5 text-xs text-[var(--color-admin-sage)]">{invoice.unitName}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Dates</p>
          <p className="mt-1 leading-5">{formatDateKey(invoice.checkInDate)}<br /><span className="text-[var(--color-admin-sage)]">to {formatDateKey(invoice.checkOutDate)}</span></p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Live balance</p>
          <p className={`mt-1 font-bold ${invoice.outstandingMinorUnits > 0 ? 'text-[var(--color-admin-terracotta)]' : 'text-emerald-700'}`}>
            {currencyFormatter.format(invoice.outstandingMinorUnits / 100)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-admin-sage)]">of {currencyFormatter.format(invoice.totalMinorUnits / 100)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-admin-mist)] pt-4">
        <p className="text-xs text-[var(--color-admin-sage)]">Issued {invoice.issuedAt ? invoice.issuedAt.toLocaleDateString('en-IN', { timeZone: GOA_TIME_ZONE }) : 'date unavailable'}</p>
        <InvoiceActions invoice={invoice} />
      </div>
    </article>
  );
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const query = parseInvoiceListQuery(await searchParams);
  const workspace = await getInvoiceWorkspace(query);
  const { summary } = workspace;
  const hasFilters = Boolean(query.q) || query.status !== 'all';
  const latestHref = invoiceHref(query, {
    versions: 'latest',
    status: query.status === 'cancelled' ? 'all' : query.status,
    page: 1,
  });
  const allVersionsHref = invoiceHref(query, { versions: 'all', page: 1 });

  return (
    <div
      id="invoice-workspace"
      className="space-y-7 pb-10"
      style={{
        '--color-admin-sage': '#52685F',
        '--color-admin-terracotta': '#9F482E',
      } as React.CSSProperties}
    >
      <header className="flex flex-col gap-4 border-b border-[var(--color-admin-mist)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-admin-terracotta)]">Revenue operations</p>
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="mt-2 text-sm text-[var(--color-admin-sage)]">Track live balances, payment progress, and every issued revision.</p>
        </div>
        <Link href="/admin/calendar" className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-admin-mist)] bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-[var(--color-admin-sage)]">
          <CalendarDays size={16} aria-hidden="true" /> Open calendar
        </Link>
      </header>

      <section aria-label="Invoice overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Live outstanding" value={currencyFormatter.format(summary.totalOutstandingMinorUnits / 100)} detail="Across latest active invoices" icon={<IndianRupee size={20} aria-hidden="true" />} accent />
        <SummaryCard label="Payment due" value={summary.paymentDueCount} detail="No payment recorded" icon={<Clock3 size={20} aria-hidden="true" />} />
        <SummaryCard label="Partially paid" value={summary.partiallyPaidCount} detail="Balance still outstanding" icon={<History size={20} aria-hidden="true" />} />
        <SummaryCard label="Paid" value={summary.paidCount} detail="Latest invoices settled" icon={<CheckCircle2 size={20} aria-hidden="true" />} />
      </section>

      <section className="rounded-2xl border border-[var(--color-admin-mist)] bg-[var(--color-admin-shell)] p-4 shadow-sm sm:p-5" aria-label="Invoice filters">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form action="/admin/invoices" className="grid flex-1 gap-3 sm:grid-cols-[minmax(260px,1fr)_190px_auto]">
            <input type="hidden" name="versions" value={query.versions} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Search invoices</span>
              <span className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-admin-sage)]" aria-hidden="true" />
                <input type="search" name="q" defaultValue={query.q} placeholder="Invoice, guest, reservation..." className="h-11 w-full rounded-lg border border-[var(--color-admin-mist)] bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-admin-terracotta)] focus:ring-2 focus:ring-[var(--color-admin-terracotta)]/10" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Payment status</span>
              <select name="status" defaultValue={query.status} className="h-11 w-full rounded-lg border border-[var(--color-admin-mist)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-admin-terracotta)] focus:ring-2 focus:ring-[var(--color-admin-terracotta)]/10">
                <option value="all">All statuses</option>
                <option value="payment_due">Payment due</option>
                <option value="partially_paid">Partially paid</option>
                <option value="paid">Paid</option>
                {query.versions === 'all' && <option value="cancelled">Cancelled</option>}
              </select>
            </label>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-admin-botanical)] px-4 text-sm font-bold text-white transition hover:bg-[#172c27] sm:self-end">
              <SlidersHorizontal size={15} aria-hidden="true" /> Apply
            </button>
          </form>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Version view</p>
            <div className="inline-flex rounded-lg border border-[var(--color-admin-mist)] bg-white p-1">
              <Link href={latestHref} aria-current={query.versions === 'latest' ? 'page' : undefined} className={`rounded-md px-3 py-2 text-xs font-bold transition ${query.versions === 'latest' ? 'bg-[var(--color-admin-botanical)] text-white' : 'text-[var(--color-admin-sage)] hover:text-[var(--color-admin-ink)]'}`}>Latest only</Link>
              <Link href={allVersionsHref} aria-current={query.versions === 'all' ? 'page' : undefined} className={`rounded-md px-3 py-2 text-xs font-bold transition ${query.versions === 'all' ? 'bg-[var(--color-admin-botanical)] text-white' : 'text-[var(--color-admin-sage)] hover:text-[var(--color-admin-ink)]'}`}>All versions</Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-admin-mist)] pt-4 text-xs text-[var(--color-admin-sage)]">
          <p>{workspace.totalItems === 0 ? 'No matching invoices' : `Showing ${workspace.rangeStart}–${workspace.rangeEnd} of ${workspace.totalItems}`}</p>
          {hasFilters && <Link href={invoiceHref(query, { q: '', status: 'all', page: 1 })} className="font-bold text-[var(--color-admin-terracotta)] hover:underline">Clear search and filters</Link>}
        </div>
      </section>

      {!workspace.hasInvoices ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-admin-mist)] bg-white/60 px-6 py-16 text-center">
          <FileText size={34} className="mx-auto text-[var(--color-admin-sage)]" aria-hidden="true" />
          <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold">No invoices issued yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-admin-sage)]">Issue an invoice from a reservation and it will appear here with live payment tracking.</p>
          <Link href="/admin/calendar" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-admin-terracotta)] px-4 py-2.5 text-sm font-bold text-white">Open calendar <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>
      ) : workspace.items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-admin-mist)] bg-white/60 px-6 py-14 text-center">
          <Search size={32} className="mx-auto text-[var(--color-admin-sage)]" aria-hidden="true" />
          <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold">No invoices match this view</h3>
          <p className="mt-2 text-sm text-[var(--color-admin-sage)]">Try a different search, payment status, or version view.</p>
          <Link href="/admin/invoices" className="mt-4 inline-flex text-sm font-bold text-[var(--color-admin-terracotta)] hover:underline">Reset invoice view</Link>
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-[var(--color-admin-mist)] bg-white shadow-sm xl:block" aria-label="Invoice results">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-[var(--color-admin-mist)] bg-[var(--color-admin-mineral)]/60 text-[11px] uppercase tracking-[0.12em] text-[var(--color-admin-sage)]">
                <tr>
                  <th className="w-[19%] px-5 py-4 font-bold">Invoice</th>
                  <th className="w-[23%] px-5 py-4 font-bold">Guest & stay</th>
                  <th className="w-[17%] px-5 py-4 font-bold">Stay dates</th>
                  <th className="w-[13%] px-5 py-4 font-bold">Total</th>
                  <th className="w-[14%] px-5 py-4 font-bold">Live balance</th>
                  <th className="w-[14%] px-5 py-4 font-bold">Status & actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-admin-mist)]">
                {workspace.items.map((invoice) => (
                  <tr key={invoice.id} className="align-top transition hover:bg-[var(--color-admin-mineral)]/35">
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold">{invoice.invoiceNumber}</p>
                        {query.versions === 'all' && <span className="rounded-full bg-[var(--color-admin-mineral)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-admin-sage)]">v{invoice.version}</span>}
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-admin-sage)]">{invoice.reservationNumber}</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-semibold">{invoice.guestName}</p>
                      <p className="mt-1 break-words text-xs leading-5 text-[var(--color-admin-sage)]">{invoice.unitName}</p>
                    </td>
                    <td className="px-5 py-5 text-xs leading-5">
                      <p>{formatDateKey(invoice.checkInDate)}</p>
                      <p className="text-[var(--color-admin-sage)]">to {formatDateKey(invoice.checkOutDate)}</p>
                    </td>
                    <td className="px-5 py-5 font-semibold">{currencyFormatter.format(invoice.totalMinorUnits / 100)}</td>
                    <td className="px-5 py-5">
                      <p className={`font-bold ${invoice.outstandingMinorUnits > 0 ? 'text-[var(--color-admin-terracotta)]' : 'text-emerald-700'}`}>{currencyFormatter.format(invoice.outstandingMinorUnits / 100)}</p>
                      <p className="mt-1 text-[11px] text-[var(--color-admin-sage)]">{currencyFormatter.format(invoice.appliedMinorUnits / 100)} applied</p>
                    </td>
                    <td className="px-5 py-5">
                      <PaymentBadge state={invoice.paymentState} />
                      <div className="mt-3"><InvoiceActions invoice={invoice} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-4 xl:hidden" aria-label="Invoice results">
            {workspace.items.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} showVersion={query.versions === 'all'} />)}
          </section>
        </>
      )}

      {workspace.totalItems > 0 && workspace.totalPages > 1 && (
        <nav className="flex flex-col gap-3 rounded-xl border border-[var(--color-admin-mist)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Invoice pagination">
          <p className="text-xs text-[var(--color-admin-sage)]">Page {workspace.query.page} of {workspace.totalPages}</p>
          <div className="flex items-center gap-2">
            {workspace.query.page > 1 ? (
              <Link href={invoiceHref(workspace.query, { page: workspace.query.page - 1 })} className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-admin-mist)] px-3 py-2 text-xs font-bold transition hover:border-[var(--color-admin-sage)]"><ChevronLeft size={14} aria-hidden="true" /> Previous</Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-[var(--color-admin-mist)] px-3 py-2 text-xs font-bold text-slate-300"><ChevronLeft size={14} aria-hidden="true" /> Previous</span>
            )}
            {workspace.query.page < workspace.totalPages ? (
              <Link href={invoiceHref(workspace.query, { page: workspace.query.page + 1 })} className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-admin-mist)] px-3 py-2 text-xs font-bold transition hover:border-[var(--color-admin-sage)]">Next <ChevronRight size={14} aria-hidden="true" /></Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-[var(--color-admin-mist)] px-3 py-2 text-xs font-bold text-slate-300">Next <ChevronRight size={14} aria-hidden="true" /></span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
