'use client';

import React, { useState, useEffect } from 'react';
import { recordPaymentAction, getPaymentsAction } from '../(protected)/calendar/actions-payment';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';

interface PaymentTrackerProps {
  invoiceId: string;
  totalMinorUnits: number;
  advanceMinorUnits: number;
}

export function PaymentTracker({ invoiceId, totalMinorUnits, advanceMinorUnits }: PaymentTrackerProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [amountInput, setAmountInput] = useState('');
  const [modeInput, setModeInput] = useState('UPI');
  const [refInput, setRefInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [invoiceId]);

  const loadPayments = async () => {
    const res = await getPaymentsAction(invoiceId);
    setPayments(res || []);
  };

  const totalAdditional = payments.reduce((acc, p) => acc + p.amountMinorUnits, 0);
  const totalPaid = advanceMinorUnits + totalAdditional;
  const balance = Math.max(0, totalMinorUnits - totalPaid);
  const overpayment = totalPaid > totalMinorUnits ? totalPaid - totalMinorUnits : 0;

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amountInput) * 100;
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    
    setLoading(true);
    const res = await recordPaymentAction(invoiceId, {
      amountMinorUnits: Math.round(amt),
      paymentMode: modeInput,
      reference: refInput || undefined,
      notes: noteInput || undefined
    });

    if ((res as any).error) {
      setError((res as any).error);
    } else {
      setAmountInput('');
      setRefInput('');
      setNoteInput('');
      setShowForm(false);
      await loadPayments();
    }
    setLoading(false);
  };

  return (
    <div className="mt-8 border-t border-[#E8E1D6] pt-6 bg-white p-6 rounded shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-[#1D2422]">Payment Records (Slice 4B)</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-50 border rounded text-sm">
          <span className="text-gray-500 block">Invoice Total</span>
          <span className="font-semibold">₹{(totalMinorUnits / 100).toFixed(2)}</span>
        </div>
        <div className="p-3 bg-gray-50 border rounded text-sm">
          <span className="text-gray-500 block">Advance</span>
          <span className="font-semibold">₹{(advanceMinorUnits / 100).toFixed(2)}</span>
        </div>
        <div className="p-3 bg-gray-50 border rounded text-sm">
          <span className="text-gray-500 block">Total Paid</span>
          <span className="font-semibold text-green-700">₹{(totalPaid / 100).toFixed(2)}</span>
        </div>
        <div className="p-3 bg-gray-50 border rounded text-sm">
          <span className="text-gray-500 block">Remaining Balance</span>
          <span className="font-semibold text-red-600">₹{(balance / 100).toFixed(2)}</span>
        </div>
      </div>
      
      {overpayment > 0 && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
          <strong>Note:</strong> An overpayment of ₹{(overpayment / 100).toFixed(2)} has been recorded.
        </div>
      )}

      {error && <div className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="space-y-4">
        {payments.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2">Date</th>
                <th className="p-2">Mode</th>
                <th className="p-2">Reference</th>
                <th className="p-2">Notes</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{new Date(p.receivedAt).toLocaleDateString()}</td>
                  <td className="p-2">{p.paymentMode}</td>
                  <td className="p-2">{p.reference || '-'}</td>
                  <td className="p-2">{p.notes || '-'}</td>
                  <td className="p-2 text-right font-medium">₹{(p.amountMinorUnits / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">No additional payments recorded yet.</p>
        )}

        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            className="text-[#233B35] font-medium text-sm flex items-center gap-1 hover:underline mt-4"
          >
            <Plus size={16} /> Record New Payment
          </button>
        ) : (
          <form onSubmit={handleRecord} className="bg-gray-50 p-4 border rounded mt-4">
            <h4 className="font-medium mb-3 text-sm">New Payment Record</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1">Amount (₹) *</label>
                <input required type="number" step="0.01" min="0.01" value={amountInput} onChange={e => setAmountInput(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Payment Mode *</label>
                <select value={modeInput} onChange={e => setModeInput(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm bg-white">
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reference No.</label>
                <input type="text" value={refInput} onChange={e => setRefInput(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Notes</label>
                <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-[#233B35] text-white px-4 py-1.5 rounded text-sm flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />} Save Payment
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
