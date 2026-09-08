# Target Structure

**Architecture**: Next.js 14+ (App Router) + Sanity CMS + Booking Engine Adapter  
**Language**: TypeScript throughout  
**Status**: Proposed — Phase 3 implementation target

---

## Repository Layout

```
c:\GGR\                              ← workspace root (legacy files preserved here)
├── legacy/                          ← OPTIONAL: move legacy files here for clarity
│   ├── index.html                   ← original preserved
│   ├── styles.css
│   ├── script.js
│   ├── test.html
│   ├── pics/
│   └── vid/
│
├── src/                             ← new Next.js application
│   ├── app/                         ← Next.js App Router
│   │   ├── layout.tsx               ← root layout (metadata, fonts, analytics, cookie consent)
│   │   ├── page.tsx                 ← homepage (/)
│   │   ├── not-found.tsx            ← custom 404 page
│   │   ├── error.tsx                ← global error boundary
│   │   ├── robots.ts                ← generated robots.txt
│   │   ├── sitemap.ts               ← generated sitemap.xml
│   │   │
│   │   ├── stay/                    ← /stay (rooms listing)
│   │   │   ├── page.tsx
│   │   │   └── [slug]/              ← /stay/1-bedroom-villa, /stay/4-bedroom-villa, etc.
│   │   │       └── page.tsx
│   │   │
│   │   ├── offers/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   │
│   │   ├── experiences/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   │
│   │   ├── dining/
│   │   │   └── page.tsx
│   │   │
│   │   ├── gallery/
│   │   │   └── page.tsx
│   │   │
│   │   ├── location/
│   │   │   └── page.tsx
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx
│   │   │
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   │
│   │   ├── legal/
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── cancellation/page.tsx
│   │   │
│   │   └── api/                     ← API routes (server-side only)
│   │       ├── enquiry/route.ts     ← POST: validate + email + Sanity log
│   │       ├── booking-webhook/route.ts ← POST: receive booking engine events
│   │       └── revalidate/route.ts  ← POST: Sanity → ISR revalidation trigger
│   │
│   ├── components/
│   │   ├── ui/                      ← shadcn/ui-based primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Carousel.tsx         ← accessible slider (replaces legacy slider)
│   │   │   ├── MediaImage.tsx       ← next/image wrapper with Sanity URL builder
│   │   │   └── SkipLink.tsx         ← accessibility: skip-to-main-content
│   │   │
│   │   ├── resort/                  ← domain components
│   │   │   ├── ResortHeader.tsx     ← nav, logo, WhatsApp CTA, booking CTA
│   │   │   ├── ResortFooter.tsx     ← address, phone, email, social, legal links
│   │   │   ├── ResortHero.tsx       ← hero section (image + headline + CTA)
│   │   │   ├── RoomCard.tsx         ← listing card for /stay
│   │   │   ├── RoomDetail.tsx       ← full room detail with booking CTA
│   │   │   ├── BookingCTA.tsx       ← booking button/link to engine widget or page
│   │   │   ├── BookingWidget.tsx    ← client component: mounts booking engine widget
│   │   │   ├── EnquiryForm.tsx      ← client component: POST to /api/enquiry
│   │   │   ├── AmenitiesGrid.tsx    ← icon + label amenity blocks
│   │   │   ├── GalleryGrid.tsx      ← masonry/grid image gallery
│   │   │   ├── ExperienceCard.tsx
│   │   │   ├── OfferCard.tsx
│   │   │   ├── WhatsAppWidget.tsx   ← accessible floating WhatsApp button
│   │   │   └── PropertySchema.tsx   ← JSON-LD LodgingBusiness structured data
│   │   │
│   │   └── visual/                  ← Unicorn Studio integration
│   │       ├── AtmosphereScene.tsx  ← wrapper with fallback image + aria-hidden canvas
│   │       └── ShaderFallback.tsx   ← static image fallback
│   │
│   ├── design-system/
│   │   ├── tokens.css               ← CSS custom properties: color, type, spacing, radius, motion
│   │   ├── motion.ts                ← Framer Motion variants with prefers-reduced-motion
│   │   └── component-rules.md       ← accessibility, token, naming conventions
│   │
│   ├── integrations/
│   │   ├── booking/
│   │   │   ├── adapter.ts           ← BookingEngineAdapter interface
│   │   │   ├── bookingjini.ts       ← BookingJini implementation
│   │   │   ├── ezee.ts              ← eZee implementation
│   │   │   └── types.ts             ← BookingHandoffParams, WebhookPayload, etc.
│   │   │
│   │   ├── email/
│   │   │   ├── resend.ts            ← Resend API client (server-side only)
│   │   │   └── templates/
│   │   │       ├── enquiry-confirmation.tsx
│   │   │       └── enquiry-notification.tsx
│   │   │
│   │   ├── analytics/
│   │   │   └── events.ts            ← typed analytics event names
│   │   │
│   │   └── unicorn/
│   │       ├── client.ts            ← runtime mount (client-only, lazy)
│   │       ├── config.ts            ← scene IDs, fallback URLs, quality settings
│   │       └── types.ts
│   │
│   ├── lib/
│   │   ├── sanity/
│   │   │   ├── client.ts            ← Sanity client (server-side reads)
│   │   │   ├── queries.ts           ← GROQ queries per entity type
│   │   │   ├── image.ts             ← Sanity image URL builder
│   │   │   └── types.ts             ← generated types from schema
│   │   │
│   │   ├── seo.ts                   ← generateMetadata helper for all pages
│   │   ├── schema.ts                ← JSON-LD schema builders
│   │   └── validation.ts            ← Zod schemas for API route inputs
│   │
│   └── types/
│       ├── cms.ts                   ← Room, Offer, Experience, etc.
│       └── env.d.ts                 ← typed environment variables
│
├── sanity/                          ← Sanity Studio (separate from Next.js app)
│   ├── sanity.config.ts
│   ├── schemas/
│   │   ├── room.ts
│   │   ├── offer.ts
│   │   ├── experience.ts
│   │   ├── gallery-asset.ts
│   │   ├── amenity.ts
│   │   ├── faq.ts
│   │   ├── policy.ts
│   │   ├── dining-venue.ts
│   │   ├── site-setting.ts
│   │   ├── enquiry.ts               ← incoming enquiry log (read-only for editors)
│   │   └── seo-fields.ts            ← shared SEO field fragment
│   └── desk/
│       └── structure.ts             ← custom Sanity Studio desk layout
│
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── og-default.jpg               ← default Open Graph image
│
├── .env.local                       ← local dev secrets (gitignored)
├── .env.example                     ← safe template (committed)
├── .gitignore                       ← includes node_modules, .env*, .next, .vercel
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── audit/                           ← Phase 1 & 2 audit files (preserved)
```

