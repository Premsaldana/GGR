# Product Requirements Document (PRD)

## Goa Garden Resort Admin Calendar, Billing and UPI QR System

**Version:** 1.0 design gate**Status:** Ready for UI/UX review**Audience:** Resort owner, product designer, Antigravity implementation agent

## 1. Product definition

The product is a protected admin workspace at `/admin` for managing stays and producing guest billing artifacts. It is not a public booking portal. Its primary user is a resort admin who needs to turn a guest conversation into a structured reservation, invoice, and payment instruction quickly and accurately.

## 2. Primary user journeys

### Journey A: Sign in

The admin visits `/admin`. Unauthenticated users see a sign-in screen and cannot access calendar or guest data. Authentication failure, expired session, unauthorized role, and logout must have explicit states.

### Journey B: Add a stay from an empty date

The admin opens the calendar, chooses a month or week, and selects a date that has no reservation for the chosen unit. A new-reservation drawer or page opens with the selected date prefilled as check-in. The admin enters the guest and stay information, adds line items, reviews calculated totals, and saves a draft or issues the invoice.

### Journey C: Edit a reservation

The admin opens an occupied date or reservation card. The booking detail view shows guest data, stay dates, invoice versions, payment status, notes, and audit history. Edits that affect totals require recalculation and a clear unsaved/updated state.

### Journey D: Generate an invoice

The admin previews an invoice matching the provided template. The invoice shows reservation number, issue date, resort details, guest name, property/room type, booking status, check-in/out, nights, guest counts, price breakdown, subtotal, applicable taxes, refundable deposit, total amount due, payment summary, amount in words, policies, and signature areas. The admin can print or download the invoice after validation.

### Journey E: Generate a UPI QR

From the issued invoice, the admin selects the amount to request according to the approved rule. The system displays the amount, UPI ID, payee name, invoice reference, and a disclaimer that payment is not verified. The server creates a UPI payment URI and QR artifact. The admin can copy the UPI ID, copy the payment link if available, download the QR, print it, and mark payment status manually after verifying the bank/app receipt.

## 3. Functional requirements

### Authentication and authorization

- `/admin` must be protected by server-enforced authentication.

- Unauthenticated users must never receive guest, invoice, or calendar data.

- The system must support an admin role and provide a path for future operations-staff roles.

- Sessions must expire safely and provide a re-login path.

- Sensitive mutations must be authorized on the server, not only hidden in the UI.

### Calendar

- Display month view as the default; provide a week view if it improves operational use.

- Show unit filter when more than one unit exists.

- Distinguish empty dates, check-in, in-house, check-out, pending, confirmed, cancelled, and payment-due states.

- Selecting an empty date opens the new-reservation flow with the date prefilled.

- Selecting a reservation opens its detail view.

- Prevent or warn on overlapping stays for the same unit.

- Support keyboard navigation and clear focus states.

- Provide empty, loading, error, and no-results states.

### Guest and reservation form

The form must collect guest name, phone, email if available, adults, children, selected unit/property, check-in, check-out, booking status, payment mode, advance received, advance date, special requests/notes, and optional identity/reference fields only if the owner approves their storage. It must not collect unnecessary sensitive identity data by default.

The pricing editor must support accommodation, extra-person charge, early check-in, late check-out, additional services, tax, refundable security deposit, and manual adjustments. Each line must show description, quantity/nights, rate, and calculated amount.

### Invoice calculation

The server must calculate nights and amounts from validated inputs. The UI must show subtotal, tax, deposit, total amount due, advance received, and balance due as separate values. The system must convert the total or selected amount into words using INR formatting. Rounding rules must be deterministic and documented.

### Invoice lifecycle

- Draft invoices can be edited.

- Issued invoices are versioned or require a controlled revision.

- Invoice references are unique and human-readable.

- Invoice preview must match print/download output.

- Invoice status should include draft, issued, partially paid, paid, cancelled, and superseded where appropriate.

- The template’s policies should be configurable later; the first design may display the current approved policy text.

### UPI QR

- Store the UPI ID as configuration, not scattered code: `9482095412@ybl`.

- Encode a server-calculated amount, INR currency, payee name, and a short invoice/reservation note.

- Show the exact encoded amount next to the QR.

- Provide QR generation failure and retry states.

- Create a versioned QR artifact with amount, invoice reference, created time, and creator.

- Never label a QR as paid automatically.

- Provide a manual payment-status update with note and audit event.

- Prefer a deterministic UPI URI rendered to QR. Do not depend on browser scraping of `upi.pe`.

### Dashboard

The dashboard should show today’s check-ins, today’s check-outs, current in-house guests, outstanding balances, recent invoices, and a primary “Add reservation” action. Metrics must be derived from actual records and must have clear empty states.

## 4. Data and content requirements

The invoice design must use the provided Goa Garden Resort template as the content baseline. The UI must preserve the supplied contact information and policies only after owner confirmation. The product must not invent prices, room facts, GST values, or payment status.

## 5. Non-functional requirements

The admin must be responsive on laptop and tablet and usable on a 375px mobile viewport for urgent operational tasks. Keyboard-only use, visible focus, semantic labels, sufficient contrast, and reduced-motion behavior are required. Server-side validation, auditability, backups, and access logging are required before production.

The system should be resilient to network failures and repeated submissions. Critical mutations should provide explicit loading states and idempotency or duplicate-submission protection. Invoice data and guest data should not appear in client-side analytics payloads or error logs.

## 6. Acceptance criteria

A feature is accepted when an authorized admin can sign in, navigate to an empty date, create a stay, see calculated nights and line items, save a reservation, preview an invoice, generate a QR for the approved amount, print/download the artifacts, and record payment status. An overlapping date is blocked or clearly requires an authorized override. An unauthorized visitor cannot access the data. A QR generated for amount X must visibly display amount X in the invoice and QR panel. A generated QR must not change payment status automatically.

## 7. Future scope

The system may later connect to a payment gateway or bank verification source, external booking engine, automated email delivery, CMS, accounting software, and multi-property operations. These integrations must be isolated behind adapters and must not leak provider credentials into the frontend.

## 8. Approval questions

The owner must answer the QR amount rule, tax rule, security-deposit inclusion, payee display name, auth method, unit list, invoice numbering pattern, output format, and data-retention policy before implementation begins.