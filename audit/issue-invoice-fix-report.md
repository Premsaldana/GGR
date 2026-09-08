# Issue Invoice Fix Report

## Issue Addressed
Browser QA found that after attempting to issue an invoice for a sample reservation, it remained in DRAFT state and the 'Issue Invoice' button was still visible. They suspected issues either with validation of zero line items or silent server failures.

## Root Cause Analysis
1. **Uncaught Auth Exceptions:** `issueInvoiceAction` in `actions.ts` called `requireAdmin()` outside its `try/catch` block. If `requireAdmin()` failed (or any other session initialization failed), Next.js automatically threw a generic 500 error to the client, effectively swallowing the exact cause of the failure and leaving the invoice in a draft state without a user-visible error message.
2. **Incorrect Client-Side Validation:** `ReservationDetailClient` restricted issuing an invoice if `lineItems.length === 0`. The business rules in `calculateInvoice` correctly support deposit-only invoices (i.e. zero line items, defaulting to the ₹5,000 security deposit). The UI's strict disabled check prevented users from generating valid deposit-only bills.

## Implementation Details
1. **Error Visibility & Sanitization:** 
   Moved the `requireAdmin()` session check inside the `try` block of `issueInvoiceAction`. The server action now safely catches all errors and logs a sanitized diagnostic message on the server, whilst returning a generic, safe validation error (`"Failed to issue invoice. Please verify your permissions and try again."`) to the UI, strictly preventing silent failures.
2. **Allowed Deposit-Only Invoices:** 
   Removed the arbitrary `lineItems.length === 0` check from the `disabled` prop in `ReservationDetailClient`. The system will now correctly compute the 5,000 INR refundable deposit baseline and issue the invoice via the server-authoritative snapshot.
3. **Tests Added:** 
   Added two new tests in `src/__tests__/test-invoice.ts`:
   - **Test 5:** Verifies that a zero-line-items input strictly evaluates to a valid 5,000 INR deposit-only total calculation.
   - **Test 6:** Verifies error visibility ensuring explicit thrown messages (`"Invalid negative values in line items"`) can be safely caught by the calling module.

## Verification
- `npm run lint` and `npx tsc --noEmit` pass with zero execution-blocking issues.
- `npx tsx src/__tests__/test-invoice.ts` executes successfully and all 6 tests pass.
- `npm run build` confirms the application correctly builds.
- QA can now freely issue a deposit-only invoice or gracefully see a server-sided error.
