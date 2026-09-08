import Link from 'next/link';
import { db } from '@/db';
import { getCanonicalRoomType } from '@/lib/units';
import { getDashboardMetrics } from '@/lib/dashboard';
import { DashboardCharts } from './DashboardCharts';

const money = (minorUnits: number) => `₹${(minorUnits / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const dateLabel = (value: Date) => value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function MetricCard({ label, value, detail, tone = 'default' }: { label: string; value: string | number; detail: string; tone?: 'default' | 'good' | 'warning' }) {
  const toneClass = tone === 'good' ? 'text-[#2E7D32]' : tone === 'warning' ? 'text-[var(--color-admin-brass)]' : 'text-[var(--color-admin-forest)]';
  return <div className="bg-white border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm min-h-[132px]"><p className="text-[11px] font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider">{label}</p><p className={`text-2xl font-[var(--font-display)] font-semibold mt-3 ${toneClass}`}>{value}</p><p className="text-xs text-[var(--color-admin-sage)] mt-1">{detail}</p></div>;
}

export default function DashboardPage() {
  const metrics = getDashboardMetrics(db);
  const { financial, operations } = metrics;
  const activities = [
    ...metrics.recentReservations.map(({ reservation, guest, unit }) => ({ id: `reservation-${reservation.id}`, label: `Reservation ${reservation.reservationNumber}`, detail: `${guest.fullName} · ${getCanonicalRoomType(unit) || unit.displayName} · ${reservation.bookingStatus}`, timestamp: reservation.updatedAt })),
    ...metrics.recentInvoices.map((invoice) => ({ id: `invoice-${invoice.id}`, label: `Invoice ${invoice.invoiceNumber}`, detail: `${invoice.status} · ${money(invoice.totalMinorUnits)}`, timestamp: invoice.createdAt })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  const growthDetail = financial.revenueGrowthPercent === null ? 'No prior-month comparison available' : `${financial.revenueGrowthPercent >= 0 ? '+' : ''}${financial.revenueGrowthPercent.toFixed(1)}% vs previous month`;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div><p className="text-xs font-semibold text-[var(--color-admin-terracotta)] uppercase tracking-widest">Resort command center</p><h2 className="text-3xl font-[var(--font-display)] font-semibold mt-2">Good morning, Goa Garden</h2><p className="text-[var(--color-admin-sage)] text-sm mt-2">Five decision-ready signals for {metrics.today}.</p></div>
        <Link href="/admin/calendar" className="admin-button admin-button--primary">Create reservation</Link>
      </header>

      <section aria-labelledby="dashboard-metrics-heading"><div className="flex items-center justify-between gap-4 mb-3"><h3 id="dashboard-metrics-heading" className="font-semibold text-[var(--color-admin-forest)]">Today at a glance</h3><span className="text-xs text-[var(--color-admin-sage)] hidden sm:block">Live from reservations, invoices, and payments</span></div><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"><MetricCard label="Collected this month" value={money(financial.monthRevenue)} detail={growthDetail} tone={financial.revenueGrowthPercent !== null && financial.revenueGrowthPercent >= 0 ? 'good' : 'default'} /><MetricCard label="Outstanding dues" value={money(financial.outstandingDues)} detail={`${financial.dueInvoices} invoice${financial.dueInvoices === 1 ? '' : 's'} pending or due`} tone={financial.outstandingDues > 0 ? 'warning' : 'good'} /><MetricCard label="Occupancy rate" value={`${operations.occupancyRate.toFixed(0)}%`} detail={`${operations.occupiedUnits} occupied · ${operations.availableUnits} available`} tone={operations.occupancyRate >= 80 ? 'warning' : 'good'} /><MetricCard label="Currently in-house" value={operations.inHouseToday} detail={`${operations.totalUnits} active rooms in inventory`} /><MetricCard label="Arrivals / departures" value={`${operations.arrivingToday} / ${operations.departingToday}`} detail="Today · arrivals / departures" /></div></section>

      <section aria-labelledby="room-summary-heading" className="bg-white border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"><div><h3 id="room-summary-heading" className="font-semibold text-[var(--color-admin-forest)]">Room availability</h3><p className="text-xs text-[var(--color-admin-sage)] mt-1">Current availability by approved room type</p></div><Link href="/admin/calendar" className="text-sm font-medium text-[var(--color-admin-terracotta)] hover:underline">Open calendar</Link></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{metrics.roomTypePerformance.map((room) => <div key={room.roomType} className="flex items-center justify-between rounded-lg bg-[var(--color-admin-mineral)]/60 px-4 py-3"><div><p className="font-semibold text-[var(--color-admin-forest)]">{room.roomType}</p><p className="text-xs text-[var(--color-admin-sage)]">{room.bookings} bookings · {room.occupancyRate.toFixed(0)}% occupied</p></div><p className="text-sm font-semibold text-[var(--color-admin-terracotta)]">{room.available} available</p></div>)}</div></section>

      <DashboardCharts revenueTrend={metrics.revenueTrend} occupancyTrend={metrics.occupancyTrend} />

      <section className="bg-white border border-[var(--color-admin-mist)] rounded-xl shadow-sm overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--color-admin-mist)] px-5 py-4"><div><h3 className="font-semibold text-[var(--color-admin-forest)]">Recent activity</h3><p className="text-xs text-[var(--color-admin-sage)] mt-1">Latest reservation and invoice updates</p></div><Link href="/admin/invoices" className="text-sm font-medium text-[var(--color-admin-terracotta)] hover:underline">Open invoices</Link></div>{activities.length === 0 ? <p className="px-5 py-8 text-sm text-[var(--color-admin-sage)]">No recent activity to display.</p> : <ul className="divide-y divide-[var(--color-admin-mist)]">{activities.map((activity) => <li key={activity.id} className="flex items-start justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="font-medium text-sm text-[var(--color-admin-forest)] break-words">{activity.label}</p><p className="text-xs text-[var(--color-admin-sage)] mt-1 break-words">{activity.detail}</p></div><time className="shrink-0 text-xs text-[var(--color-admin-sage)]" dateTime={activity.timestamp.toISOString()}>{dateLabel(activity.timestamp)}</time></li>)}</ul>}</section>
    </div>
  );
}
