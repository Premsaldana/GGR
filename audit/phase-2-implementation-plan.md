# Phase 2 — Implementation Plan

**Status**: Proposed — awaiting owner approval before any code is written  
**Architecture**: Next.js 14+ (App Router, SSG/ISR) + Sanity CMS + External Booking Engine  
**Branch**: Work will begin on `brownfield-branch`; legacy files remain untouched at workspace root  
**No legacy application files are modified until the new site passes the launch checklist**

---

## Smallest Safe Implementation Slice

The first implementation slice (Phase 3) delivers exactly one complete vertical slice:

> **"A guest can discover the 1 Bedroom Villa, read its details, and tap a booking CTA that connects to the booking engine's sandbox checkout — all on a responsive, accessible, SEO-ready page that reads its content from the CMS."**

This slice is the proof-of-concept for the entire migration. It exercises every integration boundary and reveals actual integration difficulty before broader route migration.

---

## Slice Definition

### What is included

| Component | Details |
|---|---|
| **Repository and environment setup** | `.gitignore`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example` |
| **Sanity project** | Created, dataset configured, schema for `Room`, `Amenity`, `SiteSetting`, `seoFields`, `imageWithMeta` |
| **1 Room seeded** | "1 Bedroom Villa" document created in Sanity with real content from `content-inventory.md`, correct images, alt text, amenities, capacity |
| **Design token foundation** | `tokens.css` with color, type, spacing, radius, motion custom properties based on the design brief |
| **Accessible primitives** | `Button`, `MediaImage`, `SkipLink` as UI primitives |
| **Resort shell** | `ResortHeader` (logo, nav, WhatsApp CTA, booking CTA), `ResortFooter` (address, phone, email) |
| **`/stay/1-bedroom-villa` page** | Room detail page: hero image, heading (single H1), description, amenities grid, capacity facts, gallery, booking CTA, enquiry fallback, JSON-LD LodgingBusiness schema |
| **Booking CTA** | Connected to booking engine sandbox; clearly marked as sandbox in development |
| **`/stay` page (listing)** | Rooms listing with 1 card (expandable later) |
| **Enquiry form stub** | `/contact` page with `EnquiryForm.tsx` → `/api/enquiry` → Resend (sandbox) → success/error state |
| **`/` homepage (minimal)** | Property name, hero image from Sanity, 3-room summary cards, booking CTA — enough to test the shell |
| **SEO metadata** | `<title>`, `<meta description>`, `<link rel="canonical">`, Open Graph tags, `<link rel="icon">` on all pages |
| **JSON-LD structured data** | `LodgingBusiness` schema on homepage; `LodgingBusiness` + `Room` schema on room detail |
| **Responsive behavior** | Mobile (320px), tablet (768px), desktop (1280px) — all three verified |
| **Accessibility** | Single H1 per page, skip-to-content, ARIA landmarks, keyboard-navigable nav and form, `prefers-reduced-motion` respected |
| **`robots.ts` and `sitemap.ts`** | Generated from Next.js conventions |
| **Redirect rules** | `/index.html` → `/`, `/test.html` → `/stay`, `/index.html#accommodations` → `/stay` in `next.config.ts` |
| **Admin role** | Sanity Admin account (owner) created and tested |
| **Draft/publish workflow** | 1 Room document tested through full draft → preview → publish → ISR revalidation cycle |

### What is explicitly NOT included in this slice

| Item | Reason |
|---|---|
| Unicorn Studio integration | Added in Phase 4 after static version is approved |
| 21st.dev component patterns | Added in Phase 4 during design polish |
| Remaining 2 room types (4BHK, 5BHK) | Migrated in Phase 4 after 1BHK slice is approved |
| Offers, Experiences, Dining, Gallery, Location, About pages | Phase 5 |
| Payment gateway live activation | Not activated in production; sandbox only |
| Live analytics | Configured but not activated in production until consent banner is implemented |
| Staff CMS training | After the slice is approved |
| Production DNS cutover | After the full site passes the launch checklist |

---

## Implementation Sequence (Phase 3)

### Step 1: Repository and environment setup (~2 hours)

- [ ] Create `.gitignore` (node_modules, .next, .env*, .vercel, *.DS_Store)
- [ ] Initialize Next.js project: `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir` (confirm flags with `--help` first)
- [ ] Verify the install outputs no errors
- [ ] Add `.env.example` with all variable names (no values) documented
- [ ] Create `.env.local` with development values (gitignored)
- [ ] Commit: "Phase 3: Next.js scaffold + environment setup"

