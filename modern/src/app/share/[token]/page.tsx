import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { shareLinks, invoices, qrPaymentArtifacts, reservations, units } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { QRCodeSVG } from 'qrcode.react';
import crypto from 'crypto';
import { InvoicePreview } from '@/app/admin/components/InvoicePreview';

// Ensure the page isn't indexed by search engines
export const metadata = {
  title: 'Guest Bill - Goa Garden Resort',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharePage({ params }: { params: { token: string } }) {
  // Hash the incoming token
  const tokenHash = crypto.createHash('sha256').update(params.token).digest('hex');

  const shareLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();

  if (!shareLink) {
    return notFound();
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    return notFound();
  }

  const invoice = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId)).get();
  if (!invoice) return notFound();

  const reservation = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
  if (!reservation) return notFound();

  const unit = db.select().from(units).where(eq(units.id, reservation.unitId)).get();

  // Parse the snapshot JSON for line items
  let snapshot;
  try {
    snapshot = invoice.snapshotJson ? JSON.parse(invoice.snapshotJson) : null;
  } catch (e) {
    snapshot = null;
  }

  const qrArtifact = db.select().from(qrPaymentArtifacts)
    .where(eq(qrPaymentArtifacts.invoiceId, invoice.id))
    .orderBy(desc(qrPaymentArtifacts.artifactVersion))
    .limit(1)
    .get();

  const calcResult = {
    subtotalMinorUnits: invoice.subtotalMinorUnits,
    taxMinorUnits: invoice.taxMinorUnits,
    securityDepositMinorUnits: invoice.securityDepositMinorUnits,
    totalMinorUnits: invoice.totalMinorUnits,
    advanceMinorUnits: invoice.advanceMinorUnits,
    balanceMinorUnits: invoice.balanceMinorUnits,
    amountInWords: invoice.amountInWords || '',
    overpaymentMinorUnits: invoice.balanceMinorUnits < 0 ? Math.abs(invoice.balanceMinorUnits) : 0,
  };

  const resData = {
    reservationNumber: reservation.reservationNumber,
    guestName: snapshot?.guestName || '',
    unitDisplayName: unit?.displayName || 'Unit',
    bookingStatus: reservation.bookingStatus,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    adults: reservation.adults,
    children: reservation.children,
    paymentMode: reservation.paymentMode || '',
    advanceReceivedMinorUnits: reservation.advanceReceivedMinorUnits || 0,
    advanceReceivedAt: reservation.advanceReceivedAt ? new Date(reservation.advanceReceivedAt).toISOString() : '',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-[#233B35] text-white py-6 px-8 text-center">
          <h1 className="text-2xl font-serif">Goa Garden Resort</h1>
          <p className="opacity-80 mt-1">Guest Invoice & Payment</p>
        </div>

        <div className="p-8">
          {/* Guest-facing invoice preview */}
          <InvoicePreview 
            reservation={resData}
            calculation={calcResult}
            lineItems={snapshot?.lineItems || []}
            isDraft={false}
          />
        </div>

        {/* Guest-facing QR display */}
        {qrArtifact && (
          <div className="border-t border-[#E8E1D6] p-8 bg-[#FFFCF6] flex flex-col items-center">
            <h3 className="font-semibold text-lg mb-4 text-[#1D2422]">Payment Request</h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
              Please scan the QR code below using your preferred UPI app to complete the payment.
            </p>
            
            <div className="bg-white p-4 shadow-sm rounded-lg mb-4">
              <QRCodeSVG value={qrArtifact.upiUri} size={200} />
            </div>
            
            <p className="text-2xl font-bold mt-2 text-[#233B35]">₹{qrArtifact.amountMinorUnits / 100}</p>
            <p className="text-sm text-gray-500 mb-4">Payee: {qrArtifact.payeeName}</p>
            
            <div className="w-full max-w-md bg-yellow-50 text-yellow-800 text-sm p-3 rounded text-center border border-yellow-200">
              Payment is not automatically verified by this screen. Please show the payment confirmation to the front desk.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
