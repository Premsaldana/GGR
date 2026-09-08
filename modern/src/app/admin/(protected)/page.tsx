import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  IndianRupee,
  Clock3,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getDashboardSnapshot } from './dashboard-data';
import { formatDateKey, formatGoaDateTime } from './dashboard-model';

export const dynamic = 'force-dynamic';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

function statusClass(status: string): string {
  if (status === 'confirmed' || status === 'paid') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (status === 'pending' || status === 'partially_paid') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return 'bg-slate-50 text-slate-600 ring-slate-500/20';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusClass(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  accent?: boolean;
};

function MetricCard({ label, value, detail, icon, accent = false }: MetricCardProps) {
  return (
    <article className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
      accent
        ? 'border-[var(--color-admin-botanical)] bg-[var(--color-admin-botanical)] text-white'
        : 'border-[var(--color-admin-mist)] bg-[var(--color-admin-shell)]'
    }`}>
      <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full ${accent ? 'bg-white/5' : 'bg-[var(--color-admin-mineral)]'}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${accent ? 'text-white/60' : 'text-[var(--color-admin-sage)]'}`}>
            {label}
          </p>
          <p className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-tight">{value}</p>
          <p className={`mt-1 text-xs ${accent ? 'text-white/65' : 'text-[var(--color-admin-sage)]'}`}>{detail}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${accent ? 'bg-white/10 text-white' : 'bg-[var(--color-admin-mineral)] text-[var(--color-admin-terracotta)]'}`}>
          {icon}
        </span>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const dashboard = await getDashboardSnapshot();
  const { metrics } = dashboard;

  return (
    <div className="space-y-7 pb-10">
      <header className="flex flex-col gap-4 border-b border-[var(--color-admin-mist)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-admin-terracotta)]">Operations overview</p>
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-admin-ink)]">Good day, Goa Garden Resort</h2>
          <p className="mt-2 text-sm text-[var(--color-admin-sage)]">
            Live resort snapshot for <time dateTime={dashboard.today}>{formatDateKey(dashboard.today)}</time> · Goa time
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/calendar" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-admin-mist)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-admin-ink)] transition hover:border-[var(--color-admin-sage)]">
            <CalendarDays size={16} aria-hidden="true" /> Open calendar
          </Link>
          <Link href="/admin/invoices" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-admin-terracotta)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#99492f]">
            View invoices <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section aria-label="Today at a glance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="In house"
          value={metrics.inHouseGuests}
          detail={`${metrics.inHouseStays} active ${metrics.inHouseStays === 1 ? 'stay' : 'stays'}`}
          icon={<Users size={20} aria-hidden="true" />}
          accent
        />
        <MetricCard
          label="Arriving today"
          value={metrics.arrivals}
          detail={`${metrics.arrivalGuests} expected ${metrics.arrivalGuests === 1 ? 'guest' : 'guests'}`}
          icon={<LogIn size={20} aria-hidden="true" />}
        />
        <MetricCard
          label="Departing today"
          value={metrics.departures}
          detail={`${metrics.departureGuests} departing ${metrics.departureGuests === 1 ? 'guest' : 'guests'}`}
          icon={<LogOut size={20} aria-hidden="true" />}
        />
        <MetricCard
          label="Outstanding"
          value={currencyFormatter.format(metrics.outstandingBalanceMinorUnits / 100)}
          detail={`${metrics.pendingProofs} payment ${metrics.pendingProofs === 1 ? 'proof' : 'proofs'} to review`}
          icon={<IndianRupee size={20} aria-hidden="true" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--color-admin-mist)] bg-white shadow-sm" aria-labelledby="upcoming-heading">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-admin-mist)] px-5 py-4 sm:px-6">
            <div>
              <h3 id="upcoming-heading" className="font-[var(--font-display)] text-lg font-semibold">Upcoming stays</h3>
              <p className="mt-1 text-xs text-[var(--color-admin-sage)]">The next confirmed and pending arrivals</p>
            </div>
            <Clock3 size={19} className="text-[var(--color-admin-terracotta)]" aria-hidden="true" />
          </div>

          {dashboard.upcomingStays.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarDays size={28} className="mx-auto mb-3 text-[var(--color-admin-sage)]" aria-hidden="true" />
              <p className="font-medium">No upcoming stays yet</p>
              <p className="mt-1 text-sm text-[var(--color-admin-sage)]">Choose an open date in the calendar to add a reservation.</p>
              <Link href="/admin/calendar" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-admin-terracotta)] hover:underline">
                Create a reservation <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-admin-mist)]">
              {dashboard.upcomingStays.map((stay) => (
                <Link
                  key={stay.id}
                  href={`/admin/reservations/${stay.id}`}
                  className="group grid gap-3 px-5 py-4 transition hover:bg-[var(--color-admin-mineral)]/60 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[var(--color-admin-ink)]">{stay.guestName}</p>
                      <StatusBadge status={stay.bookingStatus} />
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--color-admin-sage)]">{stay.reservationNumber} · {stay.unitName}</p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-medium">{formatDateKey(stay.checkInDate)}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-admin-sage)]">to {formatDateKey(stay.checkOutDate)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-sm font-medium">{stay.guestCount} {stay.guestCount === 1 ? 'guest' : 'guests'}</p>
                      <p className="mt-0.5 text-xs capitalize text-[var(--color-admin-sage)]">{formatStatus(stay.paymentStatus)}</p>
                    </div>
                    <ArrowRight size={16} className="text-[var(--color-admin-sage)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-admin-terracotta)]" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--color-admin-mist)] bg-[var(--color-admin-shell)] p-5 shadow-sm sm:p-6" aria-labelledby="attention-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="attention-heading" className="font-[var(--font-display)] text-lg font-semibold">Payment attention</h3>
              <p className="mt-1 text-xs text-[var(--color-admin-sage)]">Guest proofs waiting for review</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">{metrics.pendingProofs}</span>
          </div>

          {dashboard.paymentAttention.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[var(--color-admin-mist)] bg-white/60 px-4 py-8 text-center">
              <ShieldCheck size={26} className="mx-auto mb-2 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-semibold">All caught up</p>
              <p className="mt-1 text-xs text-[var(--color-admin-sage)]">No payment proofs need review.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {dashboard.paymentAttention.map((item) => (
                <Link key={item.id} href={`/admin/reservations/${item.reservationId}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-admin-mist)] bg-white p-3.5 transition hover:border-amber-300">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.guestName}</p>
                    <p className="mt-1 text-xs text-[var(--color-admin-sage)]">{item.reservationNumber} · {formatGoaDateTime(item.submittedAt)}</p>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-[var(--color-admin-sage)] transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--color-admin-mist)] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="activity-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 id="activity-heading" className="font-[var(--font-display)] text-lg font-semibold">Recent activity</h3>
            <p className="mt-1 text-xs text-[var(--color-admin-sage)]">Latest reservation, invoice, and payment actions</p>
          </div>
          <Activity size={19} className="text-[var(--color-admin-terracotta)]" aria-hidden="true" />
        </div>

        {dashboard.recentActivity.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--color-admin-mist)] bg-[var(--color-admin-mineral)]/40 p-7 text-center text-sm text-[var(--color-admin-sage)]">
            Activity will appear here after the first reservation or payment action.
          </div>
        ) : (
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboard.recentActivity.map((item) => {
              const content = (
                <>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-admin-terracotta)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--color-admin-sage)]">{item.detail}</span>
                  </span>
                  <time className="shrink-0 text-[11px] text-[var(--color-admin-sage)]" dateTime={item.createdAt.toISOString()}>{formatGoaDateTime(item.createdAt)}</time>
                </>
              );

              return (
                <li key={item.id}>
                  {item.reservationId ? (
                    <Link href={`/admin/reservations/${item.reservationId}`} className="flex h-full items-start gap-3 rounded-xl border border-[var(--color-admin-mist)] p-3.5 transition hover:bg-[var(--color-admin-mineral)]/60">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex h-full items-start gap-3 rounded-xl border border-[var(--color-admin-mist)] p-3.5">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
