# Next Phase Plan: Verified Invoice, Full Validation, and Admin Navigation

## 1. Verified Guest Invoice Download
**Goal**: Allow guests to securely download the final invoice from their share link once an admin verifies their payment.

**Implementation Steps**:
- **API Endpoint**: Create `src/app/api/share/[token]/download/route.ts`. It will hash the incoming token, find the `shareLink`, verify expiration, fetch the invoice, and confirm it is either finalized (`finalizedAt !== null`) OR fully paid (balance <= 0) OR has a `verified` payment proof. It will return the PDF via `generateInvoicePDFStream`.
- **UI Update**: Modify `src/app/share/[token]/page.tsx` to compute `isVerified`. 
  - If `isVerified` is true, hide the QR code and payment upload form. Replace it with a green "Payment Verified" banner and a "Download Invoice" button pointing to the new route.
  - If false, continue showing the QR code and pending/upload forms.
- **Tests**: Add logic to `test-fix-pass.ts` (or a new test file) simulating the download route restrictions and UI state for verified vs pending states.

## 2. Frontend and Backend Validation
**Goal**: Add robust, consistent validation for all forms and actions in the system.

**Implementation Steps**:
- **Validation Matrix**: Create `audit/next-phase-validation.md` covering all application forms (OTP login, TOTP, reservation form, share link creation, payment uploads, admin proof verification, final closure).
- **Zod Schemas**: Introduce a centralized `src/lib/validations.ts` using `zod` to define strict schemas (e.g., negative money checks, date ranges, email formats).
- **Backend Refactoring**: Update all server actions (e.g., `src/app/admin/(protected)/calendar/actions.ts`, `src/app/share/[token]/actions.ts`, `src/app/admin/(protected)/reservations/[id]/actions.ts`, `src/app/admin/login/actions.ts`) to parse inputs through Zod before performing DB operations. Ensure they return safe `{ success: false, error: string }` payloads.
- **Frontend Refactoring**: Update components like `ReservationForm.tsx`, `PaymentUploadForm.tsx`, `ReservationDetailClient.tsx`, and `QRPaymentFlow.tsx` to handle inline validation errors using the server responses or client-side react-hook-form validation with Zod resolvers.
- **Tests**: Expand automated tests to aggressively test boundary conditions (negative amounts, string injection, oversized files, missing tokens, etc.).

## 3. Public Admin Navigation
**Goal**: Provide a modest, accessible Admin entry point on the public landing page.

**Implementation Steps**:
- **UI Update**: Locate the main navigation component for the public site (typically `src/app/page.tsx` or `src/components/...`). Add a clean, discrete link to `/admin/login` matching the public site typography and styling.
- **Security Check**: Ensure this link operates purely as navigation and doesn't leak internal state or bypass the protected `/admin` layout boundary.

## Verification & Reporting
- Ensure the newly isolated QA fixture works perfectly with the verification logic.
- Run `npm run lint`, `npx tsc --noEmit`, `npm run test`, and `npm run build`.
- Generate `audit/next-phase-report.md` (Strictly under 3,000 characters).
