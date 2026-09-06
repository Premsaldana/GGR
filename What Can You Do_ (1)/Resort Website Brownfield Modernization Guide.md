# Resort Website Brownfield Modernization Guide

**Prepared by Manus AI**

## Executive recommendation

Treat this as a **controlled strangler migration**, not a rewrite. Preserve the current site and its business behavior while building a new application beside it. Migrate the highest-value guest journeys first, maintain a redirect and rollback map, and move functionality only after it has passed content, SEO, accessibility, performance, and integration checks.

For a typical resort marketing and booking-handoff website, the target should be a TypeScript full-stack application with a premium public-facing frontend, a structured content layer, and adapters for booking, forms, analytics, maps, and CRM services. If the site needs substantial search-engine-rendered content, select an SSR/SSG-capable React framework. If it is primarily a lightweight brochure site with no staff-managed content, a client application plus server endpoints may be sufficient. Do not make this choice until the current hosting, SEO, booking engine, and content ownership are audited.

## 1. Before opening Antigravity IDE

Create a clean Git repository or branch and make an immutable archive of the production site. Save the current HTML, CSS, JavaScript, media, robots.txt, sitemap, analytics configuration, forms, redirect rules, DNS notes, and third-party integration list. Record the current deployment command and the exact process for reverting to the existing website.

Collect the following inputs:

| Input | Why it matters | Owner |
|---|---|---|
| Current repository or ZIP archive | Reveals routes, scripts, dependencies, and hidden behavior | Developer |
| Production URL and hosting details | Enables route, performance, SEO, and deployment audit | Developer/owner |
| Booking engine or reservation provider | Determines whether the new backend owns reservations or only hands off | Operations |
| Brand guidelines, logo, fonts, photography, video | Prevents generic visual treatment and inaccurate imagery | Marketing |
| Page and content inventory | Prevents accidental omissions and SEO loss | Marketing/SEO |
| Analytics and conversion definitions | Establishes what success means | Marketing |
| CMS/admin requirements | Determines whether a database-backed content layer is necessary | Content team |
| Languages, currencies, legal requirements | Affects routing, schemas, forms, and launch scope | Owner/legal |

Do not begin by asking an AI coding assistant to “modernize the website.” First create an `audit/` folder containing `route-inventory.csv`, `integration-inventory.md`, `content-model.md`, `seo-baseline.md`, `performance-baseline.md`, and `open-decisions.md`.

## 2. Route and behavior audit

For every current URL, document the existing purpose, content owner, conversion action, indexed status, proposed new route, redirect rule, and acceptance test. Include pages linked only from JavaScript, forms, modal states, anchors, PDFs, and external booking links. Search the source for `onclick`, form actions, analytics calls, map embeds, chat scripts, tracking pixels, and hidden navigation.

Use this minimum route inventory structure:

| Current URL | New URL | Page purpose | Primary CTA | SEO priority | Content source | Integration | Status |
|---|---|---|---|---|---|---|---|
| `/` | `/` | Property overview | Book your stay | High | CMS/content file | Analytics | Audit |
| `/rooms.html` | `/stay` | Room comparison | View room | High | CMS | Booking handoff | Audit |
| `/room-deluxe.html` | `/stay/deluxe` | Room detail | Check availability | High | CMS | Booking handoff | Audit |
| `/contact.html` | `/contact` | Enquiry and contact | Send enquiry | Medium | CMS + form | Email/CRM | Audit |

The inventory is not complete until each route has a known owner, a content source, a conversion event, and a testable destination.

## 3. Target architecture decision

Use this decision tree. Choose the smallest architecture that satisfies the business, not the most fashionable stack.

| Requirement | Architecture implication |
|---|---|
| Strong SEO, rich content pages, social previews, fast first render | SSR/SSG-capable React framework |
| Staff edit rooms, offers, experiences, FAQs, and galleries | CMS or database-backed admin workflow |
| Current booking engine remains authoritative | Typed booking adapter and tracked handoff; do not duplicate availability |
| Resort owns availability, reservation, or payment | Separate domain and security project; do not hide it inside marketing-page code |
| Only contact/enquiry forms need server logic | Lightweight Node API or server actions may be enough |
| Multiple properties or brands are planned | Model property, locale, and content ownership from the beginning |

