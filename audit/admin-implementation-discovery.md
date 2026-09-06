# Admin Implementation Discovery Audit

## 1. Current Project Stack and Entry Points
- **Framework:** Next.js 16.3.4 (App Router)
- **UI & Styling:** React 19, Tailwind CSS v4, Framer Motion
- **Language:** TypeScript
- **Entry Points:** The main application entries are located at `src/app/page.tsx` (Homepage), `src/app/stay/`, and `src/app/contact/`. 
- **Integrations:** There is an existing `src/integrations/booking` structure but no heavy dependencies listed.

## 2. Existing Capabilities
- **Authentication:** None currently configured (no NextAuth, Clerk, or session management).
- **Database:** None currently configured (no Prisma, Drizzle, or local/remote DB drivers in `package.json`).
- **API:** No existing server-side API or tRPC infrastructure yet.
- **Deployment:** Standard Next.js build system.

## 3. Existing Public Frontend Boundaries
- The public-facing pages (`/`, `/stay`, `/contact`) reside in `src/app/` and operate cleanly with `globals.css` and `layout.tsx`.
- **Constraint:** The new `/admin` module must be built alongside this as a protected route group, without leaking admin components or sensitive billing data into the public-facing boundaries or client bundles.

## 4. Figma Screen Inventory & Components
From the design specifications and available PNG references, the required screens are:
1. **Admin Sign In** (`figma-admin-sign-in.png`): Needs email verification and TOTP.
2. **Dashboard Overview** (`figma-admin-dashboard.png`): Metric cards, today's check-ins/outs.
3. **Calendar Month View** (`figma-calendar.png`): Month grid, date picker, reservation spans, status badges.
4. **Reservation Form / Drawer** (`figma-reservation-form.png`): Guest inputs, money inputs, line-item tables.
5. **Invoice Preview** (`figma-invoice-preview.png`): Print/download action group, invoice document layout.
6. **QR Payment Panel** (`figma-upi-qr.png`): QR artifact display, exact amount emphasis, manual confirmation action.

*Missing Accessibility Constraint:* To perfectly reproduce the design tokens (Ink, Botanical, Mineral, Shell, Terracotta, Brass, Sage), spacing, typography, and interactive components described in `goa-garden-resort-admin-figma-design-spec.md`, the PNGs are insufficient for extracting exact pixel values and CSS styles. (See required access section below).

## 5. Billing Template Fields Mapped to Data Entities
Based on the extracted `Goa_Garden_Resort_Billing_Template.docx`, the fields map to the relational data model as follows:
- **RESERVATION # / DATE:** `reservations.reservation_number` / `invoices.issued_at`
- **GUEST NAME:** `guests.full_name`
- **PROPERTY:** `units.display_name`
- **STATUS / DATES:** `reservations.booking_status`, `reservations.check_in_date`, `reservations.check_out_date`
- **PRICE BREAKDOWN (Line items):** `reservation_line_items` (Quantity, Rate, Amount)
- **SUBTOTAL / TAX / DEPOSIT / TOTAL:** `invoices.subtotal_minor_units`, `invoices.tax_minor_units`, `invoices.security_deposit_minor_units` (Default Rs 5000), `invoices.total_minor_units`
- **PAYMENT MODE / ADVANCE:** `reservations.payment_mode`, `reservations.advance_received`
- **BALANCE DUE / AMOUNT IN WORDS:** `invoices.balance_minor_units`, `invoices.amount_in_words`

## 6. Missing Infrastructure and Implementation Risks
- **Infrastructure Gaps:**
  - Need a Database ORM (e.g., Drizzle) and a database dialect (SQLite for local, Postgres for prod).
  - Need an Authentication library to strictly enforce the `goagardenresort@gmail.com` rule and TOTP (e.g., Lucia Auth or NextAuth with a custom provider).
  - Need a deterministic local QR generation library (e.g., `qrcode` or `react-qr-code`).
- **Risks:**
  - Trusting client-side math for invoice totals. (Mitigation: All line-item math and balance calculations must happen on the server).
  - Floating-point errors for INR calculation. (Mitigation: Store all money in integer minor units / paise).
  - Marking an invoice as paid automatically on QR generation. (Mitigation: Strict explicit manual confirmation).
  - Date overlap issues due to timezone mismatches. (Mitigation: Strict UTC handling and check-in/out default boundary validation).

## 7. The Smallest Safe Slice 1 Plan
1. **Infrastructure Init:** Set up Drizzle ORM with a local SQLite database (`.sqlite` ignored in source control) and define the schema (`guests`, `units`, `reservations`, `invoices`).
2. **Auth & Protection:** Scaffold the `/admin` route group, implement the email check for `goagardenresort@gmail.com`, and apply basic session protection (adding TOTP subsequently).
3. **Calendar Read View:** Build the calendar grid UI to fetch and display empty/occupied dates from the database.
4. **Reservation Draft:** Implement the server action to calculate an invoice and save a draft reservation from the selected empty dates.
