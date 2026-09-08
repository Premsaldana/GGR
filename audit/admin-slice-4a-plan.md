# Admin Slice 4A Implementation Plan

## Goal
Implement admin-selected UPI QR generation and a secure, shareable read-only bill for guests, utilizing the existing database schemas (`qrPaymentArtifacts`, `shareLinks`).

## Open Questions
- Is there a specific expiration duration desired for the share links (e.g., 24 hours, 7 days)? I will default to 7 days.
- For the payee display name in the UPI QR, is "Goa Garden Resort" acceptable, or is there a specific legal entity name to be used? I will default to "Goa Garden Resort".

## Proposed Changes

### Database Layer (Actions)
#### [NEW] `src/app/admin/(protected)/calendar/actions/qr.ts` (or add to `actions.ts`)
- `generateQRAction(invoiceId: string, amountMinorUnits: number)`:
  - Validate amount is `> 0`.
  - Invalidate old active QR requests (or just let the latest `artifactVersion` be active).
  - Create a new `qrPaymentArtifact` record.
  - Generate UPI string: `upi://pay?pa=9482095412@ybl&pn=Goa%20Garden%20Resort&am={amount}&tr={invoiceNumber}`
  - Create `auditEvent` for QR generation.
- `createShareLinkAction(invoiceId: string)`:
  - Generate a secure random token.
  - Create a `shareLink` record expiring in 7 days.
  - Create `auditEvent`.
- `revokeShareLinkAction(tokenId: string)`:
  - Delete or expire the `shareLink` record.
  - Create `auditEvent`.

### UI Components
#### [MODIFY] `src/app/admin/components/InvoicePreview.tsx`
- Remove the disabled "Generate UPI QR (Coming Soon)" button if it's an issued invoice.
- We will add a wrapper or inject a new component for the "QR Payment Flow" into the invoice page since `InvoicePreview` is a pure display component.

#### [NEW] `src/app/admin/components/QRGenerator.tsx`
- A client component allowing the admin to input an amount.
- Displays reference values (Invoice total, Advance, Balance, Deposit).
- Validates amount (>= 0).
- Calls `generateQRAction`.
- Displays the generated QR code using `qrcode.react` (or `qrcode` to canvas).
- Provides copy actions (UPI ID, URI, Share Link).
- Warning: "QR generated for this amount. Payment is not verified by this screen."

#### [NEW] `src/app/admin/components/ShareLinkManager.tsx`
- A component to generate, display, copy, and revoke the shareable link for an invoice.

### Guest-Facing Routes
#### [NEW] `src/app/share/[token]/page.tsx`
- Server component.
- Validates the token against `shareLinks`.
- If invalid/expired, returns a generic "Not Found or Expired" UI.
- If valid, fetches the `invoice` and the latest `qrPaymentArtifact`.
- Displays a guest-friendly version of `InvoicePreview` (without admin controls) and the QR code.
- Includes `<meta name="robots" content="noindex, nofollow" />`.

## Verification Plan
### Automated Tests
- Add `test-qr.ts` to test:
  - Server-side amount validation (rejects negative amounts).
  - Token expiration and revocation behavior (returns generic error).
  - Concurrent QR generation creates new versions properly.
  - Audit logs are written correctly without leaking secrets.
  - Unauthorized access (`requireAdmin` bypass) fails.

### Manual Verification
- Test generating QR code from the Admin Invoice view.
- Scan QR code with a test app to verify UPI payload accuracy.
- Test share link access, verifying it loads the guest bill without exposing PII of other guests.
- Revoke share link and verify it instantly becomes inaccessible.
