# Invoice Navigation Fix Report

## Issue Addressed
Browser QA found that the reservation-to-invoice flow was not discoverable:
- Calendar reservations opened the new reservation form instead of the detail view.
- Success state in the reservation form showed placeholder Slice 3 text.
- The Invoices sidebar link was disabled and did not navigate anywhere.

## Implementation Details

1. **Reservation Detail Route (`/admin/reservations/[id]`)**:
   - Created a new protected server page to load reservation details, guest info, line items, and the active invoice.
   - Built a `ReservationDetailClient` to manage the UI states (Details view vs. Preview Bill view) and handle the "Issue Invoice" action seamlessly.

2. **Calendar Integration**:
   - Updated `CalendarView.tsx` to wrap existing reservation blocks in an `<a>` tag linking directly to the new detail page (`/admin/reservations/[id]`), bypassing the drawer.
   - Updated `ReservationForm.tsx` to display action buttons ("View Reservation", "Create/View Bill", "Return to Calendar") upon successful reservation creation.
   - Removed the "Totals will be calculated in Slice 3" placeholder text in favor of "No draft line items added."

3. **Invoices List (`/admin/invoices`)**:
   - Created a new protected page at `/admin/invoices` showing a sortable table of all generated invoices.
   - Enabled the sidebar link in `layout.tsx` to point to this new list.
   - The table joins `invoices`, `reservations`, `guests`, and `units` to display relevant billing overviews, including the computed balances and payment statuses.

4. **Security & Data Integrity**:
   - Reused the server-authoritative `issueInvoiceAction` exactly as requested.
   - Preserved all MFA and authorization guards on the API and database levels.
   - Duplicate invoices are prevented; the UI clearly switches to "View Invoice" and prevents re-issuing once an invoice is finalized.
   - No public-site layout files were modified.

## Verification
- `npm run lint` and `npx tsc --noEmit` complete without execution-blocking errors.
- `npm run test` executes transaction logic correctly.
- `npm run build` completed successfully.
