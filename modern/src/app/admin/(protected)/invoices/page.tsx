import { db } from '@/db';
import { invoices, reservations, units, guests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function InvoicesPage() {
  // Query all invoices with their related reservation, guest, and unit data
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
      
      <div className="flex-1 bg-white border border-[var(--color-admin-mist)] rounded-md shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Invoice #</th>
                <th className="px-6 py-3 font-semibold">Guest</th>
                <th className="px-6 py-3 font-semibold">Unit</th>
                <th className="px-6 py-3 font-semibold">Dates</th>
                <th className="px-6 py-3 font-semibold">Total Amount</th>
                <th className="px-6 py-3 font-semibold">Balance Due</th>
                <th className="px-6 py-3 font-semibold">Payment Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">No invoices found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.invoice.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{row.guest.fullName}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded border">{row.unit.displayName}</span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {row.reservation.checkInDate} <br/>to {row.reservation.checkOutDate}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#B75E3C]">
                      ₹{(row.invoice.totalMinorUnits / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      ₹{(row.invoice.balanceMinorUnits / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        row.reservation.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        row.reservation.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                        row.reservation.paymentStatus === 'qr_generated' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.reservation.paymentStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/reservations/${row.reservation.id}#invoice`}
                        className="text-[var(--color-admin-terracotta)] hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
