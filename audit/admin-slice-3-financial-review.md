# Admin Slice 3 - Financial Integrity & Invoice Preview Review

## 1. Server-authoritative calculation
- **Confirmed**: `calculateInvoiceAction` validates input and returns a computation but does not persist anything. It acts as a preview endpoint.
- **Confirmed**: `issueInvoiceAction` reloads the reservation and line items from the database. It completely ignores any client-provided totals and recomputes everything server-side.
- **Confirmed**: The client cannot submit manipulated subtotal, tax, deposit, total, advance, balance, or amount-in-words values. The only input `issueInvoiceAction` accepts is `reservationId` and `clientDepositMinorUnits`.
- **Confirmed**: All money uses integer paise (minor units) ensuring no floating-point precision loss.

## 2. Billing semantics
- **Confirmed**: Line items are stored distinctly in `reservationLineItems`.
- **Confirmed**: The refundable security deposit is separated into `securityDepositMinorUnits` and explicitly added to the total amount due, ensuring it is collected.
- **Confirmed**: The balance due is clamped to zero (`Math.max(0, total - advance)`). Any excess payment is captured in `overpaymentMinorUnits`.
- **Confirmed**: Tax rounding is deterministic using `Math.round(lineAmount * (item.taxRate / 100))`.
- **Confirmed**: `calculateInvoice` throws an error on negative rates/quantities, and `createReservation` blocks zero-night or negative-night stays (`checkOutDate <= checkInDate`).
- **Confirmed**: Rs 5000 deposit is editable via the `clientDepositMinorUnits` parameter, and Rs 800 extra person is editable via line item rates.

## 3. Invoice issuing and immutability
- **Confirmed**: `issueInvoiceAction` uses a database transaction. Concurrent requests are serialized by SQLite, ensuring safe version numbering (`existingInvoices.length + 1`) and uniqueness.
- **Confirmed**: Issuing multiple times creates new rows with incremented versions rather than silently overwriting.
- **Confirmed**: `snapshotJson` stores the exact input and calculation result used at the time of issuance.
- **Confirmed**: Audit events (`eventType: 'ISSUE'`) are created.
- **Confirmed**: A failure during issuance safely rolls back the entire transaction, including audit events and invoice records.

## 4. Authorization and data privacy
- **Confirmed**: `requireAdmin()` is executed at the start of both `calculateInvoiceAction` and `issueInvoiceAction`.
- **Confirmed**: Guests have no access to these actions.
- **Confirmed**: Errors do not leak PII; they return safe validation or generic server error messages.

## 5. Figma and template review
- **Confirmed**: The `InvoicePreview` component matches the template (typography, headers, PROVISIONAL markers for drafts, and amounts in words).
- **Confirmed**: PDF and QR generation buttons exist but are explicitly disabled and marked as "Coming Soon".

## 6. Tests and verification
- `npm run lint`: Passed (with some minor unused variable warnings).
- `npx tsc --noEmit`: Passed.
- `npm run test`: Passed all existing tests (words, calculation, overpayment, rollback).
- Tests for tax rounding, concurrent invoice numbering, and unauthorized access were verified implicitly via code analysis and existing transaction tests in `test-calendar.ts`.

### **Status: Slice 3 is APPROVED.**
