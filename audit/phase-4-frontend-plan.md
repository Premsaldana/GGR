# Phase 4 — Frontend Completion and Hardening Plan

This plan details the steps required to finalize the frontend foundation according to the Phase 4 constraints.

## 1. Route Refinements (Existing Pages)
*   **Homepage (`/`)**: Refine hero section, add visual amenity highlights based on confirmed facts, improve room preview layout, and ensure call-to-actions are clear. Priority loading only on LCP image.
*   **Listing Page (`/stay`)**: Improve layout, spacing, and image presentation for the villa cards. Priority loading on top LCP image only.
*   **Detail Page (`/stay/[slug]`)**: Enhance the gallery layout, improve typography for descriptions, and harden the enquiry fallback (BookingCTA). Priority loading on hero image only.
*   **Contact Page (`/contact`)**: Enhance the static form UI (empty/focus/error states) without wiring it to a backend yet.

## 2. Blocked Content Routes
The following routes **cannot be built** because the legacy `index.html` and audit materials do not contain supporting content. To prevent inventing copy, these are explicitly deferred until the owner provides content:
*   **`/about`**: No property history or "about us" narrative exists.
*   **`/location`**: Only an address exists; no surrounding area info, distance to airport, or map data is confirmed.
*   **`/gallery`**: No standalone gallery photos are available beyond the room photos already flagged for quality issues (watermarks/text overlays).

## 3. SEO Infrastructure (CMS-Free)
*   **`robots.ts`**: Generate a standard `robots.txt` allowing indexing only on confirmed production domain (staging/preview not indexed).
*   **`sitemap.ts`**: Generate a dynamic sitemap including `/`, `/stay`, `/contact`, and all `/stay/[slug]` static routes.
*   **Metadata**: Centralize Open Graph, canonical placeholders, and JSON-LD structured data using **only confirmed facts**. Uncertain info remains marked for owner approval.

## 4. Performance & Image Hardening
*   **LCP (Largest Contentful Paint)**: Ensure priority loading ONLY for the actual above-the-fold LCP image on each route. Do not set priority on every hero/gallery image.
*   **Responsive Sizing**: Explicitly define `sizes` for `next/image` to prevent serving oversized assets on mobile.
*   **Alt Text**: Improve generic alt text where possible without inventing facts.
*   **Asset Replacements**: Formally identify images needing replacement (e.g., `DSCN2468.JPG` - 3.5MB, `Bedroom.jpg` - text overlay). Maintain current uncertain mapping warnings.

## 5. Accessibility & Responsive Verification
*   Keyboard navigation (SkipLink verification).
*   Focus ring consistency.
*   `prefers-reduced-motion` compliance.
*   375px mobile viewport checks (hamburger menu interaction, column stacking).
*   Form input error/empty state styling.

## 6. Booking Provider Stub
*   Retain the neutral stub in `adapter.ts`.
*   Ensure "Enquire Now" is presented transparently, avoiding any implication of live availability, instant booking, or payments.

## 7. Unicorn Studio Enhancement
*   Implement Unicorn Studio as a **lazy-loaded, optional** enhancement (e.g., a dynamic background effect).
*   Hide behind a feature flag (`NEXT_PUBLIC_ENABLE_UNICORN=false` by default). Enable only for local/staging testing after fallback works.
*   Provide a static fallback, a reduced-motion fallback, a mobile fallback, and WebGL/runtime-failure fallbacks.

## 8. UI Components (21st.dev)
*   21st.dev components may use Tailwind utilities when those utilities are consistent with the project design tokens. Token consistency, semantic HTML, keyboard support, reduced-motion support, and responsive behavior are required. No generic copied pages.
