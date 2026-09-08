# Payment Pricing Phase 1 Report

## Objective
Implement server-authoritative, demand-based pricing directly within the reservation creation flow.

## Implementation Details

### Files Changed
1. **`src/db/schema.ts`**
   - Added `securityDepositMinorUnits: integer('security_deposit_minor_units')` to the `reservations` table to persist customized deposits at the reservation level.

2. **`src/app/admin/(protected)/calendar/actions.ts`**
   - Expanded `reservationSchema` to include explicit inputs: `accommodationRateMinorUnits`, `isNightlyRate`, `extraPersonQuantity`, `extraPersonRateMinorUnits`, `earlyCheckInMinorUnits`, `lateCheckOutMinorUnits`, `taxPercentage`, `securityDepositMinorUnits`, and `additionalServices`.
   - Updated `createReservation` to rigorously calculate the number of nights (`checkOutDate - checkInDate`).
   - The server now constructs the exact `lineItems` array based exclusively on these explicit values, applying taxes appropriately.
   - Refactored `issueInvoiceAction` to pull the `securityDepositMinorUnits` directly from the reservation instead of a client parameter.

3. **`src/app/admin/components/ReservationForm.tsx`**
   - Removed the generic dynamic line-item builder.
   - Introduced explicit fields mapping to the new schema: Rent (nightly or total), Extra Persons, Early Check-in, Late Check-out, Global Tax (GST), Security Deposit, and dynamic Additional Services.
   - The `liveSummary` preview safely mirrors the server's calculation mechanism to provide immediate visual feedback.

4. **`src/__tests__/test-invoice.ts`**
   - Added `security_deposit_minor_units` to the inline memory DB schema to ensure test consistency.
   - Added **Test 8: Demand-based pricing calculations** to verify accurate summation and tax application over constructed line items.

## Verification
- **Lint / Typecheck**: Passed successfully (`npx tsc --noEmit`).
- **Tests**: `npx tsx src/__tests__/test-invoice.ts` completed with all 8 tests passing.
- **Build**: `npm run build` executed successfully.

## Compliance Check
- **No Emojis**: Ensured the UI uses standard labels and no decorative Unicode symbols.
- **Server Authority**: The server strictly calculates all amounts in integer paise and drops any arbitrary totals provided by the client.
- **Legacy Files**: Confirmed that no legacy public-site files were modified.

## Remaining Blockers
- None for Phase 1. Ready to proceed to Phase 2 (Minimal Read-Only Guest Receipt) once approved.
