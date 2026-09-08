# Technical Requirements Document (TRD)

## Goa Garden Resort Admin Calendar, Billing and UPI QR System

**Version:** 1.0 design gate**Status:** Ready for architecture and Figma review**Implementation target:** Antigravity IDE after design approval

## 1. Technical objective

Build a protected full-stack admin module at `/admin` that stores reservations and guest records, calculates invoice totals on the server, renders an invoice based on the supplied template, and generates a deterministic UPI QR artifact for an approved amount. The public resort website remains a separate experience. No card data, UPI credentials, or payment secrets belong in the browser.

## 2. Recommended architecture

Use a React frontend with a server-side API/procedure layer and relational database. If the implementation uses the Manus full-stack template, follow its tRPC-first contracts, Drizzle schema, protected procedures, and Vitest testing conventions. If Antigravity uses another stack, preserve the same boundaries: typed server contracts, server-side authorization, relational persistence, and no direct browser-to-database access.

| Layer | Responsibility |
| --- | --- |
| Admin UI | Calendar, forms, invoice preview, QR panel, loading/error states |
| Auth | Admin identity, session, role checks, logout, session expiry |
| API/procedure layer | Protected reads/mutations, validation, conflict checks, invoice and QR operations |
| Relational database | Guests, units, reservations, line items, invoices, payments, QR artifacts, audit events |
| Invoice renderer | Deterministic HTML/print view and optional server PDF output |
| QR service | Build UPI URI from approved server values and render QR image/SVG |
| Storage | Optional storage for invoice PDFs and future attachments; do not place large assets in client public folders |
| Observability | Error logging without guest/payment secrets and audit events for business mutations |

## 3. Authentication and authorization

Use the selected platform’s supported authentication flow. The implementation must not hand-roll cookies or store passwords in application tables unless a security review explicitly approves it. Every admin procedure must require an authenticated user and an approved role. Authorization must be checked on the server for every query and mutation.

Minimum roles should be `owner_admin` and `operations_staff`, even if only `owner_admin` is enabled at first. Owners can manage users, configuration, reservations, invoices, and payment status. Operations staff can manage reservations and invoice artifacts but should not change payment configuration or user access unless explicitly granted.

## 4. Database model

### `guests`

Fields: `id`, `full_name`, `phone`, `email`, `notes`, `created_at`, `updated_at`, `created_by`, `updated_by`, and optional `deleted_at`. Avoid storing identity documents or unnecessary sensitive data in the first release.

### `units`

Fields: `id`, `display_name`, `slug`, `property_label`, `capacity_adults`, `capacity_children`, `active`, `default_check_in_time`, `default_check_out_time`, and timestamps. The unit list must be owner-configurable rather than embedded in calendar logic.

### `reservations`

Fields: `id`, `reservation_number`, `guest_id`, `unit_id`, `check_in_date`, `check_out_date`, `booking_status`, `payment_status`, `adults`, `children`, `payment_mode`, `advance_received`, `advance_received_at`, `notes`, `created_by`, `updated_by`, timestamps, and optional `cancelled_at`/`cancelled_by`.

Use a date-range conflict query for the same unit: a new stay overlaps when `existing.check_in < new.check_out` and `existing.check_out > new.check_in`, excluding cancelled records. Enforce this again inside a transaction or with a concurrency-safe mechanism so two admins cannot save conflicting stays simultaneously.

### `reservation_line_items`

Fields: `id`, `reservation_id`, `category`, `description`, `quantity`, `unit_label`, `rate_minor_units`, `tax_rate`, `amount_minor_units`, `sort_order`, and timestamps. Store money as integer minor units or a decimal type; never use binary floating-point for persisted invoice amounts.

### `invoices`

Fields: `id`, `invoice_number`, `reservation_id`, `version`, `status`, `issued_at`, `currency`, `subtotal_minor_units`, `tax_minor_units`, `security_deposit_minor_units`, `total_minor_units`, `advance_minor_units`, `balance_minor_units`, `amount_in_words`, `snapshot_json`, `created_by`, timestamps. `snapshot_json` preserves the issued invoice’s exact display data so later content changes do not rewrite historical documents.

### `invoice_payments`

Fields: `id`, `invoice_id`, `amount_minor_units`, `payment_mode`, `payment_status`, `received_at`, `reference`, `notes`, `recorded_by`, timestamps. Initial statuses can include recorded, pending-verification, verified, rejected, and refunded if the owner approves them.

### `qr_payment_artifacts`

Fields: `id`, `invoice_id`, `amount_minor_units`, `upi_id`, `payee_name`, `currency`, `transaction_note`, `upi_uri`, `qr_format`, `artifact_version`, `created_by`, `created_at`, and optional `revoked_at`. Do not store private keys or bank credentials. The URI may be stored because it contains payment request data, but access must remain protected.

### `audit_events`

Fields: `id`, `actor_user_id`, `entity_type`, `entity_id`, `event_type`, `before_json`, `after_json`, `request_id`, `created_at`. Redact sensitive fields and do not store full authentication tokens.

