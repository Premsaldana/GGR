"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type InvoiceRow = {
  invoice: {
    id: string;
    invoiceNumber: string;
    totalMinorUnits: number;
    balanceMinorUnits: number;
  };
  reservation: {
    id: string;
    reservationNumber: string;
    checkInDate: string;
    checkOutDate: string;
    paymentStatus: string;
  };
  guest: { fullName: string };
  unit: { displayName: string };
};

function matchesSearch(row: InvoiceRow, search: string) {
  if (!search) return true;
  return [
    row.invoice.invoiceNumber,
    row.reservation.reservationNumber,
    row.guest.fullName,
    row.unit.displayName,
    row.reservation.checkInDate,
    row.reservation.checkOutDate,
    row.reservation.paymentStatus,
  ].some((value) => value.toLowerCase().includes(search));
}

export default function InvoiceTableClient({ rows }: { rows: InvoiceRow[] }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(input.trim().toLowerCase()), 350);
    return () => window.clearTimeout(timer);
  }, [input]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );

  return (
    <div className="flex-1 bg-white border border-[var(--color-admin-mist)] rounded-md shadow-sm overflow-hidden flex flex-col">
      <div className="border-b bg-gray-50 p-4">
        <label htmlFor="invoice-search" className="sr-only">Search invoices</label>
        <input
          id="invoice-search"
          type="search"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder="Search invoice, reservation, guest, room type, date, or status"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-admin-terracotta)] focus:ring-1 focus:ring-[var(--color-admin-terracotta)]"
        />
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Invoice #</th>
              <th className="px-6 py-3 font-semibold">Guest</th>
              <th className="px-6 py-3 font-semibold">Room Type</th>
              <th className="px-6 py-3 font-semibold">Dates</th>
              <th className="px-6 py-3 font-semibold">Total Amount</th>
              <th className="px-6 py-3 font-semibold">Balance Due</th>
              <th className="px-6 py-3 font-semibold">Payment Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">No invoices found.</td></tr>
            ) : filteredRows.map((row) => (
              <tr key={row.invoice.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{row.invoice.invoiceNumber}</td>
                <td className="px-6 py-4">{row.guest.fullName}</td>
                <td className="px-6 py-4 text-xs align-top">
                  <span className="inline-flex max-w-[180px] whitespace-normal break-words leading-5 bg-gray-100 px-2 py-1 rounded border">
                    {row.unit.displayName}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs whitespace-nowrap">{row.reservation.checkInDate}<br />to {row.reservation.checkOutDate}</td>
                <td className="px-6 py-4 font-semibold text-[#B75E3C]">₹{(row.invoice.totalMinorUnits / 100).toFixed(2)}</td>
                <td className="px-6 py-4 font-semibold">₹{(row.invoice.balanceMinorUnits / 100).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${row.reservation.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : row.reservation.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' : row.reservation.paymentStatus === 'qr_generated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {row.reservation.paymentStatus.replaceAll('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right"><Link href={`/admin/reservations/${row.reservation.id}#invoice`} className="text-[var(--color-admin-terracotta)] hover:underline font-medium">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { InvoiceRow };
