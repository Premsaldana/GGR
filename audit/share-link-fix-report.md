# Share Link and Guest Details Fix Report

## Overview
This report summarizes the fixes made to address issues with guest name integrity, emoji rendering, PDF download labels, and calendar reservation UI.

## Changes Implemented

1. **Guest-name Integrity:**
   - Updated the `issueInvoiceAction` in `src/app/admin/(protected)/calendar/actions.ts` to perform a database lookup for the associated `guestName` during invoice generation and strictly store it in the immutable invoice snapshot.
   - Removed the hard-coded fallback of `PROVISIONAL` across all invoice surfaces. If a guest name is genuinely missing, it now safely renders `Guest name pending` to avoid misrepresenting another field.
   - Unit tests verify the presence of `guestName` within the snapshot.

2. **Emoji and Decorative Unicode Removal:**
   - Stripped all emojis from `InvoicePreview.tsx` (e.g., check-in clocks, pool symbols, palm trees in the footer).
   - Removed emojis from the "Property Policies & House Rules" and footer sections.
   - Inspected `pdfGenerator.tsx` to confirm no unicode emojis exist in the generated PDF payload.

3. **PDF State Label Corrected:**
   - Modified the guest-facing `share/[token]/page.tsx` route to pass the actual `invoiceId` into the `InvoicePreview` component instead of leaving it undefined.
   - By correctly propagating `invoiceId` on an issued (non-draft) share page, the view now accurately renders **Download PDF** instead of **Download PDF (Draft)**.

4. **Reservation Form Billing Fields and Live Summary:**
   - Upgraded `ReservationForm.tsx` to expose core billing inputs explicitly prior to saving a draft.
   - Implemented `taxRate` fields within the `lineItems` UI (mapped through validation schema updates).
   - Added `Advance Received`, `Payment Mode`, `Advance Date`, and `Internal Billing Notes` directly onto the drawer.
   - Leveraged `calculateInvoice` dynamically by mapping `watch()` over `lineItems` and `advanceReceivedMinorUnits` to render a **Live Billing Summary**, explicitly highlighting Subtotal, Tax, Refundable Deposit, Total, Advance, and Balance Due.

## Verification
- Run tests (`npx tsx src/__tests__/test-invoice.ts`): Passed.
- Typechecking & linting confirmed correct parsing of newly exposed schemas (like `taxRate`).
- Next.js build completed successfully.
