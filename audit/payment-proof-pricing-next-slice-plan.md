# DEMAND PRICING, MINIMAL GUEST RECEIPT, PAYMENT-PROOF UPLOAD, AND PRIVATE STORAGE (Next Slice Plan)

## Phase 0: Schema Reconciliation and Inspection

After inspecting `src/db/schema.ts`, the current schema includes `invoices`, `invoice_payments`, `share_links`, `qr_payment_artifacts`, and `reservations`. It does not currently possess a table for `paymentProofs`, nor does the `invoices` table track `parentInvoiceId`, `finalizedAt`, or `finalizedBy`. 

### Required Schema Additions:
1. **`payment_proofs` Table:**
   - `id`: string (PK)
   - `invoiceId`: string (FK to invoices.id)
   - `shareLinkId`: string (nullable FK to share_links.id)
   - `storageKey`: string (opaque random object key)
   - `mimeType`: string
   - `sizeBytes`: integer
   - `status`: string ('pending_review', 'verified', 'rejected', 'resubmit_requested')
   - `submittedAt`: timestamp
   - `reviewedAt`: timestamp (nullable)
   - `updatedAt`: timestamp
   - `reviewedBy`: string (nullable FK to users.id)
   - `adminNote`: string (nullable)
   - `verifiedAmountMinorUnits`: integer (nullable)
   - `paymentMode`: string (nullable)
   - `paymentReference`: string (nullable)

2. **`invoices` Table Updates:**
   - Add `parentInvoiceId`: string (nullable, self-referential FK)
   - Add `finalizedAt`: timestamp (nullable)
   - Add `finalizedBy`: string (nullable FK to users.id)

---

## Phase 1: Demand-Based Pricing in the Calendar Form

### UI Adjustments (`ReservationForm.tsx`)
- Enhance the reservation drawer to explicitly expose:
  - **Accommodation Rent**: Nightly rate or total rent, deriving nights from Check-In/Check-Out.
  - **Extra-Person**: Quantity & Rate (default Rs 800 editable).
  - **Early Check-In / Late Check-Out Charges**.
  - **Additional Services**: Dynamic fields (description, quantity, rate).
  - **Taxes & Deposit**: GST percentage/fixed amount and Refundable Security Deposit (default Rs 5,000 editable).
  - **Advance Received**: Amount, Mode, Date.
  - **Internal Notes**.
- Retain Figma/admin visual language (no emojis).
- Provide a **Live Summary Panel** strictly calculating paise amounts via `calculateInvoice()` without trusting client totals.

### Server Behavior (`calendar/actions.ts`)
- All pricing inputs will be strictly validated and mapped to normalized `reservationLineItems` during draft save.
- All amounts will be strictly verified on the server.

---

## Phase 2: Minimal Read-Only Guest Receipt

### Updates (`share/[token]/page.tsx`)
- Enforce strict read-only mode for the guest receipt.
- Display only the authorized subset: Resort Identity, Snapshot Guest Name, Reservation Ref, Dates, Unit, Issued Invoice Amount, QR Amount, QR Artifact, UPI ID/Payee, and payment instructions.
- Ensure the disclaimer: *"Payment is not automatically verified by this screen."*
- Remove all inputs, text editors, generation controls, admin navigation, emojis, and unrelated payment records.
- Ensure no mutation actions can be triggered other than the strictly controlled "Upload Payment Proof".

---

## Phase 3: Payment-Proof Upload with Storage Abstraction

### Storage Abstraction (`src/lib/storage.ts`)
- Implement a `PaymentProofStorage` provider-neutral interface (`put`, `head`, `get`, `delete`).
- Create a local adapter for development saving to `modern/storage/proofs/` (added to `.gitignore`).
- Stub an S3/R2-compatible adapter, conditionally loaded via environment variables (no credentials stored in code).

### Upload Workflow
- Add a client-side upload component on the guest receipt for submitting proof.
- Create an API route `POST /api/upload-proof` that:
  - Requires a valid, active, unexpired share token.
  - Enforces a 5MB maximum file size and strict MIME type (JPEG, PNG, PDF) signature checks.
  - Writes via the storage abstraction with an opaque random key.
  - Creates a `paymentProofs` record with status `pending_review`.
  - Never marks an invoice as paid.

---

## Phase 4: Admin Proof Review and Final Payment Closure

### Admin Review UI (`reservations/[id]/page.tsx`)
- Add a **Payment Proof Review Panel** visible only to allowlisted MFA-complete admins.
- Expose actions: **View Proof**, **Verify Payment**, **Reject**, **Request Resubmission**, and **Close Payment**.

### Server Actions & Security
- `verifyProofAction`: Requires a verified amount, mode, reference, and note.
- `rejectProofAction`: Requires a rejection reason.
- Both actions are transactional, idempotent, and heavily audited.
- Over/under payments are correctly handled. Payment status transitions strictly to `partially_paid` or `paid` only upon explicit admin verification.

### Final Invoice Generation
- Add logic to generate a final invoice snapshot (with incremented version and `finalizedAt`).
- Consolidates verified payment snapshots into the final immutable record.
- Do not overwrite previous issued snapshots.

---

### End of Plan
Awaiting explicit approval before beginning **Phase 1**.
