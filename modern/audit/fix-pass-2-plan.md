# Fix Pass 2 Plan

## Objective
Apply the verified browser fixes to address three remaining defects: 
1. `₹NaN` on legacy invoice rent lines.
2. Payment proof lifecycle validation and testing.
3. `/share/[token]` layout boundary isolation.

## A. Fix the Invoice `₹NaN` Defect
**Context**: The `₹NaN` bug remains for previously issued invoices (like `RES-710131`) because their immutable `snapshotJson` in the database does not contain the newly introduced `amountMinorUnits` field. 

**Plan**: 
1. **Source Mapping**: Modify the extraction logic wherever `snapshotJson` is parsed (in `ReservationDetailClient.tsx` and `api/invoice-pdf/[invoiceId]/route.ts`). If `amountMinorUnits` is missing on a line item, I will compute it as `quantity * rateMinorUnits` on the fly. This avoids rewriting historical records while ensuring `InvoicePreview` receives finite integer paise.
2. **Regression Test**: Add a test in `test-fix-pass.ts` that mocks a legacy snapshot JSON, passes it through the new mapping, and asserts that `amountMinorUnits` is present and formatted to `₹1,000.00`.

## B. Fix Payment-Proof Lifecycle State
**Context**: The upload logic in `actions.ts` already correctly hardcodes `status: 'pending_review'`. However, previous testing or logic outside of upload might have left a record marked `verified`.

**Plan**:
1. **Preserve History**: I will ensure existing `VERIFIED` records are kept as historical data. The admin UI already conditionally hides the "Review" button for `VERIFIED` proofs, which is correct.
2. **Test Fixtures**: I will add comprehensive unit tests in `src/__tests__/test-fix-pass.ts` that explicitly test the payment proof creation logic, asserting that:
   - Valid uploads always create `pending_review` status.
   - Uploads do not alter the invoice payment status or balance.
   - Uploads do not insert any manual payment record into `invoicePayments`.
   - Finalized/cancelled invoices reject uploads.

## C. Make Guest Receipt Minimal
**Context**: `/share/[token]/page.tsx` inherits the public marketing header and footer because `src/app/layout.tsx` wraps all children in `LayoutBoundary.tsx`.

**Plan**:
1. **Isolate Layout**: I will update `src/components/resort/LayoutBoundary.tsx`. It currently hides the header/footer for `pathname?.startsWith('/admin')`. I will add `|| pathname?.startsWith('/share')` to ensure the share receipt gets a clean, minimal shell.
2. **Verify Minimal View**: The guest receipt page already features the required text constraints, including the QR code, amounts, and specific disclaimer.

## D. Verification and Reporting
1. Run `npm run lint`, `npx tsc --noEmit`, `npm run test`, and `npm run build`.
2. Generate `audit/fix-pass-2-report.md` (ensuring it is under 3,000 characters).
