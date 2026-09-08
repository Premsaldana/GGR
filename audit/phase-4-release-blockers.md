# Phase 4 Release Blockers

The frontend application (Phase 4) is technically ready for staging deployment, but cannot be finalized for production until the following Owner Content Approval blockers are resolved.

## Content Blockers (Require Owner Approval)

1. **Canonical Property Name & Tagline:**
   - The primary heading/logo text currently uses `South Goa Garden Villa`. This needs final confirmation.
   - Tagline is currently set as `Private Villas in Colva, South Goa`.

2. **Room Categorization & Pricing:**
   - The 4-bedroom and 5-bedroom villa image mappings (`4bhk.jpeg` / `5bhk.jpeg`) need confirmation against actual property facts.
   - Pricing arrays and availability rules are currently omitted or mocked. Exact nightly rates and policies are required before activating the booking engine.

3. **Logo & Brand Identity:**
   - The current logo is unconfirmed. The owner needs to approve the final mark.

4. **Social Links & External Connections:**
   - Instagram, Facebook, and actual Google Maps listing links are needed to populate the footer and metadata accurately.

## Technical Blockers (For Next Phase)

1. **Booking Integration (Phase 5):**
   - The `BookingCTA` component is currently wired to a generic stub that redirects to `/contact`.
   - Before launch, a real reservation system (e.g. Hostaway, Guesty, or custom backend) must be integrated into `src/integrations/booking/adapter.ts`.

2. **CMS Connection (Phase 6):**
   - Content is currently hardcoded in local TypeScript dictionaries (`src/content/rooms.ts`).
   - A Sanity.io (or equivalent) headless CMS environment needs to be deployed, populated with the approved content, and wired to the frontend queries.

## Next Action
**The smallest next action** is for the Owner to review the frontend on a staging/local environment (since it's approved for local/staging review) and provide final sign-off on the missing **Content Blockers** outlined above.