### Step 2: Sanity project setup (~1 hour)

- [ ] Create Sanity project at sanity.io
- [ ] Run `npm create sanity@latest -- --project [projectId] --dataset production --typescript`
- [ ] Create initial schemas: `room.ts`, `amenity.ts`, `site-setting.ts`, `seo-fields.ts`, `image-with-meta.ts`
- [ ] Configure Sanity Studio desk structure
- [ ] Add admin account for owner
- [ ] Seed: Create `SiteSetting` document with property name, phone, email, address, WhatsApp number
- [ ] Seed: Create 3 `Amenity` documents (Swimming Pool, Free WiFi, Garden)
- [ ] Seed: Create "1 Bedroom Villa" `Room` document with real content, images uploaded to Sanity, alt text required
- [ ] Verify Sanity CDN returns the room document via GROQ query
- [ ] Commit: "Phase 3: Sanity schema and initial seed data"

### Step 3: Design token foundation (~2 hours)

- [ ] Create `src/design-system/tokens.css` with CSS custom properties:
  - Colors: warm mineral base, deep botanical accent, terracotta/brass highlight, neutrals, success/error states
  - Typography: scale (hero, heading, subheading, body, caption, eyebrow), font families (display serif + neutral sans)
  - Spacing: 4px base grid
  - Radius: subtle (2px), card (4px), button (6px)
  - Motion: duration (short: 150ms, medium: 300ms), easing (ease-in-out), reduced-motion breakpoint
  - Focus: visible focus ring color and width
- [ ] Create `src/design-system/motion.ts` with Framer Motion variant presets
- [ ] Import `tokens.css` in `layout.tsx`
- [ ] Commit: "Phase 3: Design token foundation"

### Step 4: Sanity integration library (~1 hour)

- [ ] Create `src/lib/sanity/client.ts`
- [ ] Create `src/lib/sanity/image.ts` (URL builder using `@sanity/image-url`)
- [ ] Create `src/lib/sanity/queries.ts` with GROQ queries for `getRoom(slug)` and `getAllRooms()`
- [ ] Create `src/types/cms.ts` with `Room`, `Amenity`, `SiteSettings` TypeScript types
- [ ] Test: Run query in dev server and verify room data returns correctly
- [ ] Commit: "Phase 3: Sanity client and GROQ queries"

### Step 5: UI primitives (~1 hour)

- [ ] `src/components/ui/Button.tsx` — primary, secondary, ghost variants; keyboard-accessible; loading state
- [ ] `src/components/ui/MediaImage.tsx` — `next/image` wrapper with Sanity URL builder; required alt prop
- [ ] `src/components/ui/SkipLink.tsx` — skip-to-main-content accessibility link
- [ ] Write a basic test for `Button` (renders correct element, handles click, shows loading state)
- [ ] Commit: "Phase 3: UI primitives (Button, MediaImage, SkipLink)"

### Step 6: Resort shell — header and footer (~2 hours)

- [ ] `src/components/resort/ResortHeader.tsx`:
  - Logo (from Sanity SiteSettings or static while CMS is being set up)
  - Nav links: Stay, Offers, Experiences, Gallery, Contact
  - WhatsApp floating CTA button (accessible, labeled "Chat on WhatsApp")
  - "Book Now" primary CTA button
  - Mobile hamburger (CSS-driven, not JS-only; `<details>/<summary>` or `aria-expanded` pattern)
- [ ] `src/components/resort/ResortFooter.tsx`:
  - Property name, address, phone, email (from Sanity SiteSettings)
  - Copyright
  - Legal links (privacy, cancellation — stubs)
- [ ] `src/app/layout.tsx`: fonts (Google Fonts via `next/font`), metadata defaults, `SkipLink`, `ResortHeader`, `ResortFooter`
- [ ] Commit: "Phase 3: Resort header and footer shell"

### Step 7: Room detail page `/stay/1-bedroom-villa` (~4 hours)

- [ ] `src/app/stay/[slug]/page.tsx`:
  - `generateStaticParams()` → returns all room slugs from Sanity
  - `generateMetadata()` → `seoTitle`, `seoDescription`, OG image, canonical URL
  - Fetches room by slug from Sanity
  - Returns `notFound()` if slug not in dataset
