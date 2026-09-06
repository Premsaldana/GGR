# Brownfield Resort Website Modernization Plan

## Goal

Modernize the existing resort website from basic HTML, CSS, and JavaScript into a maintainable full-stack application with a premium, conversion-focused UI/UX, while preserving search visibility, existing business content, brand equity, and a safe rollback path. The work will be performed in Antigravity IDE, with Unicorn Studio and 21st.dev used as deliberate design inputs rather than as sources of generic generated pages.

## Recommended target architecture

Use a TypeScript monorepo or single repository with a React-based frontend and a Node.js backend. The preferred implementation baseline is React 19, Vite, Tailwind CSS, shadcn/ui primitives, Framer Motion for restrained motion, Express, tRPC for typed frontend/backend contracts, Drizzle ORM, and PostgreSQL or the project's existing relational database. If SEO requirements are substantial, use a framework with server-side rendering or static generation, such as Next.js, instead of a client-only SPA. The final choice should be made after auditing the current hosting, SEO requirements, booking provider, and backend integrations.

| Area | Recommended direction | Decision gate |
|---|---|---|
| Frontend | React + TypeScript with a component system and design tokens | Use Next.js if SSR/SSG, metadata control, or content SEO is critical |
| Backend | Node.js + TypeScript API layer with validation and typed contracts | Keep existing APIs when stable; add an adapter layer rather than rewriting everything |
| Data | PostgreSQL with migrations and an ORM | Preserve or migrate existing data only after a schema and ownership audit |
| Content | CMS or database-backed content for rooms, amenities, offers, and experiences | Keep static content in code only for content that rarely changes |
| Media | CDN/object storage with responsive derivatives and alt text | Do not commit large images or videos into the application repository |
| Deployment | Preview, staging, and production environments with environment-specific secrets | Match the current domain, hosting, and operational constraints |

## Phase 1: Discovery and baseline capture

1. Create a protected Git branch and archive the current production build. Record the current domain, hosting provider, DNS, SSL, analytics, cookie consent behavior, forms, booking links, third-party scripts, and email destinations.
2. Inventory every existing route, HTML page, asset, form, script, redirect, canonical URL, sitemap entry, robots rule, metadata field, structured-data block, and externally linked page. Create a route/content matrix with the current URL, proposed URL, migration status, SEO metadata, owner, and acceptance criteria.
3. Measure the current baseline using Lighthouse or equivalent tooling: Core Web Vitals, page weight, image sizes, accessibility issues, broken links, mobile behavior, form success rate, and conversion actions such as booking clicks, enquiry submissions, calls, and map directions.
4. Identify the true business journeys: discover the resort, inspect rooms, compare packages, view experiences, check location, submit an enquiry, start or complete a booking, and contact the property. These journeys—not the existing page list—should drive the information architecture.
5. Confirm constraints before coding: whether the booking engine is external, whether staff need an admin area, whether prices and availability are live, whether payments are in scope, whether multiple languages/currencies are needed, and whether the current website contains legally or contractually required copy.

## Phase 2: Product and UX definition

Produce a short product brief and a page-level information architecture. The likely public structure is Home, Stay/Rooms, Room Detail, Dining, Experiences, Offers, Gallery, Location, About/Journal, Contact, and Booking/Enquiry. Add an internal admin area only if resort staff need to manage content, leads, offers, availability, or media.

Define measurable UX objectives: reduce time to understand the property, make room comparison effortless, expose the booking CTA at the right moments, communicate trust through reviews and policies, support one-handed mobile use, and preserve a calm luxury feeling rather than turning the site into a dense catalogue.

Create user flows and low-fidelity wireframes for the home page, room detail, offer detail, enquiry form, booking handoff, mobile navigation, cookie preferences, and error/empty states. Validate the wireframes against real content and real images before visual styling.

## Phase 3: Distinctive visual direction

