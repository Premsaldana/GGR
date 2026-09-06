import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { shareLinks, invoices, qrPaymentArtifacts, reservations, units } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { QRCodeSVG } from 'qrcode.react';
import crypto from 'crypto';
import { PaymentUploadForm } from './PaymentUploadForm';
import { paymentProofs } from '@/db/schema';

// Ensure the page isn't indexed by search engines
export const metadata = {
  title: 'Guest Bill - Goa Garden Resort',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  let token = '';
  try {
    token = (await params).token;
  } catch (e) {
    console.warn('Share page access denied: Invalid token format');
    return notFound();
  }

  try {
    // Hash the incoming token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const shareLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();

    if (!shareLink) {
      console.warn('Share page access denied: Token not found or revoked');
      return notFound();
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      console.warn('Share page access denied: Token expired');
      return notFound();
    }

    const invoice = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId)).get();
    if (!invoice) {
      console.warn('Share page access denied: Invoice not found');
      return notFound();
    }

    const reservation = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
    if (!reservation) {
      console.warn('Share page access denied: Reservation not found');
      return notFound();
    }

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

  const guestName = snapshot?.guestName || 'Guest name pending';

  const pendingProofs = db.select().from(paymentProofs)
    .where(eq(paymentProofs.invoiceId, invoice.id))
    .all()
    .filter(p => p.status === 'pending_review');

  const hasPendingProof = pendingProofs.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-[#233B35] text-white py-6 px-6 text-center">
          <h1 className="text-2xl font-serif tracking-wide">Goa Garden Resort</h1>
          <p className="opacity-90 mt-1 text-sm uppercase tracking-widest">Payment Receipt</p>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Guest</span>
              <span className="font-medium text-right">{guestName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Reference</span>
              <span className="font-medium text-right">{reservation.reservationNumber}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Property</span>
              <span className="font-medium text-right">{unit?.displayName || 'Unit'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Stay</span>
              <span className="font-medium text-right">
                {reservation.checkInDate} to {reservation.checkOutDate}
              </span>
            </div>
          </div>
        </div>

        {qrArtifact ? (
          <div className="p-6 bg-[#FFFCF6] flex flex-col items-center">
            <p className="text-xs text-gray-500 mb-4 text-center">
              Scan using any UPI app to pay
            </p>
            
            <div className="bg-white p-4 shadow-sm rounded-lg mb-4 border border-gray-100">
              <QRCodeSVG value={qrArtifact.upiUri} size={200} />
            </div>
            
            <p className="text-3xl font-bold mt-2 text-[#233B35]">Rs.{qrArtifact.amountMinorUnits / 100}</p>
            <p className="text-xs text-gray-500 mb-6 mt-1">UPI ID: {qrArtifact.upiId} ({qrArtifact.payeeName})</p>
            
            <div className="w-full bg-yellow-50 text-yellow-800 text-xs p-3 rounded text-center border border-yellow-100">
              Payment is not automatically verified by this screen.
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-600 mb-2">No active payment request.</p>
            <p className="text-xs text-gray-400">Please contact the front desk.</p>
          </div>
        )}

        <PaymentUploadForm token={token} hasPendingProof={hasPendingProof} />

        <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-100">
          <p>Support: +91-7813093075 | goagardenresort@gmail.com</p>
        </div>
      </div>
    </div>
  );
  } catch (err: any) {
    console.warn('Share page error:', err.message);
    return notFound();
  }
}
