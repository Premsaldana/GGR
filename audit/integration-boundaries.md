# Integration Boundaries

**Status**: Proposed — Phase 2 architecture document  
**Architecture**: Next.js 14+ (App Router) + Sanity CMS + Booking Engine (BookingJini/eZee) + Razorpay (if needed)

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        GUEST (BROWSER)                          │
│                                                                 │
│  ┌────────────────┐    ┌───────────────────────────────────┐   │
│  │ Next.js Public │    │   Booking Engine Hosted Checkout  │   │
│  │ Frontend (SSG) │───▶│   (BookingJini / eZee widget      │   │
│  └────────┬───────┘    │    or redirect to their domain)   │   │
│           │            └──────────────┬────────────────────┘   │
└───────────┼──────────────────────────┼─────────────────────────┘
            │                          │
            │ Server reads             │ Webhooks (POST)
            ▼                          ▼
    ┌───────────────┐       ┌──────────────────────┐
    │  Sanity CMS   │       │  Next.js API Routes  │
    │  (content     │       │  /api/enquiry         │
    │   source of   │◀──────│  /api/booking-webhook │
    │   truth for   │ ISR   │  /api/revalidate      │
    │   marketing   │ trigger└─────────┬────────────┘
    │   content)    │                  │
    └───────────────┘                  │ Email delivery
                                       ▼
                               ┌───────────────┐
                               │  Resend / SG  │
                               │  (email only) │
                               └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BOOKING ENGINE (EXTERNAL)                    │
│                                                                 │
│  Source of truth for: availability, rates, reservations,        │
│  cancellations, payment state, guest booking data               │
│                                                                 │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐ │
│  │ Room Inventory │   │ Rate Calendar  │   │ Payment        │ │
│  │ (BHK types)    │   │ (seasonal)     │   │ Processing     │ │
│  └────────────────┘   └────────────────┘   └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Boundary 1: Frontend → CMS Content Reads

**Direction**: Next.js server-side (build time + ISR) → Sanity CDN API

**Source of truth**: Sanity for all marketing content (rooms, amenities, offers, gallery, FAQs, policies, site settings)

**Integration method**:
- GROQ queries from `lib/sanity/queries.ts` using the `@sanity/client` package
- Executed at build time (SSG) or on ISR revalidation trigger
- Read-only API token (`SANITY_API_TOKEN`) stored in Vercel environment variables; never exposed to browser
- Public content also readable via Sanity's CDN endpoint (no auth for published content)

**Caching**: Next.js `fetch()` with Sanity's CDN; ISR `revalidate` time set per page type:
- Rooms: `revalidate: 60` seconds (fast for rate/availability display changes)
- Gallery: `revalidate: 3600` (slow-changing)
- Site settings: `revalidate: 300`

**Failure behavior**:
- If Sanity CDN is unavailable at build time: build fails; old cached static pages remain live (no guest impact)
- If Sanity CDN is unavailable at ISR time: Next.js serves the last successfully generated version; guest still sees content (potentially stale by minutes)
- Stale content risk: Maximum staleness = `revalidate` interval; acceptable for marketing content

---

## Boundary 2: Admin Authentication and Authorization

**Direction**: Staff browser → Sanity Studio (Sanity-hosted)

**Integration**: Sanity's managed identity system with role-based access (Admin, Content Editor, Operations roles as defined in `cms-admin-plan.md`)

**Method**: Google OAuth via Sanity's CORS-controlled Studio login; no custom auth code required

**Admin-only fields**: `bookingEnginePropertyId`, `bookingEngineRoomCode`, coupon codes — these fields are rendered only for Admin role in Sanity Studio's desk structure

**Draft preview authentication**: Next.js `draftMode()` route handler protected by a shared secret token in Vercel environment variables; preview URL not publicly indexed

**Failure behavior**:
- If Sanity Studio is unavailable: staff cannot update content; live site continues serving last published static content without interruption
- If Google OAuth is down: staff cannot log into Studio; live site unaffected

---

## Boundary 3: Booking Engine Widget / Hosted Checkout

**Direction**: Guest browser → Booking Engine (BookingJini / eZee)

