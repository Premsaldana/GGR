import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { shareLinks, invoices, qrPaymentArtifacts, reservations, units } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { QRCodeSVG } from 'qrcode.react';
import crypto from 'crypto';
import { PaymentUploadForm } from './PaymentUploadForm';
import { paymentProofs } from '@/db/schema';
import { GuestRealtimeVerification } from './GuestRealtimeVerification';
import { Button } from '@/components/ui/Button';

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

  let snapshot: any;
  let qrArtifact: any;
  let hasPendingProof = false;
  let guestName = 'Guest name pending';
  let unitName = 'Unit';
  let reservationData: any;
  let invoiceData: any;

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const shareLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();

    if (!shareLink || new Date(shareLink.expiresAt) < new Date()) {
      return notFound();
    }

    const invoice = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId)).get();
    if (!invoice) return notFound();
    invoiceData = invoice;

    const reservation = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
    if (!reservation) return notFound();
    reservationData = reservation;

    const unit = db.select().from(units).where(eq(units.id, reservation.unitId)).get();
    unitName = unit?.displayName || 'Unit';

    try {
      snapshot = invoice.snapshotJson ? JSON.parse(invoice.snapshotJson) : null;
    } catch (e) {
      snapshot = null;
    }

    qrArtifact = db.select().from(qrPaymentArtifacts)
      .where(eq(qrPaymentArtifacts.invoiceId, invoice.id))
      .orderBy(desc(qrPaymentArtifacts.artifactVersion))
      .limit(1)
      .get();

    guestName = snapshot?.guestName || 'Guest name pending';

    const pendingProofs = db.select().from(paymentProofs)
      .where(eq(paymentProofs.invoiceId, invoice.id))
      .all()
      .filter(p => p.status === 'pending_review');

    hasPendingProof = pendingProofs.length > 0;
  } catch (err: any) {
    console.warn('Share page error:', err.message);
    return notFound();
  }

    const isFinalized = invoiceData.finalizedAt !== null;
    const isPaid = invoiceData.status === 'paid' || invoiceData.balanceMinorUnits <= 0;
    const verifiedProof = db.select().from(paymentProofs)
      .where(eq(paymentProofs.invoiceId, invoiceData.id))
      .all()
      .find(p => p.status === 'verified');

    const isVerified = isFinalized || isPaid || !!verifiedProof;

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
                <span className="font-medium text-right">{reservationData.reservationNumber}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500">Property</span>
                <span className="font-medium text-right">{unitName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500">Stay</span>
                <span className="font-medium text-right">
                  {reservationData.checkInDate} to {reservationData.checkOutDate}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500">Invoice Total</span>
                <span className="font-medium text-right">Rs.{invoiceData.totalMinorUnits / 100}</span>
              </div>
            </div>
          </div>

          {isVerified ? (
            <div className="p-6 bg-[#E8F5E9] flex flex-col items-center border-b border-[#C8E6C9]">
              <div className="w-12 h-12 rounded-full bg-[#4CAF50] text-white flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-lg font-semibold text-[#2E7D32] mb-1">Payment Verified</p>
              <p className="text-sm text-[#388E3C] mb-6 text-center">Your payment has been received and verified by the resort.</p>
              
              <Button as="a" href={`/api/share/${token}/download`} target="_blank" rel="noopener noreferrer" className="w-full">
                Download Invoice (PDF)
              </Button>
            </div>
          ) : qrArtifact ? (
            <div className="p-6 bg-[#FFFCF6] flex flex-col items-center border-b border-gray-100">
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
            <div className="p-6 bg-gray-50 flex flex-col items-center justify-center text-center border-b border-gray-100">
              <p className="text-sm text-gray-600 mb-2">No active payment request.</p>
              <p className="text-xs text-gray-400">Please contact the front desk.</p>
            </div>
          )}

          {!isVerified && (
            <PaymentUploadForm token={token} hasPendingProof={hasPendingProof} />
          )}

          {!isVerified && (
            <GuestRealtimeVerification token={token} invoiceId={invoiceData.id} />
          )}

        <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-100">
          <p>Support: +91-7813093075 | goagardenresort@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