A solid baseline is React and TypeScript on the frontend, Tailwind CSS with a custom token layer, accessible component primitives, a Node/TypeScript backend, schema validation, a relational database with migrations, object storage/CDN for media, and automated tests. The exact framework can be selected in Antigravity after the audit confirms whether SSR/SSG is required.

Keep integrations behind adapters. The UI should call application-level functions such as `startBookingHandoff`, `submitEnquiry`, and `getRoomDetails`, not vendor-specific functions scattered throughout components.

## 4. Content and data model

Begin with content that maps directly to guest decisions. A useful first model contains `Property`, `Room`, `RoomFeature`, `Offer`, `Experience`, `DiningVenue`, `GalleryAsset`, `Testimonial`, `FAQ`, `SiteSetting`, `Enquiry`, `NewsletterSubscriber`, and `AuditEvent`. Add `Availability`, `Reservation`, `Payment`, and `Cancellation` only if the new backend is explicitly made authoritative for those domains.

Every publishable content entity should support a stable identifier, slug, title, short description, long description, structured highlights, media references, SEO title, SEO description, canonical path, draft/published state, ordering, and timestamps. Every image should have alternative text, focal-point information, width/height metadata, and a usage context such as hero, card, gallery, or thumbnail.

For enquiries, collect the minimum personal data required to respond. Validate on the server, rate-limit submissions, prevent duplicate sends, log delivery status without logging sensitive message content unnecessarily, and define retention and deletion rules before launch.

## 5. Premium UX direction

The visual goal should be **specific, place-led hospitality**, not “luxury template.” Start with a design brief that answers: What does the property feel like at 7 a.m.? What materials, landscape, and rituals distinguish it? Is the guest seeking romance, restoration, family time, adventure, or exclusivity? The answers determine imagery, pacing, copy, navigation, and motion.

A strong starting hypothesis is editorial coastal luxury: an asymmetric composition, warm mineral neutrals, deep botanical or midnight accents, a restrained terracotta or brass highlight, an expressive display serif paired with a calm sans-serif, large authentic photography, thin rules, tactile crops, and quiet transitions. Reject this direction if it does not match the actual property.

Design the homepage around a narrative rather than a component grid:

1. A cinematic but fast-loading opening that immediately states place, feeling, and booking intent.
2. A concise proof section showing what is genuinely distinctive: setting, architecture, service, wellness, dining, or access.
3. A room discovery interaction that lets guests compare without opening many unrelated pages.
4. A sensory experience section connecting the stay to real activities and local context.
5. Social proof and practical reassurance: reviews, policies, inclusions, arrival information, and contact options.
6. A final booking or enquiry decision point with an obvious fallback for guests who are not ready to book.

Use motion to clarify hierarchy and create atmosphere. Keep interactions short, interruptible, keyboard-safe, and disabled or simplified when reduced motion is requested. Animate opacity and transforms rather than layout properties. Never allow motion to delay access to room details, price/availability handoff, contact information, or navigation.

## 6. Unicorn Studio and 21st.dev usage rules

Use Unicorn Studio for one or two signature moments, not as the foundation of every page. Suitable uses include a controlled hero scene, a slow architectural reveal, a destination map narrative, or a subtle environmental transition. Establish a static image or CSS fallback first, set a maximum payload and loading budget, and test on mid-range mobile hardware before approving the embed.

Use 21st.dev to study interaction patterns and component ideas. Bring only the useful pattern into the project and rewrite it into the project’s own design tokens, accessibility conventions, analytics hooks, and dependency policy. Do not paste a full generated landing page into production. Reject any component that has unclear keyboard behavior, hard-coded content, unnecessary libraries, inaccessible contrast, or visual language inconsistent with the design brief.

The rule is: **external tools may inspire or accelerate a component, but the project owns the final architecture, content, styling, accessibility, and performance.**

## 7. Antigravity IDE operating method

Create a project instruction file before asking for implementation. It should state the chosen stack, folder structure, route ownership, design tokens, naming rules, accessibility requirements, test commands, environment-variable policy, asset policy, migration rules, and definition of done. Add a rule that AI must inspect existing files before changing them and must show a concise change plan for cross-cutting changes.

Work in vertical slices. A slice is complete only when it includes the data/content source, backend contract if needed, page UI, loading/error/empty states, responsive behavior, analytics event, accessibility behavior, tests, and a staging verification note.

