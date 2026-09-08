import { db } from '@/db';
import { invoices, reservations, units, guests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import InvoiceTableClient from './InvoiceTableClient';

export default async function InvoicesPage() {
  const rows = await db.select({
    invoice: invoices,
    reservation: reservations,
    guest: guests,
    unit: units,
  })
    .from(invoices)
    .innerJoin(reservations, eq(invoices.reservationId, reservations.id))
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .innerJoin(units, eq(reservations.unitId, units.id))
    .orderBy(desc(invoices.createdAt))
    .all();

  return (
    <div className="h-full flex flex-col">
      <header className="mb-6">
        <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-1 text-[var(--color-admin-forest)]">Invoices</h2>
        <p className="text-[var(--color-admin-sage)] text-sm">View and manage issued invoices.</p>
      </header>
      <InvoiceTableClient rows={rows} />
    </div>
  );
}
