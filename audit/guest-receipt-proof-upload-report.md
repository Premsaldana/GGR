# Phase 2 & 3: Guest Receipt and Proof Upload Report

## Files Changed
- **`src/db/schema.ts`**: Added `paymentProofs` table to store upload metadata.
- **`src/lib/storage.ts`** *(New)*: Created the `PaymentProofStorage` provider-neutral abstraction with local and S3-compatible (stubbed) adapters.
- **`.gitignore`**: Ignored the `/storage/` directory to prevent local proof uploads from entering version control.
- **`src/app/share/[token]/PaymentUploadForm.tsx`** *(New)*: Created the guest-facing Client Component form for uploading proofs.
- **`src/app/share/[token]/page.tsx`**: Integrated the upload form, made the receipt strictly read-only, replaced emojis with plain text, and prevented the display of existing proof records/status to the guest.
- **`src/app/share/[token]/actions.ts`** *(New)*: Implemented the `uploadProofAction` Server Action handling token validation, limits, strict signature validation, duplicate rejection, and opaque storage keys.
- **`src/__tests__/test-upload.ts`** *(New)*: Wrote end-to-end integration tests for the upload process.

## Schema Changes
The `payment_proofs` table was added via an idempotent `tsx` script executing raw DDL against the local SQLite database. The schema matches the exact specification requested, tying proofs to invoices and enforcing a strict status lifecycle (`pending_review`, `verified`, `rejected`, `resubmit_requested`). The original filename is deliberately excluded from the storage key to prevent arbitrary path access.

## Storage Behavior
Files are stored securely out-of-band:
- **Local Dev**: Saved natively via Node `fs` API to `modern/storage/proofs/` using cryptographically opaque random keys (32-byte hex).
- **Validation**: Enforced maximum of 5MB and used magic-byte signature validation for JPEG, PNG, and PDF (ignoring spoofed `mimeType` headers).
- **Persistence**: Both the binary blob and the MIME type are saved locally, ensuring correct rendering in the future.
- **Public Exposure**: None. Files are never stored in `/public/` and are inaccessible via static URLs.

## Test Results
Integration tests passing:
- **Valid PNG**: Successfully uploaded and recorded.
- **Valid JPEG**: Successfully uploaded and recorded.
- **Valid PDF**: Successfully uploaded and recorded.
- **Invalid MIME**: Correctly caught and rejected when attempting to spoof content bytes.
- **Oversized file**: Blocked files exceeding 5MB.
- **Unknown/Invalid token**: Rejected completely.
- **Expired token**: Safely rejected.
- **Finalized invoice**: Prevented uploads on already-paid or finalized invoices.
- **Duplicate upload handling**: Ensured a second upload returns a neutral conflict error if a proof is already pending.

*(Note: Typecheck, linting, and build passed successfully.)*

## Remaining Phase 4 Work
**Admin Proof Review and Final Invoice:**
1. **Admin Panel UI**: Create a dashboard tab in the admin layout to list `pending_review` proofs.
2. **Secure Admin Retrieval Route**: Create a protected API route (e.g., `/api/admin/proofs/[key]`) that fetches the blob from the storage abstraction and serves it securely with the correct Content-Type to authenticated admins only.
3. **Admin Actions**: Create server actions for `verifyProof`, `rejectProof`, and `requestResubmission`. 
4. **Payment Closure**: Tie `verifyProof` to updating the reservation's `paymentStatus` to `paid`.
5. **Final Invoice Locking**: Generate the final, unalterable version of the invoice and lock all further share-link uploads.
