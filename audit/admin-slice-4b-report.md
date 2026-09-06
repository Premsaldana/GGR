# Admin Slice 4B Report

## Files Changed/Created
1. **`src/app/admin/(protected)/calendar/actions-payment.ts`**: [NEW] Implemented `recordPaymentAction` and `getPaymentsAction`. Both enforce `requireAdmin()` authorization. The action atomically recalculates payments based strictly on `invoice.advanceMinorUnits` plus newly recorded payments, preventing double-counting.
2. **`src/app/admin/components/PaymentTracker.tsx`**: [NEW] Built the Payment History and Record Payment UI. Uses the exact semantic model required: explicitly splitting `Advance` and `Total Paid` and resolving `Remaining Balance` down to zero, clearly handling `Overpayment` states. 
3. **`src/app/admin/components/InvoicePreview.tsx`**: [MODIFIED] Embedded `PaymentTracker` for non-draft invoices. Replaced the dummy PDF placeholder with a real download anchor (`href="/api/invoice-pdf/[invoiceId]"`).
4. **`src/lib/pdfGenerator.tsx`**: [NEW] Server-side PDF template built using `@react-pdf/renderer`. It generates a document structured exactly like the approved Goa Garden Resort billing template, using **only** the immutable server snapshot data (never trusting the client's calculations). It also strictly observes QR existence without altering the QR state.
5. **`src/app/api/invoice-pdf/[invoiceId]/route.ts`**: [NEW] A secure Next.js API route that retrieves the invoice, validates `requireAdmin()` authentication, fetches the snapshot, payments, and QR requests, then streams the `pdfGenerator` result to the browser with a sanitized filename (`GGR-{invoiceNumber}-{guestSlug}.pdf`).
6. **`src/__tests__/test-payment.ts`**: [NEW] Comprehensive test suite enforcing positive payments, idempotency, strict state transitions (`not_requested` -> `partially_paid` -> `paid`), and overpayment tracking.
7. **`package.json`**: [MODIFIED] Added `@react-pdf/renderer` dependency.

## Payment Semantics Enforced
- `invoiceTotalMinorUnits` is the unchangeable source of truth.
- `advanceMinorUnits` is loaded from the immutable invoice snapshot, preventing any double-counting or drift.
- Additional payments are individually tracked in `invoicePayments`.
- State transitions (`qr_generated`, `partially_paid`, `paid`) are re-evaluated securely on the server with every new payment. Generating a QR or downloading a PDF never mistakenly triggers a `paid` transition.
- Idempotency is preserved by checking the `reference` key on `invoicePayments`.

## PDF Immutability Enforced
- The PDF route exclusively fetches data from the SQLite database. Client-submitted UI state is utterly ignored.
- Re-issues/Revisions: Because it reads strictly from `invoice.snapshotJson` and `invoicePayments`, the generated PDF exactly represents the invoice as it was issued, plus whatever payments were authorized afterwards. If a reservation changes, the invoice snapshot does NOT change, preserving the historical integrity of the document.

## Test Results
**Linting**: Completed.
**Typechecking**: Completed cleanly.
**Production Build**: Completed successfully.
**Payment Unit Tests (`npx tsx src/__tests__/test-payment.ts`)**:
- ✅ **Test 1: Zero/Negative validation**: Correctly intercepts negative/zero amounts.
- ✅ **Test 2: Partial Payment**: Successfully computes totals and sets reservation status to `partially_paid`.
- ✅ **Test 3: Idempotency**: Effectively blocks duplicate submissions with the same reference ID.
- ✅ **Test 4: Full Payment**: Recognizes when total paid equals invoice total and escalates status to `paid`.
- ✅ **Test 5: Overpayment**: Handles excess payments, tracks the overflow, and safely resolves the status to `paid`.

## Implementation Exclusions
- Automatic bank verification and external payment gateways were **NOT** implemented.
- The `generateQRAction` logic from Slice 4A was left untouched and completely isolated from PDF generation.
- No Booking Engine or CMS logic was added.