Do not begin with a prompt such as “build a modern resort website.” Establish a visual system first. A strong default direction is editorial coastal luxury: generous asymmetric composition, warm mineral neutrals, deep botanical or midnight accents, one restrained metallic or terracotta highlight, an expressive display serif paired with a highly legible sans-serif, tactile image crops, and quiet motion. This is only a starting hypothesis; it must be grounded in the resort's location, architecture, guest profile, and existing identity.

Create a design brief containing the brand attributes, art direction, typography pair, color tokens, spacing scale, grid, radii, image treatment, icon style, button behavior, motion principles, and accessibility contrast rules. Build a small tokenized UI kit before assembling full pages. Use shadcn/ui or equivalent primitives for behavior, then customize the visual layer so the result does not look like an unmodified component library.

Use Unicorn Studio for one or two high-value experiential moments—such as a hero scene, a subtle architectural scroll narrative, or an interactive destination map—only after defining a no-JavaScript fallback and a performance budget. Avoid making the entire site dependent on a visual editor or an embedded animation runtime.

Use 21st.dev as a source of component patterns and interaction inspiration. Inspect and adapt patterns into the project's own component system; do not copy a complete generated page, introduce inconsistent primitives, or accept code with unclear accessibility, responsiveness, or dependency behavior.

If creating new visual assets, specify the asset's job, crop, aspect ratio, subject, safe area, brand tone, and mobile behavior. Prefer authentic resort photography supplied by the client. AI-generated or stock imagery should be clearly treated as a temporary or approved marketing asset, not silently presented as real property photography.

## Phase 4: Brownfield migration strategy

Migrate incrementally rather than replacing every page in one release. Start with a strangler approach: preserve the current site as the fallback, implement the new shell and one representative journey, test it in staging, then move routes in controlled batches.

1. Create a URL compatibility layer and explicit redirect map. Preserve high-value URLs where possible; use permanent redirects only when the destination is final and relevant.
2. Extract and normalize content from the old HTML into structured records or content files. Separate presentation from content so staff can update rooms, offers, policies, and experiences without editing components.
3. Convert the shared shell first: metadata, header, navigation, booking CTA, footer, cookie controls, analytics, and responsive layout primitives.
4. Migrate the highest-value pages next: home, rooms listing, room detail, and booking/enquiry journey. Then migrate supporting content and lower-risk pages.
5. Keep old and new pages available behind feature flags or route-level switches during acceptance testing. Maintain a rollback procedure that can restore the previous route without data loss.
6. Remove obsolete scripts only after confirming that analytics, forms, chat widgets, maps, pixels, and booking links still work.

## Phase 5: Backend and data capabilities

Define the minimum backend scope before building. For a brochure-and-booking-handoff resort site, the backend may only need content management, enquiries, newsletter subscriptions, media references, and audit logging. If the resort owns availability, reservations, payments, or staff workflows, those require a more substantial domain model and security review.

Recommended initial entities are Room, RoomFeature, Package/Offer, Experience, DiningVenue, GalleryAsset, Testimonial, FAQ, SiteSetting, Enquiry, NewsletterSubscriber, User/StaffMember, and AuditEvent. Add Availability, Reservation, Payment, and Cancellation only when the business confirms that the new system is the source of truth.

Implement the API with schema validation, authorization, rate limiting, spam protection, server-side logging, and clear error contracts. Keep secrets server-side. For an external booking engine, use a typed integration adapter that tracks outbound clicks or handoff events without duplicating reservation data unless required. Treat payment processing and guest personal data as separate security-sensitive workstreams.

For content administration, provide draft/publish states, validation, image metadata, preview, ordering, and rollback/version history. Use role-based permissions so marketing staff cannot access sensitive reservation or payment data.

## Phase 6: Implementation in Antigravity IDE