---

## URL Structure

| Route | Page | Content Source | SSG/ISR |
|---|---|---|---|
| `/` | Homepage | Sanity: SiteSettings, Rooms (3), Offers | SSG + ISR |
| `/stay` | Rooms listing | Sanity: Room[] | SSG + ISR |
| `/stay/1-bedroom-villa` | 1BHK detail + booking CTA | Sanity: Room | SSG + ISR |
| `/stay/4-bedroom-villa` | 4BHK detail + booking CTA | Sanity: Room | SSG + ISR |
| `/stay/5-bedroom-villa-private-pool` | 5BHK detail + booking CTA | Sanity: Room | SSG + ISR |
| `/offers` | Offers listing | Sanity: Offer[] | SSG + ISR |
| `/offers/[slug]` | Offer detail | Sanity: Offer | SSG + ISR |
| `/experiences` | Experiences | Sanity: Experience[] | SSG + ISR |
| `/dining` | Dining | Sanity: DiningVenue | SSG + ISR |
| `/gallery` | Gallery | Sanity: GalleryAsset[] | SSG + ISR |
| `/location` | Location + map | Sanity: SiteSettings | SSG |
| `/about` | About | Sanity: SiteSettings | SSG |
| `/contact` | Contact + enquiry form | Static + API | SSG |
| `/legal/privacy` | Privacy policy | Sanity: Policy | SSG |
| `/legal/terms` | Terms | Sanity: Policy | SSG |
| `/legal/cancellation` | Cancellation policy | Sanity: Policy | SSG |
| `robots.txt` | Crawl rules | Generated | Build-time |
| `sitemap.xml` | URL list | Generated from Sanity | ISR |

---

## Redirect Map (Legacy → New)

| Legacy URL | New URL | Type |
|---|---|---|
| `/index.html` | `/` | 301 Permanent |
| `/index.html#accommodations` | `/stay` | 301 |
| `/index.html#amenities1` | `/#amenities` | 301 |
| `/index.html#contact` | `/contact` | 301 |
| `/test.html` | `/stay` | 301 (orphan; no SEO value to preserve) |

All redirects implemented in `next.config.ts` `redirects()` array.

---

## Environment Variables

| Variable | Usage | Secret? |
|---|---|---|
| `NEXT_PUBLIC_BOOKING_ENGINE_WIDGET_URL` | Booking engine embed script URL | No (public) |
| `NEXT_PUBLIC_BOOKING_ENGINE_PROPERTY_ID` | Property identifier for widget | No (public) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | No (public) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG and sitemap | No |
| `SANITY_PROJECT_ID` | Sanity project | No (public) |
| `SANITY_DATASET` | production / staging | No |
| `SANITY_API_TOKEN` | Server-side read token for ISR | **Yes — server only** |
| `SANITY_WEBHOOK_SECRET` | Verify revalidation webhook | **Yes — server only** |
| `RESEND_API_KEY` | Email delivery | **Yes — server only** |
| `ENQUIRY_TO_EMAIL` | Destination for enquiry emails | **Yes — server only** |
| `BOOKING_WEBHOOK_SECRET` | Verify booking engine webhooks | **Yes — server only** |
| `NEXTAUTH_SECRET` | If admin auth is added | **Yes — server only** |

**Rule**: All `NEXT_PUBLIC_` variables are safe to expose in the browser bundle. All others must remain server-side only and must never appear in frontend components, console.log, error messages, or Git commits.