**Integration method**: One of:
1. **Embedded widget** (preferred): A JavaScript snippet provided by the booking engine mounts an iframe or overlay widget on the resort's domain. Guest selects dates, room type, and proceeds to checkout within the widget. The custom site never sees raw card data.
2. **Redirect to hosted checkout**: A booking CTA button on the room detail page links to the booking engine's hosted checkout URL with a pre-filled property ID and room code. Guest is redirected to the engine's domain to complete the booking.

**Custom site's role**: 
- `BookingWidget.tsx` is a React client component that mounts the booking engine's embed script
- `BookingCTA.tsx` is a button/link component that generates the correct URL with property ID and room code from `SiteSetting` and `Room.bookingEngineRoomCode`
- These are thin adapters — they call the booking engine's API/widget; no reservation logic exists in the custom codebase

**Source of truth**: The booking engine owns 100% of: availability calendar, current rates, reservation records, guest payment data, cancellations, and booking confirmations. Do not duplicate this data.

**Failure behavior**:
- If booking engine is down: the CTA button/link is still rendered; clicking it leads to the engine's error page (outside the resort's control); the resort's marketing pages continue to function
- Design mitigation: Always show a fallback contact option (WhatsApp link, phone number, enquiry form) near every booking CTA so guests can reach the property if the booking engine is unavailable

---

## Boundary 4: Payment Provider

**Direction**: Guest browser → Payment provider (through booking engine or standalone)

**Primary path**: Booking engine's integrated payment processing handles the full checkout. The custom site never touches payment flows.

**Fallback path (if booking engine requires external gateway)**:
- Razorpay Checkout.js loaded client-side
- Payment order created server-side via `/api/payment/create-order` (never in a client component)
- Razorpay's hosted fields handle card entry (no raw card data in custom code)
- Payment result verified server-side via Razorpay signature verification

**Rule**: Raw card numbers, CVV, or cardholder data must never appear in a custom frontend component, API route log, Sanity document, or Git commit.

**Source of truth for payment state**: The booking engine (preferred) or Razorpay dashboard. Not the custom CMS.

**Failure behavior**:
- If payment fails: Razorpay/booking engine returns an error to the guest and shows a retry/alternative flow
- Custom site does not own refund or dispute processing

---

## Boundary 5: Webhooks and Idempotency

**Direction**: Booking engine / Payment provider → Next.js `/api/booking-webhook`

**Purpose**: Receive booking confirmation, cancellation, or payment events to:
1. Log a summary to Sanity `AuditEvent` (no personal guest data in the log body)
2. Optionally trigger a notification email to the resort
3. Optionally trigger ISR revalidation if availability status affects a page

**Security**:
- Webhook endpoint validates the HMAC signature using `BOOKING_WEBHOOK_SECRET` (server-side env var)
- Requests that fail signature verification return `401` immediately
- No secrets are logged

**Idempotency**:
- All webhook handlers check for a unique event ID before processing
- If the same event ID has already been processed (stored in a KV store or Sanity audit event), return `200` immediately without re-processing
- This prevents duplicate notifications if the booking engine retries a failed delivery

**Failure behavior**:
- If the webhook endpoint is down: the booking engine retries according to its retry policy (confirm retry count with provider)
- If Sanity is down during webhook processing: log the event to Vercel's structured logging; attempt Sanity write on next webhook receipt
- Booking state is still authoritative at the engine; the webhook is a notification only

---

## Boundary 6: Enquiry Email and CRM Delivery

**Direction**: Guest browser → `/api/enquiry` → Resend → Resort email inbox

