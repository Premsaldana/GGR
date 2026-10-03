'use server';

import { z } from 'zod';
import { createReservation, issueInvoiceAction } from '../calendar/actions';
import { recordPaymentAction } from '../calendar/actions-payment';

const walkInReceiptSchema = z.object({
  guestName: z.string().trim().min(2, 'Guest name is required'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  unitId: z.string().min(1, 'Room type is required'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid check-in date'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid check-out date'),
  adults: z.coerce.number().int().min(1, 'At least one adult is required'),
  children: z.coerce.number().int().min(0),
  accommodationRate: z.coerce.number().min(0, 'Room rate cannot be negative'),
  securityDeposit: z.coerce.number().min(0, 'Security deposit cannot be negative').default(5000),
  amountPaid: z.coerce.number().positive('Payment received must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  paymentReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
}).refine((data) => data.checkOutDate > data.checkInDate, {
  message: 'Check-out must be after check-in',
  path: ['checkOutDate'],
});

export type WalkInReceiptInput = z.input<typeof walkInReceiptSchema>;

export async function createWalkInReceiptAction(input: WalkInReceiptInput) {
  const parsed = walkInReceiptSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Please correct the highlighted walk-in details.', type: 'VALIDATION', details: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    const reservation = await createReservation({
      unitId: data.unitId,
      guestName: data.guestName,
      phone: data.phone || undefined,
      email: data.email || undefined,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      adults: data.adults,
      children: data.children,
      bookingStatus: 'confirmed',
      paymentMode: data.paymentMode,
      notes: data.notes || 'Walk-in booking',
      accommodationRate: data.accommodationRate,
      isNightlyRate: true,
      extraPersonQuantity: 0,
      extraPersonRate: 800,
      earlyCheckIn: 0,
      lateCheckOut: 0,
      securityDeposit: data.securityDeposit,
      additionalServices: [],
    });
    if (!('reservationId' in reservation) || !reservation.reservationId) {
      return reservation;
    }

    const issued = await issueInvoiceAction(reservation.reservationId, data.securityDeposit * 100);
    if (!('invoiceId' in issued) || !issued.invoiceId) {
      return { error: issued.error || 'Reservation created, but the receipt could not be issued.', type: issued.type || 'INVOICE_ERROR', reservationId: reservation.reservationId };
    }

    const payment = await recordPaymentAction(issued.invoiceId, {
      amountMinorUnits: Math.round(data.amountPaid * 100),
      paymentMode: data.paymentMode,
      reference: data.paymentReference || undefined,
      notes: data.notes || 'Walk-in payment',
    });
    if ('error' in payment && payment.error) {
      return { error: payment.error, type: 'PAYMENT_ERROR', reservationId: reservation.reservationId, invoiceId: issued.invoiceId };
    }

    return {
      success: true,
      reservationId: reservation.reservationId,
      reservationNumber: reservation.reservationNumber,
      invoiceId: issued.invoiceId,
      paymentId: 'paymentId' in payment ? payment.paymentId : undefined,
    };
  } catch (error: unknown) {
    console.error('Walk-in receipt creation failed:', error);
    return { error: error instanceof Error ? error.message : 'Unable to create the walk-in receipt.', type: 'SERVER_ERROR' };
  }
}
