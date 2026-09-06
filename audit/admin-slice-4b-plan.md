# Admin Slice 4B Implementation Plan

## Goal
Implement manual payment-status tracking and downloadable invoice PDF generation.

## Open Questions
- For the PDF generation, I plan to use `@react-pdf/renderer` or `jspdf` + `jspdf-autotable` on the client-side (using the server-provided snapshot data to ensure financial integrity). I will proceed with `@react-pdf/renderer` as it is generally more robust for React applications, unless there is a strong preference for another library.

## Proposed Changes

### Database Layer (Actions)
#### [NEW] `src/app/admin/(protected)/calendar/actions-payment.ts`
- `recordPaymentAction(invoiceId: string, payload: { amountMinorUnits: number, paymentMode: string, reference?: string, notes?: string })`:
  - Validates amount `> 0`.
  - Calculates total payments made against the invoice.
  - Inserts record into `invoicePayments`.
  - Updates `reservations.paymentStatus`. Logic: if total payments >= invoice balance, set to `'paid'`, else `'partially_paid'`.
  - Creates `auditEvent` for payment recording.
- `getPaymentsAction(invoiceId: string)`:
  - Retrieves all recorded payments for an invoice.

### UI Components
#### [NEW] `src/app/admin/components/PaymentTracker.tsx`
- Renders a list of recorded payments.
- Provides a secure form for authorized admins to record a new payment (Amount, Mode, Reference, Notes).
- Displays validation errors and loading states.
- Triggers `recordPaymentAction`.

#### [MODIFY] `src/app/admin/components/InvoicePreview.tsx`
- Import and render `PaymentTracker` for authorized admins.
- Replace "Download PDF (Coming Soon)" placeholder with a working "Download PDF" button that invokes the PDF generator.

### PDF Generation
#### [NEW] `src/lib/pdfGenerator.tsx`
- Utility function/component `generateInvoicePDF(invoice, snapshot, payments, qrArtifact)` using `@react-pdf/renderer`.
- Generates a PDF matching the approved Goa Garden Resort billing template.
- File naming convention: `GGR-{invoiceNumber}-{guestName}.pdf`.
- Explicitly uses the immutable `snapshotJson` data to build the PDF, ensuring client cannot manipulate the totals.

### Package Dependencies
- Install `@react-pdf/renderer`.

## Verification Plan
### Automated Tests
- Add `test-payment.ts` to test:
  - Server-side amount validation (rejects negative/zero amounts).
  - Status transition rules (`not_requested` -> `partially_paid` -> `paid`).
  - Unauthorized access prevention (`requireAdmin`).

### Manual Verification
- Test recording a partial payment and verify the reservation status updates to `partially_paid`.
- Test recording a full payment and verify status updates to `paid`.
- Download the PDF and manually inspect the layout, totals, and inclusion of the QR code/instructions.
- Verify PDF generation handles missing QR artifacts gracefully.
