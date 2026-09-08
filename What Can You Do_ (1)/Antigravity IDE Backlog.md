# Antigravity IDE Backlog

## Working agreement

Every task must identify the files inspected, the files changed, the assumptions made, the tests run, and any unresolved risk. AI-generated changes must be reviewed before merge. No task is complete if it only produces a visual shell without real content, responsive behavior, accessibility states, and a verified conversion path.

## Epic A — Audit and safety

| ID | Task | Definition of done |
|---|---|---|
| A1 | Archive the production site and create a migration branch | Existing build, assets, deployment notes, and rollback path are stored |
| A2 | Inventory routes and redirects | Every route has an owner, target path, SEO priority, and migration status |
| A3 | Inventory integrations | Booking, CRM, email, analytics, maps, chat, cookies, and scripts are documented |
| A4 | Capture performance and conversion baseline | Lighthouse/Core Web Vitals, form success, booking clicks, and key errors are recorded |
| A5 | Define environment policy | Local, preview, staging, and production variables are documented; secrets are not committed |

## Epic B — Architecture and content

| ID | Task | Definition of done |
|---|---|---|
| B1 | Choose SSR/SSG or client rendering | Decision record compares SEO, hosting, content, and migration trade-offs |
| B2 | Define content model | Rooms, offers, experiences, dining, media, FAQs, site settings, and enquiries are modeled |
| B3 | Define integration adapters | Booking, CRM/email, analytics, maps, and media providers are isolated behind application-level contracts |
| B4 | Define content publishing workflow | Draft, preview, publish, validation, and rollback expectations are documented |
| B5 | Define security boundaries | Personal data, staff roles, rate limits, validation, retention, and audit needs are documented |

## Epic C — Design system

| ID | Task | Definition of done |
|---|---|---|
| C1 | Approve visual direction | Design brief, palette, typography, imagery, and anti-generic acceptance test are signed off |
| C2 | Implement design tokens | Color, type, spacing, radius, focus, breakpoints, and motion tokens exist in one source of truth |
| C3 | Build primitives | Buttons, links, fields, cards, dialogs, drawers, media, and typography states are accessible and reusable |
| C4 | Define layout patterns | Editorial grid, full-bleed media, comparison blocks, proof sections, and conversion blocks are specified |
| C5 | Prototype signature experience | One Unicorn Studio concept has fallback, reduced-motion mode, mobile simplification, and performance budget |

## Epic D — Public guest journeys

| ID | Task | Definition of done |
|---|---|---|
| D1 | Build responsive shell | Header, navigation, footer, booking CTA, metadata, cookie controls, and analytics are wired |
| D2 | Build homepage vertical slice | Real approved content and imagery; loading, error, responsive, SEO, and analytics checks pass |
| D3 | Build rooms listing | Guests can compare rooms and reach the correct detail page |
| D4 | Build room detail | Facts, inclusions, media, policies, alternatives, and booking handoff are complete |
| D5 | Build enquiry flow | Server validation, spam protection, delivery confirmation, and recoverable error states work |
| D6 | Build offers and experiences | Content is structured, shareable, indexable, and connected to booking intent |
| D7 | Build dining, gallery, location, and about | Supporting pages preserve important content and links |

## Epic E — Quality and migration

| ID | Task | Definition of done |
|---|---|---|
| E1 | Add unit and API tests | Domain logic, validation, adapters, and permissions are covered |
| E2 | Add end-to-end tests | Mobile and desktop guest paths cover room discovery, enquiry, and booking handoff |
| E3 | Add accessibility checks | Keyboard, focus, labels, semantics, contrast, reduced motion, and error announcements pass |
| E4 | Add SEO checks | Metadata, canonical, structured data, sitemap, robots, redirects, and 404 behavior pass |
| E5 | Add performance checks | Image, JavaScript, third-party, and Core Web Vitals budgets are measured |
| E6 | Run staged route migration | New routes are feature-flagged or proxied; old route rollback remains possible |
| E7 | Cut over and observe | Production checks, monitoring, analytics, email, booking, and rollback are verified |

## Definition of done for each vertical slice

The slice has approved content and media, a route decision, a typed data contract where necessary, responsive UI, loading/error/empty states, accessible interaction, analytics events, SEO metadata, tests, performance evidence, and a staging verification note. Placeholder content and “coming soon” controls are not acceptable on a launch-critical route.

## Suggested first sprint

The first sprint should not attempt to build the entire homepage. It should produce the audit artifacts, architecture decision record, design brief, token foundation, and one representative room-detail or booking-handoff slice. This reveals the actual difficulty of the migration before the team commits to every route.
