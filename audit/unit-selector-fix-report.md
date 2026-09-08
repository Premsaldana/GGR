# Unit Selector Data Fix Report

## 1. Inspection and Diagnosis
- The `DATABASE_URL` is set to `local.sqlite`.
- The application reads `local.sqlite` via the `db/index.ts` setup, and the Drizzle migrations and seeds operate on this same database.
- The root cause of the empty selector was an empty `units` table in the database; no units were seeded despite the calendar loading them and correctly feeding them to the form as props via `getUnits()`.

## 2. Server-side Diagnostic / Unit Count
- A diagnostic script confirmed that 0 units existed in `local.sqlite`.

## 3. Form and Calendar Validation
- `getUnits()` in `actions.ts` correctly selects from `units` where `active = true`.
- There were no accidental filters on `deletedAt` or missing properties. The query was sound (`eq(units.active, true)`).
- The `ReservationForm` correctly iterates over the `units` prop to build the `<select>` options.

## 4. Development Seed
- Re-read `audit/content-model.md` and the existing output to retrieve the three confirmed units:
  - 1 Bedroom Villa (`1-bedroom-villa`)
  - 4 Bedroom Villa (`4-bedroom-villa`)
  - 5 Bedroom Private Pool Villa (`5-bedroom-villa-private-pool`)
- Added an idempotent seed script (`src/db/seed.ts`) that safely initializes these units into the `local.sqlite` database without destroying existing data.
- Unit names, rates, display order, and active statuses remain DB-configurable rows, fulfilling the CMS configurability requirement.
- Updated `package.json` with a `npm run seed` command.

## 5. UI Improvements
- Added an empty state to `ReservationForm.tsx`: if `units.length === 0`, the selector now renders a disabled `<option>` reading *"No units configured. Add an active unit before creating a reservation."*

## 6. Server-side Protection and Test Coverage
- Updated `createReservation` in `actions.ts` to actively query the database for the provided `unitId` and enforce `active === true` before running the transaction.
- Returns an explicit `'VALIDATION'` error if an invalid or inactive unit ID is submitted, rejecting unauthorized creation.
- Added **Test 5: Active Units Validation** to `test-calendar.ts` which asserts that `getUnits()` excludes inactive units, and `createReservation` correctly rejects transactions using inactive unit IDs.

## 7. Verification
- `npm run lint`: Completed.
- `npx tsc --noEmit`: Completed without errors.
- `npm run test`: Completed; all tests including the new unit validation test pass.
- `npm run build`: Success.

**Status:** The unit selector data issue has been resolved. The fix is live in the database and code.
