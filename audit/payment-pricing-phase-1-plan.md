# Payment Pricing Phase 1 Plan: Demand-Based Pricing in Calendar Form

## Objective
Enhance the reservation form to capture explicit, demand-based pricing inputs (rent, extra persons, early/late check-in/out, specific tax and deposit amounts). The server will take these explicit inputs, strictly recalculate all line items and totals, and store them securely, rejecting any client-side totals.

## Step 1: Schema Updates
- **`reservations` table**: Add `securityDepositMinorUnits` (integer) to store the customized refundable deposit for a specific draft reservation (defaulting to 500000 paise).
- **`reservationSchema` (Zod in `actions.ts`)**: Add explicit fields for:
  - `accommodationRateMinorUnits` (nightly rate or total rent)
  - `isNightlyRate` (boolean to decide whether to multiply by nights)
  - `extraPersonQuantity`
  - `extraPersonRateMinorUnits` (default 80000)
  - `earlyCheckInMinorUnits`
  - `lateCheckOutMinorUnits`
  - `taxPercentage` (or fixed tax amount)
  - `securityDepositMinorUnits` (default 500000)

## Step 2: Server-Side Logic (`calendar/actions.ts`)
- In `createReservation`, calculate the number of nights safely using date-fns.
- Construct the `lineItems` array entirely server-side using the base inputs:
  1. Accommodation line item (Nights × Rate or Fixed Total).
  2. Extra Person line item (Qty × Rate).
  3. Early Check-in line item.
  4. Late Check-out line item.
  5. Any client-provided "Additional Services".
- Calculate taxes based on the provided percentage/fixed amount and apply to line items.
- Ensure all calculations are done in integer paise.
- Insert the normalized `lineItems` into the database.

## Step 3: UI Adjustments (`ReservationForm.tsx`)
- Replace the current raw "Draft Line Items" editor with a structured pricing section:
  - **Rent / Accommodation**: Input for amount, toggle for "Per Night" vs "Total".
  - **Extra Persons**: Qty input, Rate input (prefilled 800).
  - **Early Check-in / Late Check-out**: Amount inputs.
  - **Taxes**: GST percentage input.
  - **Security Deposit**: Amount input (prefilled 5000).
  - **Additional Services**: Dynamic list for any extra ad-hoc items.
- Maintain the Live Summary panel, but compute it using the exact same logic the server will use (importing a shared helper if possible, or recalculating in the component).
- Keep UI mobile-responsive and emoji-free.

## Step 4: Tests
- Add tests in `test-invoice.ts` or a new `test-pricing.ts` to verify:
  - Night calculation (e.g., 2026-10-01 to 2026-10-03 is 2 nights).
  - Demand-based rent calculations (nightly vs total).
  - Extra-person charge totals.
  - Tax and deposit application.
  - Verification that client-tampered totals are ignored by the server action.

## Step 5: Verification & Build
- Run `npm run lint`, `npx tsc`, and `npm run build`.
- Create `audit/payment-pricing-phase-1-report.md` upon success.
