import Link from 'next/link';
import { db } from '@/db';
import { guests, invoices, reservations, units } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getDashboardReservationCounts, getTodayInResortTimeZone } from '@/lib/dashboard';

type Activity = {
  id: string;
  label: string;
  detail: string;
  timestamp: Date;
};

export default function DashboardPage() {
  const today = getTodayInResortTimeZone();
  const { arrivingToday, departingToday, inHouseToday } = getDashboardReservationCounts(db, today);
  const recentReservations = db.select({
    reservation: reservations,
    guest: guests,
    unit: units,
  })
    .from(reservations)
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .innerJoin(units, eq(reservations.unitId, units.id))
    .orderBy(desc(reservations.updatedAt))
    .limit(6)
    .all();
  const recentInvoices = db.select({ invoice: invoices })
    .from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(6)
    .all();

  const activities: Activity[] = [
    ...recentReservations.map(({ reservation, guest, unit }) => ({
      id: `reservation-${reservation.id}`,
      label: `Reservation ${reservation.reservationNumber}`,
      detail: `${guest.fullName} · ${unit.displayName} · ${reservation.bookingStatus}`,
      timestamp: reservation.updatedAt,
    })),
    ...recentInvoices.map(({ invoice }) => ({
      id: `invoice-${invoice.id}`,
      label: `Invoice ${invoice.invoiceNumber}`,
      detail: `${invoice.status} · ₹${(invoice.totalMinorUnits / 100).toFixed(2)}`,
      timestamp: invoice.createdAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-2">Overview</h2>
        <p className="text-[var(--color-admin-sage)] text-sm">Today&apos;s snapshot at Goa Garden Resort</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">In-House Guests</h3>
          <p className="text-3xl font-[var(--font-display)]">{inHouseToday}</p>
        </div>
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">Arriving Today</h3>
          <p className="text-3xl font-[var(--font-display)]">{arrivingToday}</p>
        </div>
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">Departing Today</h3>
          <p className="text-3xl font-[var(--font-display)]">{departingToday}</p>
        </div>
      </div>
      <section className="mt-8 bg-white border border-[var(--color-admin-mist)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-admin-mist)] px-5 py-4">
          <div>
            <h3 className="font-semibold text-[var(--color-admin-forest)]">Recent activity</h3>
            <p className="text-xs text-[var(--color-admin-sage)] mt-1">Latest reservation and invoice updates</p>
          </div>
          <Link href="/admin/calendar" className="text-sm text-[var(--color-admin-terracotta)] hover:underline">Open calendar</Link>
        </div>
        {activities.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--color-admin-sage)]">No recent activity to display.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-admin-mist)]">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[var(--color-admin-forest)] break-words">{activity.label}</p>
                  <p className="text-xs text-[var(--color-admin-sage)] mt-1 break-words">{activity.detail}</p>
                </div>
                <time className="shrink-0 text-xs text-[var(--color-admin-sage)]" dateTime={activity.timestamp.toISOString()}>
                  {activity.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
