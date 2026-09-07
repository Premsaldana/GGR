# Validation Logic Matrix

This document maps out the forms across the application and their corresponding frontend (HTML5) and backend (Zod) validation logic to ensure both robust UX and strict system constraints.

## 1. Login Form (`/admin/login`)
- **Frontend**: Standard HTML5 validation (`type="email"`, `required`, `maxLength={6}` for OTP).
- **Backend**: Uses Zod parsing (`adminLoginSchema`) in `actions.ts`. Currently `sendOtp` action.

## 2. Reservation Creation (`/admin/calendar`)
- **Frontend**: The `ReservationForm.tsx` leverages React Hook Form and basic HTML5 properties (`required`, `min="0"`, `type="number"`).
- **Backend**: Validated thoroughly by `reservationFormSchema` (which strictly enforces non-negative paise/rupees and date constraints) in `createReservation`.

## 3. QR Generation (`/admin/calendar`)
- **Frontend**: `QRPaymentFlow.tsx` has a `<form>` wrap for the `amountInput` with `required`, `min="0"`, and `type="number"`.
- **Backend**: Uses `qrGenerationSchema` in `generateQRAction`.

## 4. Payment Proof Upload (`/share/[token]`)
- **Frontend**: The `PaymentUploadForm.tsx` enforces `required` and `accept` for PDF/JPG/PNG natively.
- **Backend**: `uploadProofAction` uses `uploadProofSchema` (Zod) + magic byte analysis and file size enforcement.

## 5. Admin Proof Review (`/admin/reservations/[id]`)
- **Frontend**: `ReservationDetailClient.tsx` uses native `<form>` with HTML5 required inputs and dropdown constraints for `verifyAmountMinorUnits` and `paymentMode`.
- **Backend**: Protected by `adminReviewProofSchema` and `rejectProofSchema` ensuring UUID valid proof IDs and proper minor unit conversions in `verifyProofAction` and `rejectProofAction`.
