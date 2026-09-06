# Slice 3 Implementation Plan

## Goal Description
Implement Slice 3: Server-authoritative billing calculations and the Goa Garden Resort invoice preview. This ensures all invoice arithmetic is computed accurately on the server to prevent manipulation, preserves a snapshot of the issued invoice, and visually matches the approved Figma design and template.

## Proposed Changes

### 1. Server-Authoritative Billing Rules (`src/lib/invoice.ts`)
Create a new module to handle financial arithmetic and formatting safely:
- Functions for summing `amountMinorUnits` of line items to yield `subtotal`.
- Application of GST/taxes to calculate `taxMinorUnits`.
- Separating the `refundableSecurityDeposit` (default Rs 5,000) from the main total but ensuring the final `totalMinorUnits` is clear.
- Calculating `balanceMinorUnits = totalMinorUnits - advanceMinorUnits` ensuring non-negative limits.
- Logic to convert INR values into Words (e.g., "Five Thousand Rupees Only").
- Strict integer handling for minor units (paise) to prevent floating-point anomalies.

### 2. Invoice Generation API (`src/app/admin/(protected)/calendar/actions.ts`)
Extend the current actions with protected API methods using `requireAdmin()`:
- `calculateInvoice(input)`: Validates payload and returns the calculated breakdown.
- `issueInvoice(input)`: Generates a unique invoice number (`GGR-YYYY-0001`), creates a snapshot in `snapshotJson`, sets status to `issued`, and commits to the `invoices` table. 
- Extend `createReservation` to optionally save the draft invoice automatically.
- Enforce that updates to an issued invoice trigger a new version rather than a silent overwrite.
- Emit audit events for invoice creation and issuance.

### 3. Invoice Preview Component (`src/app/admin/components/InvoicePreview.tsx`)
Create a new React component aligned with the `Goa_Garden_Resort_Billing_Template.docx` and Figma rules:
- **Resort Identity**: Header with Goa Garden Resort details, contact info, and "BOOKING INVOICE".
- **Reservation Details**: Dates, times (1:00 PM / 11:00 AM defaults), guest counts, property label.
- **Price Breakdown**: Table rendering dynamic line items (Accommodation, Extra Person Charge @ Rs 800 default, Early Check-In, Late Check-Out, Additional Services), Subtotal, Taxes, and Security Deposit.
- **Payment Summary**: Total Due, Mode, Advance Received, Balance Due, and Amount in Words.
- **Policies**: Standard resort policies matching the template (No cancellation, Pets prohibited, Pool rules, Kitchen rules, Extra guests).
- **Provisional Flags**: If the reservation is missing data (e.g., unit label missing), render it gracefully with placeholders/provisional warnings.
- **Placeholders**: Visual un-clickable placeholders for Future PDF download and QR generation.

### 4. Concurrency & Transaction Testing (`src/__tests__/test-invoice.ts`)
Write native server tests using `tsx`:
- Validate accurate calculation for night durations, extra guests, taxes, and deposit additions.
- Check zero, negative inputs, and large values for amount-in-words conversion.
- Test rollback and exact transactional insert of invoices.
- Check duplicate invoice version handling.

## User Review Required

> [!IMPORTANT]
> The public resort site, UPI QR artifact generation, PDF generation, and payment gateway integration are explicitly **excluded** in this slice and will only have disabled placeholders.

> [!WARNING]
> Since we use minor units (paise), all internal storage is `Amount * 100`. The UI will safely convert this to Rupees for the invoice preview. 

## Verification Plan

### Automated Tests
- Run `npm run test` targeting the new invoice calculation suite (`test-invoice.ts`).
- Run `npx tsc --noEmit` and `npm run lint` for type/formatting sanity.
- Check standard build with `npm run build`.

### Manual Verification
- Simulate creating a booking and inspecting the Invoice Preview rendering for alignment with the `.docx` text and Figma specs.
- Confirm `snapshotJson` correctly freezes the invoice upon issue. 
- Ensure that the `requireAdmin()` constraint prevents unauthorized generation.
