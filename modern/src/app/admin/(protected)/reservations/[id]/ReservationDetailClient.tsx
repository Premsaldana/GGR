'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InvoicePreview } from '../../../components/InvoicePreview';
import { issueInvoiceAction } from '../../calendar/actions';
import { InvoiceCalculationResult } from '@/lib/invoice';
import { verifyProofAction, rejectProofAction, finalizeInvoiceAction } from './actions';

type Props = {
  reservation: any;
  lineItems: any[];
  unit: any;
  draftCalculation: InvoiceCalculationResult;
  issuedInvoice: any;
  proofs: any[];
};

export default function ReservationDetailClient({ reservation, lineItems, unit, draftCalculation, issuedInvoice, proofs }: Props) {
  const router = useRouter();
  const [viewState, setViewState] = useState<'details' | 'preview' | 'proofs'>('details');
  const [isIssuing, setIsIssuing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState('');
  
  // Proof action states
  const [activeProofId, setActiveProofId] = useState<string | null>(null);
  const [verifyAmount, setVerifyAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [rejectResubmit, setRejectResubmit] = useState(false);

  const handleIssue = async () => {
    setIsIssuing(true);
    setError('');
    try {
      const res = await issueInvoiceAction(reservation.id) as any;
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message);
    }
    setIsIssuing(false);
  };

  const handleVerify = async (proofId: string) => {
    setError('');
    const res = await verifyProofAction(proofId, verifyAmount * 100, paymentMode, paymentReference, adminNote) as any;
    if (res.error) setError(res.error);
    else {
      setActiveProofId(null);
      router.refresh();
    }
  };

  const handleReject = async (proofId: string) => {
    setError('');
    const res = await rejectProofAction(proofId, adminNote, rejectResubmit) as any;
    if (res.error) setError(res.error);
    else {
      setActiveProofId(null);
      router.refresh();
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    setError('');
    const res = await finalizeInvoiceAction(reservation.id) as any;
    if (res.error) setError(res.error);
    else router.refresh();
    setIsFinalizing(false);
  };

  const invoiceToDisplay = issuedInvoice ? JSON.parse(issuedInvoice.snapshotJson) : null;
  const currentCalculation = issuedInvoice ? invoiceToDisplay.calculation : draftCalculation;
  const currentLineItems = issuedInvoice ? invoiceToDisplay.input.lineItems : lineItems;
  const isDraft = !issuedInvoice;
  const isFinalized = issuedInvoice?.finalizedAt != null;

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-md shadow-sm border border-[var(--color-admin-mist)]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[var(--color-admin-forest)]">
            Reservation {reservation.reservationNumber || 'Draft'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Status: <span className="uppercase font-semibold">{reservation.bookingStatus}</span></p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setViewState('details')} 
            className={`px-4 py-2 rounded-md text-sm ${viewState === 'details' ? 'bg-[var(--color-admin-mineral)] text-[#233B35] font-semibold' : 'bg-gray-100 text-gray-600'}`}
          >
            Details
          </button>
          <button 
            onClick={() => setViewState('preview')} 
            className={`px-4 py-2 rounded-md text-sm ${viewState === 'preview' ? 'bg-[var(--color-admin-mineral)] text-[#233B35] font-semibold' : 'bg-gray-100 text-gray-600'}`}
          >
            {isDraft ? 'Preview Bill' : 'Invoice'}
          </button>
          <button 
            onClick={() => setViewState('proofs')} 
            className={`px-4 py-2 rounded-md text-sm ${viewState === 'proofs' ? 'bg-[var(--color-admin-mineral)] text-[#233B35] font-semibold' : 'bg-gray-100 text-gray-600'}`}
          >
            Proofs ({proofs.length})
          </button>
        </div>
      </div>

      {viewState === 'details' && (
        <div className="bg-white p-6 rounded-md shadow-sm border border-[var(--color-admin-mist)] grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Guest & Stay</h3>
            <p><strong>Guest Name:</strong> {reservation.guestName}</p>
            <p><strong>Unit:</strong> {unit?.displayName}</p>
            <p><strong>Check-In:</strong> {reservation.checkInDate}</p>
            <p><strong>Check-Out:</strong> {reservation.checkOutDate}</p>
            <p><strong>Guests:</strong> {reservation.adults} Adults, {reservation.children} Children</p>
            <p><strong>Advance Received:</strong> ₹{(reservation.advanceReceivedMinorUnits || 0) / 100}</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Draft Line Items</h3>
            {lineItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No line items added yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lineItems.map((li: any, idx: number) => (
                  <li key={idx} className="flex justify-between border-b border-dashed pb-1">
                    <span>{li.description} (x{li.quantity})</span>
                    <span>₹{li.amountMinorUnits / 100}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {viewState === 'preview' && (
        <div id="invoice" className="space-y-4">
          <div className="bg-white p-4 rounded-md shadow-sm border border-[var(--color-admin-mist)] flex justify-between items-center">
            <div>
              {isDraft ? (
                <p className="text-sm text-gray-600">This is a preview. Issue the invoice to finalize it and generate payment links.</p>
              ) : (
                <p className="text-sm text-green-700 font-semibold">Invoice has been issued. Payment links and PDF are available below.</p>
              )}
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>
            {isDraft ? (
              <button 
                onClick={handleIssue}
                disabled={isIssuing}
                className="bg-[#B75E3C] text-white px-6 py-2 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 flex items-center space-x-2"
              >
                {isIssuing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                <span>Issue Invoice</span>
              </button>
            ) : reservation.paymentStatus === 'paid' && !isFinalized ? (
              <button 
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="bg-green-700 text-white px-6 py-2 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 flex items-center space-x-2"
              >
                {isFinalizing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                <span>Finalize Invoice</span>
              </button>
            ) : null}
          </div>

          <InvoicePreview 
            invoiceId={issuedInvoice?.id}
            reservation={{
              ...reservation,
              unitDisplayName: unit?.displayName
            }}
            calculation={currentCalculation}
            lineItems={currentLineItems}
            isDraft={isDraft}
          />
        </div>
      )}

      {viewState === 'proofs' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-md shadow-sm border border-[var(--color-admin-mist)]">
            <h3 className="font-semibold text-lg border-b pb-4 mb-4">Payment Proofs</h3>
            
            {proofs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No payment proofs uploaded for this reservation.</p>
            ) : (
              <div className="space-y-6">
                {proofs.map(proof => (
                  <div key={proof.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-sm">Status: <span className="uppercase">{proof.status}</span></p>
                        <p className="text-xs text-gray-500">Submitted: {new Date(proof.submittedAt).toLocaleString()}</p>
                      </div>
                      <a 
                        href={`/api/admin/proofs/${proof.storageKey}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View Document
                      </a>
                    </div>

                    {(proof.status === 'pending_review' || proof.status === 'resubmit_requested') && activeProofId !== proof.id && !isFinalized && (
                      <div className="flex space-x-2">
                        <button onClick={() => {
                          setActiveProofId(proof.id);
                          setVerifyAmount(currentCalculation.balanceMinorUnits / 100);
                        }} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700">
                          Review
                        </button>
                      </div>
                    )}

                    {activeProofId === proof.id && (
                      <div className="mt-4 bg-white p-4 border border-gray-200 rounded-md space-y-4">
                        <h4 className="font-semibold text-sm border-b pb-2">Review Action</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Verify Amount (Rs)</label>
                            <input 
                              type="number" 
                              value={verifyAmount} 
                              onChange={e => setVerifyAmount(Number(e.target.value))}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1">Mode</label>
                            <select 
                              value={paymentMode} 
                              onChange={e => setPaymentMode(e.target.value)}
                              className="w-full border rounded p-2 text-sm"
                            >
                              <option value="UPI">UPI</option>
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                              <option value="CASH">Cash</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1">Reference ID (Optional)</label>
                            <input 
                              type="text" 
                              value={paymentReference} 
                              onChange={e => setPaymentReference(e.target.value)}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1">Admin Note (Required for rejection)</label>
                            <input 
                              type="text" 
                              value={adminNote} 
                              onChange={e => setAdminNote(e.target.value)}
                              className="w-full border rounded p-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={rejectResubmit} onChange={e => setRejectResubmit(e.target.checked)} />
                            <span>Request Resubmit (if Rejecting)</span>
                          </label>
                          <div className="flex space-x-2">
                            <button onClick={() => setActiveProofId(null)} className="px-4 py-2 text-sm border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleReject(proof.id)} className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">Reject</button>
                            <button onClick={() => handleVerify(proof.id)} className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Verify Payment</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
