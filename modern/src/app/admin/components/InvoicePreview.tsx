'use client';

import React from 'react';
import { InvoiceCalculationResult } from '@/lib/invoice';
import { QRPaymentFlow } from './QRPaymentFlow';
import { PaymentTracker } from './PaymentTracker';
import { Calendar, Users, MapPin, CreditCard, AlertCircle } from 'lucide-react';

interface InvoicePreviewProps {
  invoiceId?: string;
  reservation: {
    reservationNumber?: string;
    guestName?: string;
    unitDisplayName?: string;
    bookingStatus?: string;
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    children?: number;
    paymentMode?: string;
    advanceReceivedMinorUnits?: number;
    advanceReceivedAt?: string;
  };
  calculation: InvoiceCalculationResult;
  lineItems: { description: string; quantity: number; rateMinorUnits: number; amountMinorUnits: number }[];
  isDraft?: boolean;
}

const formatCurrency = (minorUnits: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
};

export function InvoicePreview({ invoiceId, reservation, calculation, lineItems, isDraft = true }: InvoicePreviewProps) {
  return (
    <div className="max-w-5xl mx-auto bg-white p-8 md:p-14 text-[#1D2422] font-sans border border-[#E8E1D6] shadow-lg rounded-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E8E1D6] pb-8 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-[#233B35] tracking-tight">GOA GARDEN RESORT</h1>
          <p className="text-[#718779] text-sm uppercase tracking-widest font-medium">Private Pool Villa</p>
          <div className="mt-4 pt-4 text-sm text-[#55675D] space-y-1">
            <p>Besides Colva Police Station,</p>
            <p>Colva–Benaulim Road, Salcete, South Goa – 403708</p>
            <p className="pt-2 flex items-center gap-4">
              <span>91-7813093075</span>
              <span className="text-[#E8E1D6]">|</span>
              <span>goagardenresort@gmail.com</span>
            </p>
          </div>
        </div>
        <div className="mt-8 md:mt-0 md:text-right">
          <h2 className="text-2xl font-semibold tracking-widest text-[#B75E3C] uppercase">
            Booking Voucher {isDraft && <span className="text-sm align-middle bg-gray-100 text-gray-500 px-2 py-1 rounded ml-2 tracking-normal">(DRAFT)</span>}
          </h2>
          <div className="mt-6 p-4 bg-[#FFFCF6] border border-[#E8E1D6] rounded text-sm inline-block text-left md:text-right">
            <p className="flex justify-between gap-8"><span className="text-[#718779]">Reservation #</span> <span className="font-semibold">{reservation.reservationNumber || 'Pending'}</span></p>
            <p className="flex justify-between gap-8 mt-2"><span className="text-[#718779]">Date of Issue</span> <span className="font-semibold">{isDraft ? 'Not Issued' : new Date().toLocaleDateString('en-IN')}</span></p>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-10 max-w-3xl">
        <p className="text-lg font-serif text-[#233B35]">Dear {reservation.guestName || <span className="text-red-500 italic">Guest name pending</span>},</p>
        <p className="mt-3 text-[#55675D] leading-relaxed">
          Thank you for choosing Goa Garden Resort. We are delighted to confirm your booking. Please review your stay details and voucher summary below. We look forward to welcoming you to our private pool villa in South Goa.
        </p>
      </div>

      {/* Reservation Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-5 border border-[#E8E1D6] bg-[#FFFCF6] rounded-sm flex flex-col">
          <MapPin className="text-[#B75E3C] mb-3" size={20} />
          <span className="text-xs text-[#718779] uppercase font-semibold tracking-wider">Property</span>
          <span className="mt-1 font-medium text-base">{reservation.unitDisplayName || 'Pending'}</span>
        </div>
        
        <div className="p-5 border border-[#E8E1D6] bg-[#FFFCF6] rounded-sm flex flex-col">
          <Calendar className="text-[#B75E3C] mb-3" size={20} />
          <span className="text-xs text-[#718779] uppercase font-semibold tracking-wider">Check-in</span>
          <span className="mt-1 font-medium text-base">{reservation.checkInDate || 'Pending'} <span className="text-sm font-normal text-[#718779]">at 1:00 PM</span></span>
        </div>

        <div className="p-5 border border-[#E8E1D6] bg-[#FFFCF6] rounded-sm flex flex-col">
          <Calendar className="text-[#B75E3C] mb-3" size={20} />
          <span className="text-xs text-[#718779] uppercase font-semibold tracking-wider">Check-out</span>
          <span className="mt-1 font-medium text-base">{reservation.checkOutDate || 'Pending'} <span className="text-sm font-normal text-[#718779]">at 11:00 AM</span></span>
        </div>

        <div className="p-5 border border-[#E8E1D6] bg-[#FFFCF6] rounded-sm flex flex-col">
          <Users className="text-[#B75E3C] mb-3" size={20} />
          <span className="text-xs text-[#718779] uppercase font-semibold tracking-wider">Guests</span>
          <span className="mt-1 font-medium text-base">{reservation.adults ?? '-'} Adults, {reservation.children ?? '-'} Children</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mb-12">
        <h3 className="text-[#233B35] font-serif text-xl border-b-2 border-[#233B35] pb-2 mb-6 inline-block">Price Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#E8E1D6] text-xs uppercase tracking-wider text-[#718779]">
                <th className="py-4 font-semibold w-1/2">Description</th>
                <th className="py-4 font-semibold text-center">Qty / Nights</th>
                <th className="py-4 font-semibold text-right">Rate (INR)</th>
                <th className="py-4 font-semibold text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-[#E8E1D6] last:border-none">
                  <td className="py-4 text-[#1D2422]">{item.description}</td>
                  <td className="py-4 text-center text-[#55675D]">{item.quantity}</td>
                  <td className="py-4 text-right text-[#55675D]">{formatCurrency(item.rateMinorUnits)}</td>
                  <td className="py-4 text-right font-medium text-[#1D2422]">{formatCurrency(item.amountMinorUnits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex flex-col items-end">
          <div className="w-full md:w-[350px] space-y-3 bg-[#FFFCF6] p-6 border border-[#E8E1D6] rounded-sm">
            <div className="flex justify-between text-sm text-[#55675D]">
              <span>Subtotal</span>
              <span>{formatCurrency(calculation.subtotalMinorUnits)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#55675D]">
              <span>GST / Applicable Taxes</span>
              <span>{formatCurrency(calculation.taxMinorUnits)}</span>
            </div>
            <div className="flex justify-between py-3 mt-3 border-t border-[#E8E1D6] font-bold text-lg text-[#233B35]">
              <span>TOTAL</span>
              <span>{formatCurrency(calculation.totalMinorUnits)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-12 bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-sm text-center">
        <span className="text-[#166534] font-bold text-sm tracking-widest uppercase">
          Payment Completed
        </span>
      </div>

      {/* Placeholders for Future PDF */}
      <div className="mb-10 flex flex-wrap gap-4 select-none">
        {invoiceId && !isDraft ? (
          <a 
            href={`/api/invoice-pdf/${invoiceId}`} 
            download 
            className="admin-button admin-button--dark inline-flex items-center gap-2 px-6 py-3 rounded-sm transition hover:bg-[#1a2c27] shadow-sm font-medium"
          >
            Download PDF Voucher
          </a>
        ) : (
          <button disabled className="bg-gray-100 border border-gray-200 text-gray-400 px-6 py-3 rounded-sm cursor-not-allowed font-medium inline-flex items-center gap-2">
            Download PDF (Draft)
          </button>
        )}
      </div>

      {!isDraft && invoiceId && (
        <div className="mb-12 space-y-8">
          <PaymentTracker
            invoiceId={invoiceId}
            totalMinorUnits={calculation.totalMinorUnits}
          />
          <QRPaymentFlow 
            invoiceId={invoiceId} 
            totalMinorUnits={calculation.totalMinorUnits}
            balanceMinorUnits={calculation.balanceMinorUnits}
            securityDepositMinorUnits={calculation.securityDepositMinorUnits}
          />
        </div>
      )}

      {/* Property Policies */}
      <div className="bg-[#FFFCF6] border border-[#E8E1D6] p-6 md:p-8 rounded-sm">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="text-[#B75E3C]" size={20} />
          <h3 className="font-serif text-xl text-[#233B35]">Property Policies & House Rules</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-[#55675D]">
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Cancellation:</strong> No cancellation and no refund once booking is confirmed.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Timings:</strong> Check-In at 1:00 PM. Check-Out at 11:00 AM. Early/late checkout subject to availability & extra charges.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Pets:</strong> Strictly not allowed on the property.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Security Deposit:</strong> Refundable deposit of Rs 5,000 payable at check-in.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Swimming Pool:</strong> Hours are 8:00 AM to 8:00 PM. No music after 10:00 PM. Children must be supervised.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Kitchen / Cooking:</strong> No kitchen available. Cooking inside the villa is not permitted.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Breakfast:</strong> Breakfast is not complimentary and not included.</div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#B75E3C]">•</span>
            <div><strong>Extra Guests:</strong> Extra person charge: Rs 800 per head per night.</div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#E8E1D6] text-center text-[#718779]">
        <p className="font-serif text-lg text-[#233B35] mb-2">Thank you for choosing us!</p>
        <p className="text-sm">For any queries, please reach out to us at 91-7813093075 or goagardenresort@gmail.com.</p>
      </div>
    </div>
  );
}