Set up the repository with a clear CONTRIBUTING or project guide that explains the architecture, commands, environment variables, design tokens, route ownership, migration rules, and definition of done. Configure formatting, linting, type checking, unit tests, end-to-end tests, and pre-commit or CI checks before feature work begins.

Work in vertical slices rather than generating the whole application at once. Each slice should include its content model, backend contract, frontend page, loading/error/empty states, analytics events, accessibility behavior, tests, and staging verification. Use the IDE's AI assistance for bounded tasks such as extracting types, generating test cases, refactoring a component, or explaining legacy code. Review every generated change for security, semantics, performance, and consistency with the design system.

Suggested implementation order is: repository and environment setup; content and asset inventory; design tokens and UI primitives; responsive shell; home page; rooms and room detail; enquiry/booking handoff; offers and experiences; gallery and location; CMS/admin if required; SEO and analytics; performance hardening; cutover.

## Phase 7: Quality, accessibility, SEO, and performance

Test at mobile, tablet, and desktop breakpoints and on slow networks. Verify keyboard navigation, visible focus, semantic headings, form labels, contrast, reduced-motion behavior, alt text, touch target sizes, and screen-reader announcements. Test every form for validation, duplicate submission, spam, server failure, and confirmation behavior.

Validate route-level metadata, canonical URLs, Open Graph data, XML sitemap, robots rules, structured data appropriate to the property, redirects, 404 behavior, and preservation of indexed content. Do not change slugs or remove pages without an SEO decision and redirect plan.

Set budgets for JavaScript, critical CSS, hero media, total page weight, and interaction latency. Use responsive images, modern formats, lazy loading below the fold, poster images for video, preload only the true LCP asset, and defer non-essential third-party scripts. Measure the Unicorn Studio experience separately and disable or simplify it on constrained devices when necessary.

Use unit tests for domain logic and validation, API/integration tests for backend procedures, and Playwright or equivalent end-to-end tests for the core booking and enquiry journeys. Run visual regression checks on the key routes after major design changes.

## Phase 8: Launch and operations

Create preview deployments for every change, a staging environment connected to non-production integrations, and a production release checklist. Before cutover, verify backups, DNS and SSL ownership, environment variables, analytics continuity, email delivery, booking handoff, redirects, monitoring, and a rollback command or documented procedure.

Launch with a short observation window. Monitor error rates, enquiry delivery, booking CTA clicks, Core Web Vitals, 404s, search-console coverage, and third-party failures. Keep the old site deployable until the new site has passed the agreed observation period.

## Acceptance criteria

The modernization is complete when all required routes have migrated or have an approved redirect, the core guest journeys work on mobile and desktop, enquiries and booking handoffs are verified end to end, content owners can update agreed content, analytics events are preserved or intentionally redesigned, accessibility issues are resolved to the agreed level, performance budgets are met or exceptions documented, and rollback has been tested.

## Assumptions and open risks

This plan assumes the current site is primarily a marketing and booking-handoff website, not a full property-management or payment platform. It also assumes that the existing booking provider remains authoritative unless the user explicitly chooses to replace it. The exact stack, CMS, database, hosting model, authentication requirements, multilingual needs, and data migration approach remain open until the discovery audit.

The largest risks are accidental SEO loss, replacing authentic photography with inaccurate generated imagery, embedding heavy visual effects that damage mobile performance, duplicating reservation logic across systems, exposing guest data, and allowing AI-generated code to bypass architecture or accessibility review. Each risk is addressed by staged migration, explicit route mapping, asset provenance, performance budgets, integration adapters, least-privilege access, and human review.

## First inputs needed to start execution

Provide the existing repository or a representative archive, the current production URL, the hosting/deployment setup, the booking-engine or CRM details, the preferred target stack if already decided, the resort's brand assets and photography, the list of pages that must remain indexed, and a decision on whether staff need a CMS/admin panel. With those inputs, the discovery phase can produce a concrete route map, schema proposal, design brief, and sprint backlog before implementation begins.