**Integration**:
- `EnquiryForm.tsx` (client component) submits to `/api/enquiry` via `fetch()` POST
- `/api/enquiry` validates input with Zod, rate-limits by hashed IP, saves to Sanity `Enquiry` document, then sends email via Resend API
- Resend API key is server-side only (`RESEND_API_KEY` in Vercel env vars)
- Email is delivered to `ENQUIRY_TO_EMAIL` (resort's Gmail address)
- Form receives a success/failure response and shows inline confirmation to guest

**No CRM currently planned**: Enquiries go directly to the resort's email. If CRM integration (HubSpot, Zoho, etc.) is added later, it is added at the `/api/enquiry` boundary, not in the frontend.

**Rate limiting**: `/api/enquiry` limits to 3 submissions per hashed IP per 10 minutes to prevent spam.

**Failure behavior**:
- If Resend is down: Sanity `Enquiry` document is still saved; delivery status set to `failed`; an alerting mechanism (Vercel log alert) notifies the admin to manually check and respond
- If Sanity write fails: email is still sent; document may be missing (acceptable — email is primary delivery)
- If both fail: guest sees an error message with a fallback WhatsApp link and phone number

---

## Boundary 7: Analytics and Consent

**Direction**: Guest browser → Analytics provider (GA4 or Plausible)

**Integration**:
- Analytics script loaded in `layout.tsx`
- If GA4: requires cookie consent banner before loading (GDPR/India privacy practices); `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- If Plausible: no cookies; no consent banner needed; can load unconditionally
- Booking CTA clicks tracked as analytics events via a wrapper in `BookingCTA.tsx`
- Enquiry form submissions tracked as events in `EnquiryForm.tsx` (success event only; no form content in event data)

**Consent**: If GA4 is chosen, a cookie consent component must be implemented before Phase 3. It must block analytics script loading until consent is given. It must honor `prefers-do-not-track` signals.

**Failure behavior**:
- If analytics script fails: pages continue to function; only tracking is lost

---

## Boundary 8: Media Storage and Image Optimization

**Direction**: Sanity image CDN → Guest browser (via Next.js `next/image` with Sanity URL builder)

**Integration**:
- Images are uploaded by staff to Sanity's asset store
- `lib/sanity/image.ts` builds Sanity image URLs with `width`, `height`, `format=webp`, `quality`, `crop`, and `fit` parameters
- `MediaImage.tsx` wraps `next/image` with the Sanity URL builder; automatically generates responsive `srcset`
- Vercel Image Optimization handles additional caching and format conversion at the CDN edge
- No images are stored in Git (legacy images will remain at their paths but new images go through Sanity)

**Failure behavior**:
- If Sanity CDN is down: images return 404; `<img>` fallback `alt` text is shown (this is why alt text is required on every image in the schema)
- Mitigation: Vercel's CDN caches images at the edge; a Sanity CDN outage would need to be sustained for long periods to cause visible degradation

---

## Boundary 9: Unicorn Studio Visual Enhancement (Optional)

**Direction**: Guest browser → Unicorn Studio runtime (external JS/WebGL)

**Integration** (as defined in planning docs):
- `AtmosphereScene.tsx` renders a static fallback image first (from Sanity)
- After first meaningful render, `integrations/unicorn/client.ts` is lazy-loaded if: WebGL is available + `prefers-reduced-motion` is false + connection is not save-data
- The Unicorn Studio scene is `aria-hidden` and decorative; all content, CTAs, and navigation exist in standard HTML beneath it
- Maximum one or two scenes per site

**Failure behavior**:
- If Unicorn runtime fails to load: fallback image is shown; no error is visible to guests; a non-fatal analytics event is recorded
- If WebGL is unavailable (e.g., mobile browser, accessibility settings): fallback image is shown
- If `prefers-reduced-motion` is set: fallback image only, no animation

---

## Source-of-Truth Reference Table

| Domain | Source of Truth | Custom Site's Role |
|---|---|---|
| Room marketing content (description, photos, highlights) | Sanity CMS | Read and render |
| Room availability | Booking engine | Display via widget; do not duplicate |
| Room rates (current, live) | Booking engine | Display via widget; do not duplicate |
| Starting rate display (marketing) | Sanity CMS (`startingRate` field) | Render as "from" display only |
| Reservations and guest booking records | Booking engine | Receive webhook notification only |
| Payment state | Booking engine or payment gateway | Receive webhook notification only |
| Cancellation records | Booking engine | Receive webhook notification only |
| Guest personal data (name, card, passport) | Booking engine | Never stored in custom system |
| Enquiry submissions | Sanity (log) + Email (delivery) | Create and store |
| Offers / promotions (content) | Sanity CMS | Read and render |
| Promo codes | Booking engine | Stored in Sanity admin-only field for reference; applied in engine |
| Analytics events | GA4 or Plausible | Send from frontend |
| Media assets | Sanity asset store + CDN | Upload and serve |
| Site configuration (property name, phone, address) | Sanity SiteSetting singleton | Read and render |
| Structured data (JSON-LD) | Generated from Sanity content | Render in `<head>` |
