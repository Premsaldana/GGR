# Business Requirements Document (BRD)

## Goa Garden Resort Admin Calendar, Billing and UPI QR System

**Document status:** Design and requirements draft for approval**Prepared for:** Goa Garden Resort**Prepared by:** Manus AI**Source invoice template:** `Goa_Garden_Resort_Billing_Template.docx`

## 1. Executive summary

Goa Garden Resort currently needs a private operational tool for recording guest stays, maintaining a date-based reservation calendar, preparing booking invoices, and presenting guests with a payment QR for the invoice amount. The proposed `/admin` area will be separate from the public resort website and will be accessible only to authorized staff.

The system will let an administrator select an empty calendar date, enter the guest and stay details, calculate invoice line items and totals, generate a template-aligned invoice, and generate a UPI payment QR using the resort’s provided UPI ID, `9482095412@ybl`. The tool will distinguish **QR generated** from **payment received**; generating or scanning a QR is not proof of settlement.

## 2. Business objectives

The primary objective is to replace manual calendar and invoice preparation with one reliable workflow that reduces arithmetic errors and gives the resort a clear operational record for every stay. The system should make it fast to identify occupied and empty dates, create a reservation, prepare a consistent invoice, communicate the amount due, and maintain an audit trail of changes.

The design should feel appropriate for a premium resort operation rather than like a generic accounting spreadsheet. It should be calm, clear, and efficient for staff who may use it on a laptop or tablet while speaking with a guest.

## 3. Stakeholders and users

| Actor | Responsibility | Access |
| --- | --- | --- |
| Owner/Admin | Manage bookings, invoices, payment status, settings, and audit history | Full access |
| Reservation/Operations staff | Create and update guest stays, generate invoices and QR artifacts, record payments | Operational access |
| Content or finance reviewer | Review invoice details and payment records | Optional limited access |
| Guest | Receives an invoice and scans or uses the payment QR | No admin access |

The first release must support at least one trusted admin role. Additional role granularity should be designed even if only one role is activated initially.

## 4. Current-state problem

Guest details, stay dates, billing line items, deposits, advances, balances, and payment instructions are currently represented in a document template and would otherwise require repeated manual entry. This creates risk around date conflicts, inconsistent invoice numbering, incorrect totals, unclear balance calculations, and missing operational history.

## 5. Target business workflow

An authorized user opens `/admin`, signs in, and reaches a dashboard. The user opens the calendar, navigates to a date, and selects an empty date. The system opens a new reservation form with that date prefilled. The user enters guest identity, contact, unit, dates, guest counts, rates, taxes, deposit, advance, payment mode, and notes. The server validates the dates and calculates the invoice. The user reviews a template-aligned invoice, issues or saves it, and chooses a payment amount according to the approved rule. The system creates a QR artifact for the exact displayed amount and provides print/download/copy actions. The user can later update payment status manually and inspect the audit history.

## 6. Business rules

The invoice must preserve the billing-template sections: reservation details, price breakdown, payment summary, property policies, and signatures. Check-in defaults to 1:00 PM and check-out defaults to 11:00 AM. The template states an extra-person charge of Rs 800 per head per night and a refundable security deposit of Rs 5,000. Those values must be configurable or clearly marked as current defaults rather than hardcoded into every future invoice.

The system must calculate nights from check-in and check-out dates on the server. It must reject an end date that is before or equal to the start date unless same-day turnover is explicitly supported. It must detect overlapping stays for the same unit. It must calculate subtotal, optional taxes, deposit, advance, and balance as separate values. It must not silently include the refundable deposit in the QR amount; the QR amount rule requires owner approval.

The system must create a unique reservation reference and invoice number. Issued invoices should be treated as snapshots; later changes should produce a controlled revision or a new version rather than silently changing a document already sent to a guest.

## 7. Scope

### In scope

The first release includes admin sign-in, dashboard, calendar, reservation form, guest records, invoice calculation, invoice preview, invoice print/download, UPI QR creation, payment-status recording, audit events, and responsive staff workflows.

### Out of scope for the first design/implementation gate

Online card/UPI payment confirmation, payment gateway settlement APIs, OTA synchronization, public booking, customer accounts, automated refunds, accounting-system integration, multi-property operations, guest self-service, and automated email delivery are not assumed until separately approved.

## 8. Success measures

The system should allow a trained admin to create a reservation and produce an invoice/QR artifact in under five minutes, with no manual arithmetic required for standard line items. Calendar conflicts should be visible before saving. Every issued invoice should be reproducible from stored data. Every payment-status change should have an actor and timestamp. No unauthorized user should be able to view or change guest records.

## 9. Key risks

The main risks are incorrect room/date mapping, double bookings, incorrect treatment of deposits and taxes, QR amount mismatch, accidental disclosure of guest information, and staff assuming that a QR scan confirms payment. The product will mitigate these through server-side calculations, explicit amount labels, conflict validation, role-based access, audit logs, and visible “payment not verified” states.

## 10. Decisions required from the owner

The owner must approve the authentication method, number and names of units, overlap/check-out policy, QR amount rule, GST treatment, security-deposit treatment, invoice numbering format, payee display name, admin roles, document output format, retention period, and production hosting. These decisions are listed in detail in the PRD and TRD.

## 11. Approval criteria

The BRD is approved when the owner agrees that `/admin` is a private operations tool, confirms that QR generation does not equal payment confirmation, accepts the template field mapping, and decides whether the QR encodes total invoice amount, balance due, deposit, or a selected amount.