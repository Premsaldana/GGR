'use client';

import React from 'react';
import { InvoiceCalculationResult } from '@/lib/invoice';
import { QRPaymentFlow } from './QRPaymentFlow';
import { PaymentTracker } from './PaymentTracker';

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
    <div className="max-w-4xl mx-auto bg-[#FFFCF6] p-8 md:p-12 text-[#1D2422] font-sans border border-[#E8E1D6] shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#E8E1D6] pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-serif text-[#233B35]">GOA GARDEN RESORT</h1>
          <p className="text-sm mt-2">5 Bedroom Private Pool Villa • Colva, South Goa</p>
          <p className="text-sm">Besides Colva Police Station, Colva–Benaulim Road,</p>
          <p className="text-sm">Salcete, South Goa – 403708</p>
          <div className="mt-4 text-sm space-y-1">
            <p>Phone: 91-7813093075</p>
            <p>Email: goagardenresort@gmail.com</p>
            <p>Website: www.goagardenresort.com</p>
          </div>
        </div>
        <div className="text-right mt-6 md:mt-0">
          <h2 className="text-2xl font-bold tracking-widest text-[#B75E3C]">BOOKING INVOICE {isDraft && '(DRAFT)'}</h2>
          <div className="mt-4 text-sm space-y-2">
            <p><span className="font-semibold">Reservation #:</span> {reservation.reservationNumber || <span className="text-red-500 italic">Pending</span>}</p>
            <p><span className="font-semibold">Date of Issue:</span> {isDraft ? <span className="italic">Not Issued</span> : new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-8">
        <p>Dear {reservation.guestName || <span className="text-red-500 italic">Guest name pending</span>},</p>
        <p className="mt-2 text-sm leading-relaxed">
          Thank you for choosing Goa Garden Resort. We look forward to welcoming you and ensuring an unforgettable stay at our private pool villa in Colva, South Goa. Please find your booking details and invoice summary below.
        </p>
      </div>

      {/* Reservation Details */}
      <div className="mb-8">
        <h3 className="bg-[#233B35] text-[#FFFCF6] py-2 px-4 font-semibold tracking-wider text-sm mb-4">RESERVATION DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm px-4">
          <p><span className="font-semibold">PROPERTY:</span> {reservation.unitDisplayName || <span className="text-red-500 italic">Pending</span>}</p>
          <p><span className="font-semibold">BOOKING STATUS:</span> {reservation.bookingStatus ? reservation.bookingStatus.toUpperCase() : <span className="text-red-500 italic">Pending</span>}</p>
          <p><span className="font-semibold">CHECK-IN:</span> {reservation.checkInDate || <span className="text-red-500 italic">Pending</span>} at 1:00 PM</p>
          <p><span className="font-semibold">CHECK-OUT:</span> {reservation.checkOutDate || <span className="text-red-500 italic">Pending</span>} at 11:00 AM</p>
          <p><span className="font-semibold">NO. OF GUESTS:</span> Adults: {reservation.adults ?? '-'} | Children: {reservation.children ?? '-'}</p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mb-8">
        <h3 className="bg-[#233B35] text-[#FFFCF6] py-2 px-4 font-semibold tracking-wider text-sm mb-4">PRICE BREAKDOWN</h3>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E1D6]">
              <th className="py-2 font-semibold">DESCRIPTION</th>
              <th className="py-2 font-semibold text-right">QTY / NIGHTS</th>
              <th className="py-2 font-semibold text-right">RATE (INR)</th>
              <th className="py-2 font-semibold text-right">AMOUNT (INR)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} className="border-b border-[#E8E1D6]">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.rateMinorUnits)}</td>
                <td className="py-2 text-right">{formatCurrency(item.amountMinorUnits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 w-full flex justify-end">
          <div className="w-full md:w-1/2 space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-[#E8E1D6]">
              <span>Subtotal</span>
              <span>{formatCurrency(calculation.subtotalMinorUnits)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E1D6]">
              <span>GST / Applicable Taxes</span>
              <span>{formatCurrency(calculation.taxMinorUnits)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E1D6]">
              <span>Refundable Security Deposit</span>
              <span>{formatCurrency(calculation.securityDepositMinorUnits)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg text-[#B88A3B]">
              <span>TOTAL AMOUNT DUE</span>
              <span>{formatCurrency(calculation.totalMinorUnits)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-8">
        <h3 className="bg-[#233B35] text-[#FFFCF6] py-2 px-4 font-semibold tracking-wider text-sm mb-4">PAYMENT SUMMARY</h3>
        <div className="px-4 text-sm space-y-3">
          <div className="flex justify-between border-b border-dashed border-[#E8E1D6] pb-2">
            <span>Total Invoice Amount</span>
            <span className="font-semibold">{formatCurrency(calculation.totalMinorUnits)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-[#E8E1D6] pb-2">
            <span>Payment Mode</span>
            <span className="font-semibold">{reservation.paymentMode || <span className="text-red-500 italic">PROVISIONAL</span>}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-[#E8E1D6] pb-2">
            <span>Advance Payment Received</span>
            <span className="font-semibold">{formatCurrency(calculation.advanceMinorUnits)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-[#E8E1D6] pb-2 text-[#B75E3C] font-bold text-lg">
            <span>BALANCE DUE ON CHECK-IN</span>
            <span>{formatCurrency(calculation.balanceMinorUnits)}</span>
          </div>
          {calculation.overpaymentMinorUnits > 0 && (
            <div className="flex justify-between border-b border-dashed border-[#E8E1D6] pb-2 text-green-700 font-bold text-lg">
              <span>EXCESS / REFUND DUE</span>
              <span>{formatCurrency(calculation.overpaymentMinorUnits)}</span>
            </div>
          )}
          <div className="mt-4 pt-2 bg-[#F5F1E9] p-4 text-center rounded border border-[#E8E1D6]">
            <span className="font-semibold block mb-1">Amount in Words:</span>
            <span className="italic text-[#233B35]">{calculation.amountInWords}</span>
          </div>
        </div>
      </div>

      {/* Placeholders for Future PDF */}
      <div className="mb-8 flex space-x-4 select-none">
        {invoiceId && !isDraft ? (
          <a 
            href={`/api/invoice-pdf/${invoiceId}`} 
            download 
            className="bg-[#233B35] text-white px-4 py-2 rounded hover:bg-opacity-90 inline-block"
          >
            Download PDF
          </a>
        ) : (
          <button disabled className="bg-gray-300 text-gray-700 px-4 py-2 cursor-not-allowed">Download PDF (Draft)</button>
        )}
      </div>

      {!isDraft && invoiceId && (
        <>
          <PaymentTracker
            invoiceId={invoiceId}
            totalMinorUnits={calculation.totalMinorUnits}
            advanceMinorUnits={calculation.advanceMinorUnits}
          />
          <QRPaymentFlow 
            invoiceId={invoiceId} 
            totalMinorUnits={calculation.totalMinorUnits}
            advanceMinorUnits={calculation.advanceMinorUnits}
            balanceMinorUnits={calculation.balanceMinorUnits}
            securityDepositMinorUnits={calculation.securityDepositMinorUnits}
          />
        </>
      )}

      {/* Property Policies */}
      <div className="mb-8 text-xs text-[#718779] border-t border-[#E8E1D6] pt-6">
        <h3 className="font-semibold text-sm mb-3 text-[#1D2422]">PROPERTY POLICIES & HOUSE RULES</h3>
        <ul className="space-y-2">
          <li><strong>Cancellation Policy:</strong> No cancellation and no refund once booking is confirmed.</li>
          <li><strong>Check-In / Check-Out:</strong> Check-In: 1:00 PM | Check-Out: 11:00 AM. Early/late checkout subject to availability & extra charges.</li>
          <li><strong>Pets:</strong> Pets are strictly not allowed on the property.</li>
          <li><strong>Security Deposit:</strong> Refundable deposit of Rs 5,000 payable at check-in.</li>
          <li><strong>Swimming Pool:</strong> Pool hours: 8:00 AM to 8:00 PM. No music after 10:00 PM. Children must be supervised.</li>
          <li><strong>Kitchen / Cooking:</strong> No kitchen available. Cooking inside the villa is not permitted.</li>
          <li><strong>Breakfast:</strong> Breakfast is not complimentary and not included.</li>
          <li><strong>Extra Guests:</strong> Extra person charge: Rs 800 per head per night.</li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="mt-12 flex justify-between text-sm pt-8 border-t border-[#E8E1D6]">
        <div className="w-1/2">
          <div className="border-t border-[#1D2422] w-48 mb-2"></div>
          <p>Authorized Signature</p>
          <p className="font-semibold">Goa Garden Resort</p>
        </div>
        <div className="w-1/2 text-right flex flex-col items-end">
          <div className="border-t border-[#1D2422] w-48 mb-2"></div>
          <p>Guest Signature & Date</p>
          <p className="font-semibold">{reservation.guestName || '_________________'}</p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[#718779]">
        <p>Queries? Call 91-7813093075 or goagardenresort@gmail.com</p>
        <p className="mt-1">Thank you for choosing us!</p>
      </div>
    </div>
  );
}