## 5. Server contracts

The exact framework can express these as tRPC procedures, typed REST endpoints, or another typed API. The conceptual contracts are:

- `auth.me` and `auth.logout`.

- `calendar.getRange({ start, end, unitId })`.

- `reservation.createDraft(input)`.

- `reservation.checkConflict(input)`.

- `reservation.update(input)`.

- `reservation.getById({ id })`.

- `reservation.listRecent(filters)`.

- `invoice.calculate(input)`.

- `invoice.issue({ reservationId, expectedVersion })`.

- `invoice.getPreview({ invoiceId, version })`.

- `invoice.download({ invoiceId, version, format })`.

- `qr.createForInvoice({ invoiceId, amountMode, manualAmount? })`.

- `payment.recordManual(input)`.

- `audit.listForEntity({ entityType, entityId })`.

All input schemas must validate dates, money, integer counts, enum values, line-item descriptions, and maximum text lengths. Server procedures must recompute totals instead of trusting client-provided totals.

## 6. Invoice calculation rules

The server receives line-item inputs and computes each line amount as `quantity × rate`, applies the approved tax rule, adds or separates the refundable security deposit according to configuration, and calculates balance as `total invoice amount − advance received` subject to a non-negative constraint. It must preserve the distinction between subtotal, tax, deposit, total, advance, and balance.

The system must use a documented rounding policy. The default recommendation is to store INR amounts in paise or a decimal representation, calculate at line level, round according to the approved currency rule, and sum rounded line items consistently. Amount-in-words conversion must be deterministic and tested for zero, small values, thousands, lakhs, and decimal amounts.

## 7. UPI QR generation

Build the payment payload server-side. The conceptual UPI URI is:

`upi://pay?pa={upiId}&pn={encodedPayeeName}&am={amountInRupees}&cu=INR&tn={encodedReference}`

The UPI ID is configuration with the initial value `9482095412@ybl`; it must be owner-verifiable before production. The payee display name must be an approved configuration value. The amount must be selected from a server-calculated invoice value according to the approved product rule: total due, balance due, deposit, or explicit manual amount. The UI must never allow a mismatch between the displayed amount and the encoded amount.

The QR library must render a QR image/SVG from the URI without sending guest or invoice data to an unknown third-party service. The user specifically referenced `https://upi.pe/`; the implementation should not scrape it or depend on undocumented page behavior. If an official API or supported URL format is confirmed later, it may be implemented behind an adapter. Until then, deterministic local URI generation is the safer design.

The QR screen must state: “QR generated for ₹X. Payment is not verified by this screen.” Manual verification requires an authorized staff action and creates an audit event.

## 8. Invoice rendering and output

The initial implementation should use a deterministic HTML invoice preview with print CSS and a print/download action. PDF generation can be added server-side after the template is visually approved. The rendered document must preserve page margins, clear table headings, INR formatting, policy text, signature lines, and a QR section without splitting critical totals across pages.

## 9. Security and privacy

Use HTTPS in all non-local environments. Protect every admin route and server procedure. Apply least privilege. Validate and sanitize all text inputs. Use CSRF protection appropriate to the chosen auth/session model. Rate-limit sign-in and sensitive mutations. Avoid putting guest names, phone numbers, invoice amounts, or UPI URIs into analytics events or client error reporting. Keep secrets server-side and out of source control. Define backup, retention, deletion, and restore procedures before production.

## 10. Testing requirements

Unit tests must cover nights calculation, date overlap, line-item totals, tax, security deposit separation, advance/balance, INR amount-to-words, UPI URI encoding, QR amount equality, and invoice versioning. Integration tests must cover protected procedures, unauthorized access, duplicate reservation submission, concurrent conflict handling, invoice issuance, and manual payment recording. Browser tests must cover sign-in, empty-date creation, occupied-date editing, invoice preview, QR generation, print layout, mobile calendar, and error states.

## 11. Deployment and operations

Use separate local, staging, and production environments. Store database credentials, auth configuration, UPI configuration, payee name, and email settings as environment variables or managed secrets. Do not use the production database in local development. Back up the database and define a restore test. Log operational errors with request IDs while redacting personal and payment data.

## 12. Implementation sequence after Figma approval

1. Initialize or open the full-stack project.

1. Add schema and migrations.

1. Implement auth and role checks.

1. Build protected admin shell and calendar read model.

1. Add reservation creation and conflict handling.

1. Add server-side invoice calculation and template-aligned preview.

1. Add local UPI URI/QR generation and explicit payment-status model.

1. Add print/download output.

1. Add audit history and backup/observability hooks.

1. Run automated and browser tests.

1. Deploy to staging and perform owner review.

1. Only then consider production configuration.

## 13. Technical approval criteria

The TRD is approved when the owner accepts the architecture boundary, auth approach, data model, conflict rule, money representation, invoice versioning, QR amount rule, non-confirmation behavior, security controls, and test strategy. Implementation must not begin from this document alone until the Figma screens and open business decisions are approved.