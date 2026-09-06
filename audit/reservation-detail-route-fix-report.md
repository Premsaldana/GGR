# Reservation Detail Route Fix Report

## Issue Addressed
Browser QA reported that clicking a reservation from the calendar linked to `/admin/reservations/[id]`, but rendered the public-site 404 marketing page instead of the protected reservation detail route. 

## Root Cause Analysis
1. **Next.js 15+ Dynamic Route Parameters**: 
   The Next.js app router treats dynamic params (e.g., `params.id`) as Promises in recent versions. The original `page.tsx` was accessing `params.id` synchronously, causing a runtime exception under the hood that was improperly swallowed or routed to the public 404 page due to the lack of an admin error boundary.
2. **Missing `not-found.tsx` in Admin Scope**: 
   When `!reservation` triggered `notFound()`, the router bubbled up to the nearest `not-found.tsx`. Since `/admin/(protected)` did not have one, it fell through to the public marketing site's 404 layout.
3. **Missing `requireAdmin()` call**:
   The page did not explicitly enforce the `requireAdmin()` check (although the layout partially handled session verification), which could cause unauthorized rendering or confusing edge cases when MFA isn't complete.
4. **Calendar Navigation using `<a href>`**:
   `CalendarView.tsx` utilized a standard anchor tag instead of Next's `<Link>`, breaking client-side navigation inside the dashboard.

## Implementation Details
1. **Route Exists**: Verified that `src/app/admin/(protected)/reservations/[id]/page.tsx` is built as the `/admin/reservations/[id]` route.
2. **Fixed `params` Type**: Converted the dynamic parameter handling in `page.tsx` to correctly await the ID (`const reservationId = (await params).id`), conforming to Next.js strict promise-based dynamic routing requirements.
3. **Client-side Navigation**: Updated `CalendarView.tsx` to wrap occupied date blocks in `<Link>` components, enabling smooth SPA navigation without full page reloads.
4. **Admin Error Boundary**: Added `src/app/admin/(protected)/not-found.tsx` to elegantly catch missing reservations without leaking users to the public marketing pages.
5. **Enforced Security**: Added `await requireAdmin()` at the top of the `page.tsx` to ensure all MFA and administrative permission checks fire before attempting to query the database.

## Verification
- `npm run lint` and `npx tsc --noEmit` pass with zero execution-blocking issues.
- `npm run test` executes successfully.
- `npm run build` confirms the dynamic route `ƒ /admin/reservations/[id]` is correctly compiled without warnings.
- The `View` and `Create/Preview Bill` buttons render properly on the loaded detail page. No public routes or guest files were altered.
