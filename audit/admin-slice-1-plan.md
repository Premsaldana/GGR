# Admin Slice 1 Implementation Plan

## 1. Technical Stack & Dependencies
- **Database**: SQLite (via `better-sqlite3`), Drizzle ORM (`drizzle-orm`, `drizzle-kit`).
- **Authentication**: Custom session management using `iron-session` (to strictly satisfy the exact multi-step Auth flow without fighting a rigid provider), `nodemailer` (for email OTP), and `otplib` & `qrcode` (for TOTP generation and validation).
- **UI & Utilities**: `lucide-react` (icons), `date-fns` (calendar logic), `clsx` & `tailwind-merge` (class management).

## 2. Database Schema (Drizzle)
We will create a full schema matching the TRD in `src/db/schema.ts`:
- `users`: id, email, role (`owner_admin`), totp_secret, created_at.
- `sessions`: Custom or `iron-session` doesn't strictly require DB sessions, but we can store them if needed for revocation.
- `guests`: id, full_name, phone, email, notes, timestamps.
- `units`: id, display_name, slug, capacity, timestamps.
- `reservations`: id, reservation_number, guest_id, unit_id, check_in_date, check_out_date, booking_status, payment_status, adults, children, payment_mode, advance_received, timestamps.
- `reservation_line_items`: id, reservation_id, category, description, quantity, rate_minor_units, tax_rate, amount_minor_units.
- `invoices`: id, invoice_number, reservation_id, status, subtotal, tax, deposit, total, advance, balance, amount_in_words, snapshot_json.
- `invoice_payments`: id, invoice_id, amount, status.
- `qr_payment_artifacts`: id, invoice_id, amount, upi_id, payee_name, upi_uri.
- `audit_events`: id, actor_user_id, entity_type, entity_id, event_type, before_json, after_json.

## 3. Design Tokens (Tailwind v4)
Updating `src/app/globals.css` with Figma tokens:
- Ink: `#1D2422`, Botanical: `#233B35`, Mineral: `#F5F1E9`, Shell: `#FFFCF6`
- Terracotta: `#B75E3C`, Brass: `#B88A3B`, Sage: `#718779`, Mist: `#E8E1D6`, Danger: `#B8463D`
- Fonts: `Cormorant Garamond` (Display), `Inter` (UI)

## 4. Authentication Flow (Server Actions)
1. User enters email at `/admin/login`.
2. Server validates against allowlist (`goagardenresort@gmail.com`, `premsaldana0@gmail.com`).
3. Server generates 6-digit OTP, sends via nodemailer (Ethereal in dev), stores hash in temporary session.
4. User enters OTP.
5. If OTP valid, Server checks if TOTP is setup. If not, generates secret, shows QR. If yes, prompts for TOTP.
6. User enters TOTP code. Server validates with `otplib`.
7. Success -> Create authenticated `iron-session` with user ID and role, redirect to `/admin`.

## 5. UI Implementation
- `/admin/layout.tsx`: Protected layout. Server-side session check. Responsive sidebar (Botanical background, Shell/Mist text).
- `/admin/login/page.tsx`: Multi-step auth shell matching Figma styling.
- `/admin/page.tsx`: Dashboard with placeholder metric cards, empty state, and check-in/out lists.
- `/admin/calendar/page.tsx`: Month view grid. Uses `date-fns` to generate calendar days. Displays occupied spans. Clicking empty date updates URL state `?newReservationDate=YYYY-MM-DD`.
- `ReservationFormDrawer`: A shell component that slides in when `newReservationDate` is present in URL. Prefilled with the selected date. No save functionality yet.

## 6. Verification Steps
1. Typecheck: `tsc --noEmit`
2. Lint: `eslint .`
3. Migrations: `drizzle-kit push` (or generate/migrate).
4. Build: `next build`
5. Report generation in `audit/admin-slice-1-report.md`.
