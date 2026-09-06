# Admin Shell Layout Fix Report

## Issue Addressed
Browser QA reported that the admin routes (`/admin`, `/admin/login`, `/admin/calendar`) were inheriting the public resort marketing header and footer (e.g., STAY, AMENITIES, CONTACT, phone number, and ENQUIRE NOW).

## Implementation
1. **Isolated Layout Boundary**: Created a new Client Component wrapper `src/components/resort/LayoutBoundary.tsx` that inspects the current `pathname`. 
2. **Conditional Rendering**: If the pathname starts with `/admin`, it omits the public header and footer entirely, leaving only the `<main>` tag to encapsulate the admin layout. 
3. **Integration**: Injected `<LayoutBoundary>` into `src/app/layout.tsx`, wrapping the `{children}` with the `ResortHeader` and `ResortFooter` passed as props.
4. **Zero Public Impact**: Since the `layout.tsx` changes merely add a conditional wrapper, the public-site layouts and routes were **not** modified or reorganized. Server components like `ResortHeader` maintain their SEO and performance benefits as they are still rendered and passed down from the server layout.

## Verification
- **Visuals Check**: Confirmed that `/admin/login`, `/admin/calendar`, and `/admin` no longer display the public branding or CTAs. 
- **Preserved Elements**: The authenticated admin sidebar, admin top bar, email display, sign-out button, and reservation drawer remain perfectly intact.
- **Scope Constrained**: No changes were made to authentication, billing calculations, QR links, payment state logic, PDF generation, or guest data behavior.
- **Commands Run**:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
  - `npm run build`

The admin layout boundary is now successfully enforced.
