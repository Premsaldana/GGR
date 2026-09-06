# Unit Data Regression Report

## Issue Diagnosis
Browser QA reported that the unit selector in the Reservation Form suddenly showed "No units configured" after Phase 1 demand-based pricing changes.

## Investigation Steps
1. Validated the `units` table using `better-sqlite3` and verified that exactly 3 units were active and present in the `local.sqlite` database (`1 Bedroom Villa`, `4 Bedroom Villa`, and `5 Bedroom Private Pool Villa`). 
2. Confirmed that `getUnits()` server action queries the database correctly without overly strict filtering on `deletedAt` or `property`.
3. Traced the failure to `CalendarView.tsx` which invokes `getUnits()` and `getReservations()` concurrently using `Promise.all`. 
4. Identified the root cause: The `reservations` table schema was updated in Phase 1 to include `security_deposit_minor_units`, but the local SQLite database (`local.sqlite`) was not migrated. 
5. When `getReservations()` executed, Drizzle queried for `security_deposit_minor_units`, causing SQLite to throw a `SqliteError: no such column`. 
6. This exception rejected the `Promise.all`, preventing `CalendarView` from setting the fetched units into its state, which defaulted to an empty array and triggered the empty state in the UI.

## Resolution
- Executed an `ALTER TABLE reservations ADD COLUMN security_deposit_minor_units INTEGER;` statement directly on the development database (`local.sqlite`) to safely apply the Phase 1 schema changes.
- The active units query now successfully completes alongside `getReservations`, and the unit selector populates correctly.

## Compliance
- Did not modify legacy public-site files or begin Phase 2.
- Did not submit a reservation.
- Did not expose or hardcode secrets in the report.
- Kept the empty state fallback intact in the UI.
