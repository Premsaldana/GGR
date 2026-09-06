# Share Link Route Fix Report

## Issue Addressed
Browser QA reported that newly generated share links were throwing 500 internal server errors, causing the guest-facing route to crash despite being active in the admin UI.

## Root Cause Analysis
1. **Next.js 15+ Promises:** Similar to the previous bug in the reservation detail route, Next.js 15 requires dynamic route properties (`params.token`) to be `await`ed. The route was attempting to synchronously hash `params.token`, which triggers a hard runtime exception in the new app router, resulting in a 500 error instead of resolving the token.
2. **Missing Safe Try/Catch Wrap:** If any of the subsequent database relationships (invoice, reservation, unit) were missing, the route would throw uncaught exceptions instead of cleanly returning a `notFound()` state.
3. **Admin URL Retrieval:** The `QRPaymentFlow` UI copied the link to the clipboard and showed a toast for 3 seconds, but admins could easily miss or lose the clipboard reference, meaning they couldn't see the URL again without regenerating it.

## Implementation Details
1. **Awaited Params & Hashing:** Safely wrapped `params` extraction with an `await`, storing the token safely and maintaining the exact `sha256` hex digest used by the admin token generator.
2. **Sanitized Error Guardrails:** Wrapped the entire database lookup chain in a `try/catch` block. 
   - Missing or expired tokens now safely return a standard `notFound()` 404 response without leaking any sensitive guest, invoice, or system stack trace data.
   - Diagnosable warnings (`console.warn('Share page access denied: Token expired')`) are printed cleanly on the server backend without logging raw tokens or TOTP secrets.
3. **Safe Admin Fallback:** Enhanced `QRPaymentFlow.tsx` by displaying a "One-time viewing link" textbox below the generate button. This allows the admin to safely copy the URL directly from the page UI until they dismiss it, independent of the clipboard API.
4. **No Authentication Required:** Confirmed the `SharePage` cleanly retrieves only approved guest-facing data without enforcing `requireAdmin()`.
5. **Route Unit Tests:** Added simulated route tests in `src/__tests__/test-qr.ts` (Test 5, 6, 7) that strictly validate token lookup behavior against expired, valid, and unknown hashes, verifying the database logic holds.

## Verification
- `npm run lint` and `npx tsc --noEmit` pass with zero execution-blocking issues.
- `npx tsx src/__tests__/test-qr.ts` executes successfully and all 7 tests pass.
- `npm run build` completed cleanly for the `ƒ /share/[token]` route.
- The 404 handler strictly prevents exposure of other system properties.
