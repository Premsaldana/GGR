# Admin Slice 2 Implementation Plan: Reservation Creation & Calendar Conflict

This document outlines the technical implementation for Slice 2, which focuses on reservation creation and server-side calendar conflict handling.

## Proposed Changes

### Database Interactions
We will add functions to fetch units and active reservations, allowing the frontend calendar to accurately render occupied dates instead of using dummy data. We will also implement a server-side transaction to handle the atomic creation of guests, reservations, and draft line items.

### `src/app/admin/calendar/actions.ts` [NEW]
This new file will contain our authenticated server actions:
1. **`getUnits()`**: Fetches available units for the reservation form dropdown.
2. **`getReservations(monthStart, monthEnd)`**: Fetches existing reservations to accurately mark occupied dates on the calendar.
3. **`createReservation(data)`**: 
   - Validates the user session (ensures the user is fully logged in with TOTP).
   - Validates the payload using `zod`.
   - **Conflict Detection:** Queries the database for overlapping reservations on the selected unit (`checkInDate < newCheckOut` AND `checkOutDate > newCheckIn`).
   - If a conflict is detected, returns a specific `CONFLICT` error state.
   - Uses a Drizzle transaction to:
     - Insert or update the guest record (`guests`).
     - Insert the reservation (`reservations`).
     - Insert draft line items (`reservation_line_items`).
     - Record the creation in `audit_events`.

### `src/app/admin/components/ReservationForm.tsx` [NEW]
A new client component that replaces the placeholder drawer inside `CalendarView.tsx`.
- Implements a form using `react-hook-form` and `zod` for client-side validation.
- Fields: Guest Name, Phone, Email, Unit, Check-in, Check-out, Adults, Children, Booking Status, Payment Mode, Advance Amount, Advance Date, Notes, and a dynamic array of Draft Line Items.
- Manages loading states, displays validation errors, handles server conflict errors, and shows a success state.

### `src/app/admin/components/CalendarView.tsx` [MODIFY]
- Will be updated to fetch real reservations on load.
- Will pass the selected `checkInDate` to the newly extracted `ReservationForm` drawer.
- Will refresh its data upon a successful reservation creation to immediately show the newly occupied dates.

## Verification Plan

### Automated Checks
- `npm run build` to ensure type safety and successful static generation.
- ESLint checks to confirm code standards.

### Functional Verification
- Verify the calendar fetches and displays occupied dates correctly.
- Verify clicking an empty date opens the drawer with the check-in date prefilled.
- Submit a valid reservation and verify it appears in the database and audit logs.
- Attempt to submit a conflicting reservation (same unit, overlapping dates) and confirm the server firmly rejects it with a conflict error.
- Verify unauthorized requests are firmly rejected by the server action.

## User Review Required
> [!IMPORTANT]
> The TRD mentions "Draft line-item inputs may be stored, but billing totals must wait for Slice 3." The form will allow the admin to add arbitrary line items (e.g., "Room Rate", "Extra Bed") with a rate and quantity, but the backend will not calculate the final invoice totals yet.

> [!NOTE]
> Please review the above plan. If approved, I will proceed with the implementation, followed by the verification steps and the final report.
