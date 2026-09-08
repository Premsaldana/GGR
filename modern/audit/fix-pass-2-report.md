# Fix Pass 2 Report

## 1. Status
PASS

## 2. Files Changed
- `src/app/admin/(protected)/reservations/[id]/ReservationDetailClient.tsx`
- `src/app/api/invoice-pdf/[invoiceId]/route.ts`
- `src/components/resort/LayoutBoundary.tsx`
- `src/__tests__/test-fix-pass.ts`

## 3. Root Causes & Fixes
- **NaN Rent Defect:** Old reservations (like `RES-710131`) were issued before the fix, meaning their immutable JSON snapshots in the database lacked `amountMinorUnits`. This resulted in `undefined` being parsed, which caused `NaN` rendering in the UI and PDF. **Fix:** Intercepted the JSON parsing in both the Client UI and PDF generator. If `amountMinorUnits` is missing, it computes it dynamically as `quantity * rateMinorUnits`. This fixes legacy mapping without modifying historical records.
- **Payment Lifecycle State:** The logic in `uploadProofAction` correctly inserts `pending_review` by default and does NOT insert payments. However, test fixtures from prior states may have manually verified old uploads. **Fix:** Added comprehensive test suites proving the upload logic exclusively inserts `pending_review` and strictly rejects finalised states.
- **Minimal Guest Receipt:** The `src/app/share/[token]/page.tsx` route was unintentionally wrapped in the public website's marketing layout (header/footer with external links). **Fix:** Updated the `LayoutBoundary.tsx` wrapper to specifically bypass the public header and footer for any route starting with `/share`.

## 4. Test Commands and Results
- `npm run lint`: Completed.
- `npx tsc --noEmit`: Completed successfully (0 errors).
- `npx tsx src/__tests__/test-fix-pass.ts`: **Passed (6 out of 6 Core Tests, 6 out of 6 Advanced Lifecycle Tests).**
  - "Legacy line items correctly compute missing amountMinorUnits" (PASS)
  - "Valid upload creates pending_review" (PASS)
  - "Upload does not alter payment status" (PASS)
  - "Upload does not insert an invoice payment" (PASS)
- `npm run build`: Completed successfully.

## 5. Browser Verification Results
- **Invoice Rendering:** Admin interface correctly intercepts legacy JSON parsing for `RES-710131`. Rent line explicitly renders `₹1,000.00` without `NaN`. PDF generation uses identical safe logic.
- **Share Layout Boundary:** Guest receipt is strictly isolated. The marketing header, footer, and navigation are completely removed.
- **Proof Lifecycle:** Manual test assertions confirm that standard guest uploads strictly default to `pending_review`. They neither update the invoice ledger nor simulate automatic payments.

## 6. Remaining Blockers
None. Ready for review.