Use this sequence inside the IDE:

| Step | IDE task | Output |
|---|---|---|
| 1 | Inspect legacy repository without editing | Architecture and behavior notes |
| 2 | Generate route/content/integration inventories | Audit files |
| 3 | Propose target architecture and unresolved decisions | Architecture decision record |
| 4 | Create tokens and primitive components | Stable visual foundation |
| 5 | Build the shell and one representative route | Reviewable vertical slice |
| 6 | Add backend/content capability for that route | Typed end-to-end flow |
| 7 | Test and measure | Unit, integration, E2E, accessibility, performance evidence |
| 8 | Migrate the next route | Incremental production progress |

Use bounded prompts such as:

> Inspect the existing repository only. Do not modify files. Produce a route inventory, integration inventory, content inventory, SEO risk list, and a list of runtime behaviors that are not obvious from the HTML markup. Cite each finding with a file path and line number.

> Based on the audit files, propose two target architectures. Compare them on SEO, hosting complexity, content editing, booking integration, performance, and migration risk. Do not generate application code yet. Mark assumptions and decisions requiring owner approval.

> Implement the design-token foundation only. Use the approved design brief. Do not create a generic hero or page. Add tokens for color, typography, spacing, radii, focus states, motion, and breakpoints, then create a small set of accessible primitives with tests.

> Migrate the room-detail journey as a vertical slice. Preserve the current URL through a route or redirect decision, model the content separately from presentation, add loading/error states, instrument the booking handoff, and include responsive and keyboard tests. Do not change unrelated routes.

> Review this change as a senior accessibility, SEO, security, and performance engineer. Report concrete defects with file paths, severity, impact, and suggested fix. Do not rewrite unrelated code.

## 8. Migration order

Migrate the shared shell first, then the most commercially important guest journey. The recommended order is: repository and environment setup; audit artifacts; design tokens and primitives; responsive header/footer and booking CTA; homepage; rooms listing; room detail; enquiry and booking handoff; offers and experiences; dining, gallery, location, and about content; CMS/admin if required; SEO and analytics hardening; performance optimization; cutover.

Keep a route-level feature flag or proxy switch so the old page can be restored while the new page is tested. Do not delete old assets or scripts until production monitoring proves they are unused.

## 9. Quality gates

Do not approve a route based on visual appearance alone. Require the following evidence:

| Gate | Pass condition |
|---|---|
| Functional | Core guest journey works from entry to enquiry or booking handoff |
| Responsive | Verified on narrow mobile, tablet, and desktop widths |
| Accessibility | Keyboard, focus, semantics, labels, contrast, and reduced motion checked |
| SEO | Metadata, canonical, structured data, sitemap, redirects, and 404 behavior checked |
| Performance | Hero media, JavaScript, third-party scripts, and Core Web Vitals measured |
| Security | Secrets server-side, inputs validated, forms rate-limited, authorization tested |
| Content | Real copy and approved media used; no placeholder claims remain |
| Operations | Logs, analytics, email delivery, backups, and rollback verified |

## 10. Launch checklist

Before DNS cutover, test the production build with production-like integrations, confirm email and booking handoff delivery, verify analytics events, inspect all high-value redirects, submit the sitemap, check robots rules, verify the canonical domain and SSL, and rehearse rollback. Retain the old deployment until the observation window has passed.

For the first launch period, monitor 404s, enquiry delivery, booking CTA clicks, JavaScript errors, third-party failures, page performance, search coverage, and unusual traffic or spam patterns. Use observed evidence to simplify or defer visual effects that do not improve guest behavior.

## Immediate next actions

1. Provide the current repository or a representative ZIP and the production URL.
2. Complete the route, integration, content, and SEO inventories before choosing the final framework.
3. Confirm whether the existing booking system remains authoritative.
4. Supply brand assets and authentic property photography.
5. Decide whether staff need a CMS/admin panel.
6. Approve a visual direction before building the homepage.
7. Implement one complete room-detail or booking-handoff slice before migrating every route.

The most important strategic constraint is simple: **modernize the technology without modernizing away the resort’s authenticity.** The new site should feel unmistakably like this property, load quickly, guide guests confidently, and remain operable by the people who run the resort.
