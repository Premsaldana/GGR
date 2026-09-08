# Implementation Fix Pass Plan

## 1. Preserve one clear money-unit boundary
- **`src/app/admin/components/ReservationForm.tsx`**: Remove client-side multiplication (`* 100`). Send raw rupee values.
- **`src/app/admin/(protected)/calendar/actions.ts`**: 
  - Update `reservationSchema` to accept rupees (e.g. `accommodationRate`, `extraPersonRate`).
  - Introduce a shared deterministic helper `toPaise = (rupees: number) => Math.round(rupees * 100)` in `src/lib/invoice.ts`.
  - Perform the conversion *exactly once* during the server action `createReservation`.

## 2. Fix the invoice `₹NaN` rendering defect
- **`src/app/admin/(protected)/calendar/actions.ts`**: In `issueInvoiceAction`, the mapping from `lineItemsRows` drops `amountMinorUnits`. Add `amountMinorUnits: li.amountMinorUnits` to the mapped `lineItems` so it is stored in `snapshotJson.input.lineItems` and subsequently read by `InvoicePreview.tsx`.

## 3. Fix the payment-proof upload guard
- **`src/app/share/[token]/actions.ts`**: 
  - Correct the finalization check. Replace `reservation.paymentStatus === 'paid'` with `invoice.finalizedAt !== null`.
  - Add check to ensure `invoice.balanceMinorUnits > 0`.
  - Return neutral success response: `'Payment proof submitted for verification.'`.

## 4. Preserve and enforce the minimal guest receipt boundary
- **`src/app/share/[token]/page.tsx`**:
  - Remove any leaked admin notes or internal IDs.
  - Ensure the page remains purely read-only and uses exactly the snapshot's `guestName`.

## 5. Required tests
- Add automated tests covering money units, invoice rendering, payment proofs, and guest receipts as requested.
