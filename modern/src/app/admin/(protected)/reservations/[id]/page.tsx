import { notFound } from 'next/navigation';
import { db } from '@/db';
import { reservations, units, reservationLineItems, invoices, guests, paymentProofs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import ReservationDetailClient from './ReservationDetailClient';
import { calculateInvoiceAction } from '../../calendar/actions';

import { requireAdmin } from '@/lib/session';

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const reservationId = (await params).id;

  const reservation = await db.select().from(reservations).where(eq(reservations.id, reservationId)).get();
  
  if (!reservation) {
    notFound();
  }

  const guest = await db.select().from(guests).where(eq(guests.id, reservation.guestId)).get();
  const unit = await db.select().from(units).where(eq(units.id, reservation.unitId)).get();
  const lineItems = await db.select().from(reservationLineItems).where(eq(reservationLineItems.reservationId, reservationId)).all();
  
  // Find the latest issued invoice, if any
  const issuedInvoices = await db.select().from(invoices)
    .where(eq(invoices.reservationId, reservationId))
    .orderBy(desc(invoices.version))
    .all();
  
  const issuedInvoice = issuedInvoices.length > 0 ? issuedInvoices[0] : null;

  let proofs: any[] = [];
  if (issuedInvoices.length > 0) {
    const invoiceIds = issuedInvoices.map(i => i.id);
    // SQLite drizzle doesn't natively do `inArray` easily without importing it, so we can fetch all proofs for these invoices
    // actually, inArray is in 'drizzle-orm', let's just use it or do a manual filter.
    // Or just fetch all proofs for the reservation's invoices:
    const allProofsRows = await db.select().from(paymentProofs).all();
    proofs = allProofsRows.filter(p => invoiceIds.includes(p.invoiceId));
  }

  // Pre-calculate draft if not issued
  let draftCalculation = null;
  if (!issuedInvoice) {
    const calcInput = {
      lineItems: lineItems.map(li => ({
        category: li.category,
        description: li.description,
        quantity: li.quantity,
        rateMinorUnits: li.rateMinorUnits,
        taxRate: li.taxRate ?? undefined,
      })),
      advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits ?? 0,
      refundableSecurityDepositMinorUnits: 500000,
    };
    
    const res = await calculateInvoiceAction(calcInput);
    if (res.success) {
      draftCalculation = res.data;
    }
  }

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      <ReservationDetailClient 
        reservation={{ ...reservation, guestName: guest?.fullName }} 
        lineItems={lineItems} 
        unit={unit} 
        draftCalculation={draftCalculation as any} 
        issuedInvoice={issuedInvoice} 
        proofs={proofs}
      />
    </div>
  );
}