- [ ] `src/components/resort/RoomDetail.tsx`:
  - Hero image (MediaImage, `priority: true`, correct `alt`)
  - Single `<h1>` with room name
  - Capacity facts (adults, children, bedrooms, bathrooms)
  - Short description (eyebrow / lede)
  - Amenities grid (icon + label)
  - Long description (rich text from Sanity block content)
  - Gallery (grid of MediaImage with `loading="lazy"`)
  - Booking CTA section
  - Enquiry fallback (link to `/contact` with room pre-filled)
- [ ] `src/components/resort/BookingCTA.tsx`:
  - Shows "Check Availability" button
  - In development: links to booking engine sandbox with property ID + room code from Sanity
  - Includes a visible "⚠ Sandbox mode" label in development builds
  - In production: connects to live booking engine widget or redirect URL
- [ ] `src/lib/schema.ts` → `buildLodgingBusinessSchema()` and `buildRoomSchema()` for JSON-LD
- [ ] Add `<script type="application/ld+json">` to room detail page
- [ ] Responsive: verify layout at 320px, 768px, 1280px in browser dev tools
- [ ] Accessibility: Run axe-core; check heading hierarchy; check keyboard tab order; check focus visible; check ARIA
- [ ] Commit: "Phase 3: Room detail page for 1 Bedroom Villa"

### Step 8: Rooms listing `/stay` (~1 hour)

- [ ] `src/app/stay/page.tsx`: Fetches all rooms from Sanity; renders `RoomCard` list
- [ ] `src/components/resort/RoomCard.tsx`: Hero image, name, short description, capacity, highlights, "View Details" link
- [ ] `generateMetadata()` for `/stay`
- [ ] Commit: "Phase 3: Rooms listing page"

### Step 9: Homepage `/` (~2 hours)

- [ ] `src/app/page.tsx`: Hero section (property name, tagline, booking CTA, hero image from Sanity), 3-room card preview (from `/stay`), brief amenities highlights, enquiry link, WhatsApp CTA
- [ ] JSON-LD LodgingBusiness schema
- [ ] `generateMetadata()` for homepage
- [ ] Commit: "Phase 3: Homepage (minimal vertical slice)"

### Step 10: Enquiry form and API route (~2 hours)

- [ ] `src/app/contact/page.tsx`: Contact page with `EnquiryForm`
- [ ] `src/components/resort/EnquiryForm.tsx`: Name, email, phone (optional), room interest (dropdown), check-in/out dates (optional), message; client-side validation with error states; loading and success states
- [ ] `src/app/api/enquiry/route.ts`: Zod validation; rate limiting; Sanity document creation; Resend email delivery; structured response
- [ ] Test: Submit form in development; verify email delivery via Resend sandbox; verify Sanity enquiry document created
- [ ] Commit: "Phase 3: Enquiry form and API route"

### Step 11: SEO infrastructure (~1 hour)

- [ ] `src/app/robots.ts`: Disallow `/api/`, allow everything else
- [ ] `src/app/sitemap.ts`: Dynamic sitemap from Sanity (all published room slugs, all published offer slugs, static pages)
- [ ] `src/lib/seo.ts`: `generateMetadata()` helper function (title template, description, OG, canonical, noIndex guard)
- [ ] Verify `sitemap.xml` renders correctly at `/sitemap.xml`
- [ ] Commit: "Phase 3: SEO infrastructure (robots, sitemap, metadata helper)"

### Step 12: Redirect rules (~30 minutes)

- [ ] `next.config.ts` `redirects()`: `/index.html` → `/`, `/test.html` → `/stay`, `/index.html#accommodations` → `/stay`
- [ ] Test: Verify all redirects return 301 in dev
- [ ] Commit: "Phase 3: Legacy redirect rules"

### Step 13: ISR revalidation webhook (~1 hour)

- [ ] `src/app/api/revalidate/route.ts`: Accept POST with Sanity webhook; verify HMAC; call `revalidatePath()` for the affected document type's routes
- [ ] Configure Sanity webhook in Sanity dashboard to POST to `/api/revalidate` on publish/unpublish
- [ ] Test: Publish a change to the Room document in Sanity Studio; verify the room detail page re-generates within seconds
- [ ] Commit: "Phase 3: Sanity ISR revalidation webhook"

### Step 14: Admin draft/publish workflow test (~1 hour)

- [ ] Test: With admin account, create a draft Room update → preview URL shows draft → publish → live site revalidates
- [ ] Test: With editor account (if created), verify admin-only fields are hidden in Studio
- [ ] Document any schema adjustments needed
- [ ] Commit: "Phase 3: Admin workflow verified"

