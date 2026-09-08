# Architecture Decision Record

**Project**: South Goa Garden Villa — brownfield modernization  
**Date**: 2026-09-03  
**Status**: Proposed — awaiting owner approval  
**Branch**: `brownfield-branch`

---

## Background

The legacy site is a single-page static HTML/CSS/JS site with no build system, no CMS, no booking engine, no forms, and no analytics. The modernized site must add:

1. A true direct booking engine (external provider — source of truth for availability, rates, reservations)
2. An online payment capability (through the booking engine's payment or an external gateway)
3. A CMS/admin panel for staff-managed content (rooms, amenities, offers, gallery, FAQs, policies, SEO)
4. Strong SEO (currently near-zero baseline — high opportunity)
5. ≤16 MB page load → target <1 MB initial load with lazy media
6. Responsive, accessible, mobile-first design
7. No custom reservation, availability, or payment logic on the custom frontend

The architecture must serve a small resort team with limited technical resources. Operational complexity must stay low.

---

## Constraints Confirmed

- Not yet hosted; hosting not decided
- No existing booking engine, OTA listings, database, or backend
- No developer on permanent staff (inferred from legacy plain HTML)
- Primary market: India (domestic + international tourists, Goa)
- Booking must support UPI, domestic cards, and international cards
- CMS must be operable by non-technical staff
- External booking engine is the source of truth for all reservation data
- No raw card data on the custom frontend at any time
- Legacy files must remain available as rollback until the new site passes launch checklist

---

## Architecture Option A: Next.js (SSR/SSG) + Headless CMS + Booking Engine Adapter

### Description
A TypeScript monorepo with:
- **Frontend**: Next.js 14+ with App Router; pages statically generated (SSG) at build time; ISR for content updates; React for interactive components
- **CMS**: Sanity.io (managed cloud) — non-technical staff edit rooms, gallery, offers, FAQs via Sanity Studio; content served via CDN
- **Backend**: Next.js API routes (or a light Edge function layer) for enquiry form handling, webhook reception from the booking engine, and email delivery
- **Booking engine**: BookingJini or eZee Reservation widget embedded in the site; their hosted checkout handles availability, reservations, and payment; no reservation data duplicated
- **Payment**: Booking engine's integrated payment (preferred) or Razorpay via booking engine's gateway connector
- **Media**: Cloudinary or Sanity's image CDN for image optimization, responsive `srcset`, WebP/AVIF conversion
- **Email**: Resend or SendGrid (server-side only) for enquiry delivery
- **Hosting**: Vercel (frontend + API routes) or Netlify; Sanity manages its own CMS hosting

### Strengths

| Strength | Detail |
|---|---|
| SEO power | Next.js SSG/ISR generates fully server-rendered HTML per page; excellent Lighthouse scores; dynamic OG/Twitter meta; `sitemap.xml` auto-generated |
| CMS ecosystem | Sanity free tier covers a small resort easily; Studio has excellent non-technical UX; real-time preview; image focal points; draft/publish |
| Type safety | Full TypeScript end-to-end; GROQ-typed queries from CMS → component |
| Performance | Static generation = near-zero TTFB; edge CDN; Next.js Image handles lazy, `srcset`, WebP automatically |
| Booking separation | Booking engine widget and hosted checkout own all reservation/payment logic; no duplication |
| Vercel DX | Automatic preview deployments per branch; easy environment variable management |
| Ecosystem maturity | Next.js + Sanity is a proven combination with extensive documentation, community, and hosting options |

### Weaknesses

| Weakness | Detail |
|---|---|
| Complexity ceiling | App Router, RSC, GROQ, TypeScript, tRPC adds learning curve; more moving parts than Option B |
| Vercel cost | Vercel free tier has limits on bandwidth and function invocations; a commercial Vercel plan may be needed as traffic grows |
| Build times | Large media sets can slow build; ISR mitigates but requires configuration |
| Vercel dependency | Tight Next.js/Vercel coupling; migrating away from Vercel later requires work |

### Cost Estimate (Monthly)

| Resource | Free Tier | Production Estimate |
|---|---|---|
| Vercel (frontend + API routes) | Free tier adequate for low traffic | Pro plan ~$20/month if traffic grows |
| Sanity CMS | Free tier (100K API calls/month, 10 GB bandwidth) | Adequate for small resort; Growth plan ~$15/month if needed |
| Cloudinary (media) | Free tier (25 GB storage, 25 GB bandwidth) | Adequate initially |
| Email delivery (Resend) | 3,000 emails/month free | Adequate for enquiry volume |
| Booking engine | Subscription cost (confirm with provider) | ~₹3,000–₹8,000/month (estimated) |
| **Total custom infra (excluding booking engine)** | **~$0 initially** | **~$35–40/month at scale** |

---

## Architecture Option B: Astro (Static) + Sanity CMS + Booking Engine Adapter

### Description
- **Frontend**: Astro with zero-JS by default; React "islands" only where interactivity is needed (booking widget mount, gallery, mobile nav); TypeScript throughout
- **CMS**: Same as Option A — Sanity.io
- **Backend**: Netlify Functions (serverless) for enquiry form and webhook handling; or a tiny Hono/Fastify edge function layer
- **Booking engine**: Same — BookingJini or eZee widget
- **Payment**: Same — through booking engine
- **Media**: Same — Sanity's image CDN or Cloudinary
- **Email**: Same — Resend or SendGrid
- **Hosting**: Netlify (excellent Astro support; built-in form handling; branch previews)

### Strengths

| Strength | Detail |
|---|---|
| Maximum performance | Astro ships zero JS by default; fastest Core Web Vitals of any option; hotel/resort content pages are not interactive — this is a perfect fit |
| SEO baseline | Fully static HTML output; excellent crawlability; simpler to reason about than RSC |
| Simpler mental model | No server-side rendering complexity; no RSC boundaries; easier to audit and review |
| Netlify forms | Built-in serverless form handling — enquiry form works without a custom API layer |
| Cheaper hosting | Netlify free tier is very generous for a static site |
| Migration flexibility | Astro is framework-agnostic; components can be React, Svelte, Vue, or plain HTML; easier to migrate later |
| Same CMS (Sanity) | Same non-technical editing experience; same content model |

### Weaknesses

| Weakness | Detail |
|---|---|
| React ecosystem gap | Fewer React-specific component libraries; 21st.dev and shadcn/ui patterns require React islands rather than native integration |
| Interactive features | Complex interactive features (room availability preview widget, multi-step booking form UI) require explicit island configuration |
| Less mature ecosystem vs Next.js | Astro is newer; fewer hotel-specific starter templates and reference implementations |
| Booking engine widget | Some booking engine widgets may require React or specific JS runtime; must confirm compatibility |

### Cost Estimate (Monthly)

| Resource | Free Tier | Production Estimate |
|---|---|---|
| Netlify (frontend + functions) | Free tier covers most small sites | Pro plan ~$19/month if bandwidth exceeded |
| Sanity CMS | Same as Option A | Same |
| Email delivery (Resend) | Same as Option A | Same |
| Booking engine | Same as Option A | Same |
| **Total custom infra (excluding booking engine)** | **~$0 initially** | **~$34–35/month at scale** |

---

## Comparison Table

| Dimension | Option A: Next.js | Option B: Astro |
|---|---|---|
| **SEO** | Excellent (SSG/ISR) | Excellent (Static) |
| **Performance (Core Web Vitals)** | Very good | Outstanding (zero JS by default) |
| **Developer complexity** | Higher | Lower |
| **Non-developer operability** | Same (Sanity is identical) | Same |
| **Interactive booking widget** | Native (React client component) | Requires island; confirm widget compatibility |
| **Form handling** | Custom API route or Netlify Forms | Netlify built-in forms or serverless function |
| **21st.dev component compatibility** | Excellent (all React) | Requires React islands (still works) |
| **Unicorn Studio integration** | Client component with lazy load | Island with lazy load |
| **Build system complexity** | Higher (App Router, RSC, GROQ typing) | Lower |
| **Hosting flexibility** | Vercel, Netlify, Railway, any Node host | Netlify, Vercel, Cloudflare Pages, any static host |
| **Estimated monthly infra cost** | $0–$40 | $0–$35 |
| **Migration risk** | Medium (framework-specific) | Low (static output) |

---

## Recommended Architecture: **Option A — Next.js + Sanity + Booking Engine Adapter**

### Rationale

1. **SEO is the highest-value improvement**. The legacy site has near-zero SEO. Next.js with App Router SSG gives per-page server-rendered HTML with full metadata control, structured data (JSON-LD), dynamic OG image generation, and ISR for content updates — all without requiring a full rebuild per content change.

2. **The design brief calls for 21st.dev component patterns and Unicorn Studio integration**. Both are specified in the planning documents. Both work most naturally in a React environment. Using Astro would require React islands for all of these components — it works but adds friction.

3. **Sanity.io is recommended for both options** and is the CMS choice regardless. The CMS decision is not differentiating.

4. **Booking engine adapter pattern**. Next.js API routes provide a clear, typed integration boundary for: (a) receiving webhook events from the booking provider, (b) logging enquiries, (c) delivering email. This is better organized than serverless functions scattered across Netlify.

5. **The content is primarily static** (rooms, amenities, offers, gallery, FAQs). Next.js SSG handles this without SSR overhead. Only the booking widget and enquiry form are interactive — both are client components, not full-page React.

6. **The planning documents explicitly recommend Next.js** if SSR/SEO/content is critical (Brownfield Modernization Plan, section "Architecture Decision"). SEO is critical for this project.

7. **Vercel vs. Netlify**. Both work. Vercel is recommended because it has tightest Next.js integration, automatic preview deployments, and Vercel's Image Optimization handles WebP/AVIF conversion server-side (eliminating the need for a separate Cloudinary account initially).

### Final Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14+ (App Router, SSG/ISR) | TypeScript throughout |
| Styling | Tailwind CSS + custom CSS custom properties (design tokens) | As per planning docs; shadcn/ui primitives |
| Component system | shadcn/ui (behavior) + custom resort design system | Not an unmodified component library |
| Animations | Framer Motion (restrained, accessible) | `prefers-reduced-motion` required |
| CMS | Sanity.io (managed cloud) | Free tier; Sanity Studio for staff editing |
| Backend | Next.js API routes (Edge-compatible) | Enquiry handling, webhook reception, email |
| Booking engine | BookingJini or eZee Reservation (widget + hosted checkout) | External source of truth for all reservations |
| Payment | Via booking engine's integrated gateway | Razorpay integration if engine requires separate gateway |
| Image CDN | Vercel Image Optimization + Sanity image pipeline | Automatic WebP, lazy loading, `srcset` |
| Email | Resend (server-side API routes only) | Enquiry delivery; no credentials in frontend |
| Hosting | Vercel (frontend + API routes) | Preview deployments per branch |
| Monitoring | Vercel Analytics + optional Sentry for errors | |
| Analytics | Google Analytics 4 or Plausible | Cookie consent required |
| Environment | Local → Vercel preview → Vercel production | Secrets in Vercel environment variables only |

---

## Decisions Deferred to Owner

| Decision | Impact on Architecture |
|---|---|
| BookingJini vs. eZee Reservation | Determines the widget embed code and webhook contract |
| Custom domain | Required before production Vercel deployment |
| Sanity free tier vs. Growth tier | Growth tier needed if content editors > 3 or API calls exceed free limits |
| Google Analytics vs. Plausible | Plausible is privacy-friendly (no cookie consent needed); GA4 requires consent banner |
| Whether staff will manage enquiries in Sanity or a separate CRM | Determines whether Enquiry is a Sanity document type or just an email delivery |
