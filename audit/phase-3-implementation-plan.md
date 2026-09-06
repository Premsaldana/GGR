# Phase 3 — Frontend-First Implementation Plan

**Status**: Approved — implementation begins after this plan is written  
**Scope**: Design-token foundation + shared shell + one vertical slice (1 Bedroom Villa detail + enquiry fallback)  
**Deferred**: CMS, booking engine, payment gateway, production backend, Unicorn Studio  
**Branch**: `brownfield-branch`  
**Modern app location**: `modern/` directory inside `c:\GGR\` (beside legacy files; legacy files untouched)

---

## Why `modern/` and not `src/`?

The legacy site lives at `c:\GGR\` root. Phase 2 architecture specifies placing the Next.js app in a `src/` subfolder of the root. However, to keep a clean separation while legacy files are still in-place and to avoid any accidental overwrite of the root `index.html`, the new Next.js application will be scaffolded as `c:\GGR\modern\`. The directory structure inside `modern/` matches the `audit/target-structure.md` specification exactly (it becomes `src/` when the legacy files are eventually moved out).

---

## Confirmed Content (from audit files — safe to use now)

| Item | Confirmed Value |
|---|---|
| Property name | South Goa Garden Villa |
| Phone | +91 7813093075 |
| Email | goagardenresort@gmail.com |
| Address | Behind Colva Police Station, Colva – Benaulim Road, Margao, Goa 403708 |
| WhatsApp number | +917813093075 |
| Room 1 name | 5 Bedroom Villa with Private Pool *(marked for owner confirmation)* |
| Room 2 name | 4 Bedroom Villa *(marked for owner confirmation)* |
| Room 3 name | 1 Bedroom Villa *(marked for owner confirmation)* |
| Room 3 capacity | Max 4 guests |
| Room 3 description | Semi-detached private villa; private rear and roof garden; king-size bed + sofa bed; bathtub; safe; dual sockets |
| Room 3 image | `pics/DSCN2468.JPG` (3.5 MB — must be referenced but flagged for optimization) |
| Amenities | All confirmed from index.html lines 108–191 |

## Unresolved Content (marked `[OWNER APPROVAL NEEDED]` in code)

- Canonical room names (index.html says "bedroom Villa"; test.html says "BHK Apartments" — inconsistent)
- Image/room mapping: `4bhk.jpeg` and `5bhk.jpeg` appear swapped (see content-inventory.md)
- Room rates / "starting from" prices — none exist in legacy site
- Social media URLs — not in legacy site
- Logo: current logo is a cartoon clipart; kept for now, flagged for replacement
- Images with burned-in text overlays (Bedroom.jpg, Living room.jpg) — used as gallery only, not hero
- Watermarked image (Living room.jpg) — used as gallery only, flagged

---

## Technology Stack (from audit/architecture-decision.md)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript, SSG) |
| Styling | Tailwind CSS v4 + CSS custom properties (design tokens) |
| Components | shadcn/ui base + custom resort design system |
| Fonts | `next/font/google` — Cormorant Garamond (display serif) + Inter (sans) |
| Animations | Framer Motion (restrained; `prefers-reduced-motion` required) |
| Images | `next/image` (automatic WebP, lazy, srcset) |
| Booking adapter | Provider-neutral interface (stub only — no provider connected) |
| CMS | Local TypeScript content files (mock; CMS deferred) |
| Backend | None in this scope (enquiry form posts to a stub handler) |
| Hosting | Not deployed in this scope |

---

## Slice Definition — First Vertical Slice

> "A guest on any device can: land on the homepage, understand the property, navigate to the 1 Bedroom Villa detail page, read accurate room facts, see real property images, and reach an enquiry fallback — all without CMS, booking engine, or payment."

### What is built in this scope

| Area | Deliverable |
|---|---|
| Foundation | `.gitignore`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, design tokens (`tokens.css`), font setup, motion rules |
| Shell | `ResortHeader` (logo, nav, phone, "Enquire" CTA, mobile menu), `ResortFooter` (address, contact, copyright) |
| Homepage `/` | Hero section (pool image, headline, CTA), 3-room preview cards, amenities highlights strip, enquiry CTA |
| Rooms listing `/stay` | Three room cards with confirmed content |
| Room detail `/stay/1-bedroom-villa` | Full detail: hero image, H1, description, facts grid, amenities, enquiry CTA |
| Enquiry page `/contact` | Enquiry form (static — submits to a stub that logs locally; no email delivery in this scope) |
| Booking adapter | `integrations/booking/adapter.ts` with provider-neutral interface and stub that throws "not configured" |
| SEO | `<title>`, `<meta description>`, Open Graph, canonical, `robots.ts`, `sitemap.ts` |
| Structured data | `LodgingBusiness` JSON-LD on homepage |
| Accessibility | Skip link, single H1 per page, ARIA landmarks, keyboard nav, focus styles, reduced-motion |
| Redirects | `/index.html` → `/`, `/test.html` → `/stay` in `next.config.ts` |

### What is NOT built

- CMS or Sanity integration
- Live booking engine widget or hosted checkout
- Payment gateway
- Email delivery (Resend)
- Live analytics
- Unicorn Studio (deferred to after static version is approved)
- 21st.dev components (deferred)
- Offers, Experiences, Dining, Gallery, Location, About pages (Phase 4)
- Production authentication

---

## Implementation Steps

### Step 1: Scaffold Next.js app in `modern/`
- Run `create-next-app` with TypeScript, Tailwind, App Router
- Verify build succeeds with `npm run build`
- Add `.gitignore` covering `node_modules`, `.next`, `.env*`, `.vercel`

### Step 2: Design-token foundation
- `src/design-system/tokens.css`: All CSS custom properties
  - Colors: warm limestone base, deep botanical accent, terracotta highlight, neutral greys, success/error
  - Typography: scale, families, weights, line heights
  - Spacing: 4px grid
  - Radius, focus ring, motion durations, easings
- `tailwind.config.ts`: map tokens to Tailwind utility classes
- `src/design-system/motion.ts`: Framer Motion variants with `useReducedMotion`

### Step 3: Font setup
- `next/font/google`: Cormorant Garamond (display, 400/600), Inter (body, 400/500)
- Applied in `layout.tsx` as CSS variables; used in `tokens.css`

### Step 4: UI primitives
- `Button` (primary, secondary, ghost; loading state; keyboard)
- `SkipLink` (skip to main content)
- `SectionLabel` (eyebrow/label typography)
- `RichText` (renders block content; just `<p>` tags in this scope)

### Step 5: Resort shell
- `ResortHeader`: logo, nav links (Stay, Amenities, Contact), phone CTA, "Enquire Now" primary button, mobile hamburger (HTML-first, aria-expanded, no JS required)
- `ResortFooter`: property name, address, phone, email (mailto:), copyright, WhatsApp link
- `layout.tsx`: fonts, metadata defaults, `<SkipLink>`, `<ResortHeader>`, `<ResortFooter>`, viewport meta

### Step 6: Local content layer
- `src/content/rooms.ts`: Typed room data objects (confirmed content only; uncertain fields marked)
- `src/content/amenities.ts`: Amenity data from legacy site
- `src/content/site.ts`: Property identity (name, phone, email, address, WhatsApp)
- `src/types/content.ts`: `Room`, `Amenity`, `SiteConfig` TypeScript types

### Step 7: Homepage `/`
- Hero: full-bleed pool image (`pics/WhatsApp Image 2022-03-01 at 9.52.45 PM.jpeg`), `next/image` optimized, headline, "Explore our villas" CTA
- Room preview: 3 cards using local content data
- Amenities strip: icon + label highlight (6 key facilities)
- Enquiry CTA section: call to action with WhatsApp link + "Enquire" button
- JSON-LD LodgingBusiness schema

### Step 8: Rooms listing `/stay`
- Grid of 3 `RoomCard` components from local content
- Each card: image (optimized), room name, capacity, 2-line description, "View details" link

### Step 9: Room detail `/stay/1-bedroom-villa`
- Hero image (DSCN2468.JPG, optimized)
- Single `<h1>`: "1 Bedroom Villa" *(Owner confirmation needed for canonical name)*
- Capacity facts grid (4 guests, 1 bed, 1 bath)
- Room description (corrected prose from legacy — typos fixed)
- Amenities relevant to this villa
- "Enquire about this villa" CTA (links to `/contact?room=1-bedroom-villa`)
- WhatsApp fallback link
- Back to `/stay` link
- `generateMetadata()` with per-room SEO

### Step 10: Enquiry form `/contact`
- Name, email, phone (optional), room interest (dropdown from content), message, preferred check-in / check-out (date inputs, optional)
- Client-side validation (HTML5 required + React error states)
- On submit: `fetch('/api/enquiry')` → stub API route logs to console and returns success — **no email delivery, no CMS write**
- Success state: confirmation message with WhatsApp link as secondary path
- Clear note in code: "Email delivery deferred — connect Resend in Phase 4"

### Step 11: Booking adapter stub
- `src/integrations/booking/adapter.ts`: Provider-neutral `BookingProvider` interface
- `src/integrations/booking/stub.ts`: Stub implementation that throws "Booking provider not configured"
- `BookingCTA` component uses adapter; shows "Enquire Now" fallback when no provider is configured
- Clearly commented: "Replace this stub with BookingJini or eZee adapter in Phase 4"

### Step 12: SEO and redirects
- `robots.ts`, `sitemap.ts` (static routes only in this scope)
- `generateMetadata()` helper in `lib/seo.ts`
- Open Graph tags, canonical, `<link rel="icon">`
- Legacy redirects in `next.config.ts`

### Step 13: Build verification and accessibility check
- `npm run build` — zero errors, zero type errors
- Manual keyboard navigation test on homepage and room detail
- Check heading hierarchy (single H1 per page)
- Check focus visibility
- Check `prefers-reduced-motion` disables animations
- Check mobile layout at 320px, 768px

---

## Asset Strategy for This Scope

| Image | Usage | Treatment |
|---|---|---|
| `pics/WhatsApp Image 2022-03-01 at 9.52.45 PM.jpeg` | Hero (aerial pool) | `next/image`, priority, optimized |
| `pics/4bhk.jpeg` | 5BHK card (noted as swapped — content warning in code) | `next/image`, lazy |
| `pics/5bhk.jpeg` | 4BHK card (noted as swapped) | `next/image`, lazy |
| `pics/DSCN2468.JPG` | 1BHK hero image | `next/image`, priority on detail page |
| `pics/Bedroom.jpg` | Gallery only — text overlay flagged | `next/image`, lazy, alt text explains overlay |
| `pics/Living room.jpg` | Gallery only — watermark flagged | `next/image`, lazy, alt text explains context |
| `pics/380369512.jpg` | Bathroom gallery | `next/image`, lazy |
| `vid/WhatsApp Video 2025-02-27...mp4` | Video section (poster still needed) | `<video>` with `muted`, `playsinline`, poster from pool image |

All images served from `/pics/` relative path (legacy path preserved). `next/image` handles optimization. No images moved or deleted.

---

## Definition of Done

- [ ] `npm run build` exits 0 — no TS errors, no lint errors
- [ ] Single H1 per page, correct heading hierarchy
- [ ] All images have descriptive alt text (no empty `alt=""` except decorative)
- [ ] All interactive elements keyboard-accessible with visible focus ring
- [ ] `prefers-reduced-motion` disables all Framer Motion animations
- [ ] Responsive layout at 320px, 768px, 1280px
- [ ] No hardcoded secrets, API keys, or provider credentials anywhere
- [ ] `/contact` form submits and shows success/error state without CMS or email
- [ ] Booking CTA shows "Enquire Now" (not a live booking engine)
- [ ] Legacy files at workspace root: unmodified (verified by `git diff`)
- [ ] Unresolved content clearly marked with `[OWNER APPROVAL NEEDED]` comments in code
- [ ] `audit/phase-3-implementation-plan.md` is the only file modified outside `modern/` and `audit/`

---

## Unresolved Before This Scope Can Be Fully Approved

| Item | Status |
|---|---|
| Canonical room names | ❓ Marked in content; owner must confirm |
| Image-room swap (4bhk.jpeg / 5bhk.jpeg) | ❓ Documented; using as found; owner must correct the mapping |
| Starting rate / "from" price display | ❓ Not added (no confirmed rates) |
| Logo replacement | ❓ Current logo used; flagged |
| Social media links | ❓ Not added (none found in legacy) |
| Professional photography | ❓ Legacy images used; flagged for replacement |