---

## Payment Documentation (Not Activated in Production)

Payment is documented but not activated in this slice:

```
// src/integrations/booking/adapter.ts
// PAYMENT RESPONSIBILITY NOTE (Phase 3):
// Payment processing is handled by the booking engine (BookingJini / eZee).
// The booking engine's hosted checkout collects payment from guests.
// No payment gateway code is initialized in this slice.
//
// If the booking engine's integrated payment does not support India UPI/cards:
// - Razorpay is the recommended gateway (see audit/payment-provider-comparison.md)
// - KYC onboarding must be completed before activating live payments
// - Payment order creation must occur server-side (never in a client component)
// - Raw card data must never be logged or stored
//
// Activation requires: Owner confirmation + booking engine payment assessment complete
```

---

## Tests

| Test | Command | Target |
|---|---|---|
| Unit: Button renders correctly | `npm test -- Button` | Renders, handles click, shows loading |
| Unit: EnquiryForm validation | `npm test -- EnquiryForm` | Required fields, error messages |
| Unit: buildLodgingBusinessSchema | `npm test -- schema` | Correct JSON-LD shape |
| Integration: `/api/enquiry` | `npm test -- enquiry` | Validates input, rate-limits, returns 200/400 |
| Integration: `/api/revalidate` | `npm test -- revalidate` | Verifies HMAC, calls revalidatePath |
| E2E: Room detail → booking CTA click | Playwright | Page loads, CTA visible, redirect to sandbox |
| E2E: Contact form submission | Playwright | Form submits, success state shown |
| E2E: Mobile nav opens and closes | Playwright | Keyboard accessible, focus trap |
| Accessibility: axe-core | `npm run a11y` | Zero critical violations on room detail and homepage |
| Lighthouse | `npm run lighthouse` | Performance ≥90, SEO ≥95, A11y ≥95 on room detail |

---

## Rollback Strategy

At any point during Phase 3, the legacy site can be restored by:
1. Not changing the DNS (the legacy site is still at its hosting location)
2. If a new domain was pointing to Vercel: update DNS to point back to the legacy hosting
3. Git: legacy files remain at commit `9f20b46` — checkout and re-deploy to legacy host

**Feature flag approach**: During development, the new site lives on a Vercel preview URL (e.g., `https://ggr-xyz.vercel.app`). The legacy site continues on its current host (or unchanged at the repo root). The production domain is not pointed to Vercel until the new site passes the full launch checklist.

---

## Definition of Done for This Slice

The slice is complete when all of the following are true:

- [ ] `/stay/1-bedroom-villa` renders with real content from Sanity (no hardcoded copy)
- [ ] Booking CTA connects to booking engine sandbox (or clearly-marked placeholder link)
- [ ] Enquiry form successfully delivers an email to the resort's inbox in staging
- [ ] Sanity `Enquiry` document is created on form submission
- [ ] Admin can publish a Room update and see it live within 60 seconds via ISR
- [ ] Single H1 per page; correct heading hierarchy
- [ ] All images have descriptive alt text
- [ ] All interactive elements are keyboard-accessible with visible focus
- [ ] `axe-core` reports zero critical accessibility violations
- [ ] Lighthouse SEO score ≥ 95 on room detail page
- [ ] Lighthouse Performance score ≥ 85 on room detail page
- [ ] No secrets appear in browser network requests, source code, or Git commits
- [ ] `robots.txt` and `sitemap.xml` are accessible and correct
- [ ] All legacy redirect rules return 301
- [ ] Responsive layout verified at 320px, 768px, 1280px
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Payment activation is documented but not active in production

---

## Owner Approval Required Before Phase 3 Begins

**The following must be decided and confirmed before any implementation code is written:**

| Decision | Required For |
|---|---|
| Booking engine selection (BookingJini vs. eZee) | Widget embed code, sandbox environment, room code mapping |
| Canonical property name ("South Goa Garden Villa" confirmed?) | Title, heading, metadata, structured data |
| Correct room naming (1 Bedroom Villa / 4 Bedroom Villa / 5 Bedroom Villa with Private Pool?) | Slugs, content model, redirect rules |
| Custom domain name | Canonical URL, sitemap, Open Graph, Google Search Console |
| Google Analytics 4 vs. Plausible | Consent banner requirement |
| Image replacement plan (watermarked / text-overlay images flagged in content-inventory.md) | Hero images for room detail pages |
| Staff Google accounts for Sanity login | CMS setup |
