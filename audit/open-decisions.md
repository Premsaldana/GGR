# Open Decisions

Decisions that require owner/stakeholder input before architecture and implementation can proceed. Each decision is blocked until answered.

---

## 🔴 High Priority (Blocks Architecture)

### OD-1: Booking System
**Question**: Is WhatsApp the intended long-term booking channel, or should the new site integrate with a booking engine (Booking.com, direct calendar, custom reservation system)?

**Current state**: All bookings and enquiries go through WhatsApp (`wa.me/+917813093075`). No web forms, no booking calendar, no availability display.

**Impact**: This determines whether the backend needs reservation/availability logic, or just a contact form and WhatsApp handoff.

**Options**:
- A) Keep WhatsApp as primary, add a web enquiry form as secondary
- B) Integrate an external booking engine (e.g., Booking.com widget, Lodgify, etc.)
- C) Build a custom booking/availability system (significant scope increase)

---

### OD-2: Hosting and Domain
**Question**: Where is the current site hosted, and what is the production URL?

**Current state**: No hosting configuration in the repository. The `.htaccess` in `pics/` suggests Apache hosting. No `CNAME`, `netlify.toml`, `vercel.json`, or deployment scripts found. The Git remote is `github.com/Premsaldana/GGR.git`.

**Impact**: Hosting choice affects framework selection (SSR requires Node.js hosting; static can use any CDN), deployment pipeline, and DNS migration.

---

### OD-3: CMS / Content Management
**Question**: Do resort staff need the ability to update rooms, prices, offers, images, and amenities without developer help?

**Current state**: All content is hardcoded in HTML. Any change requires editing source files.

**Impact**: Determines whether to build a CMS/admin panel or use a headless CMS, and whether a database is needed.

---

### OD-4: Room Naming and Pricing
**Question**: What are the correct, canonical room/villa names, and should prices be displayed on the website?

**Current state**: Inconsistent naming across files:
- index.html: "5 bedroom Villa with private pool", "4 bedroom Villa", "1 bedroom Villa"
- test.html: "1 BHK Apartments", "4 BHK Apartments", "5 BHK Apartments"
- Image filenames: `4bhk.jpeg` / `5bhk.jpeg` (appear swapped)
- No prices anywhere

**Impact**: Correct naming is needed before any room content can be migrated. Pricing determines whether dynamic rate display is needed.

---

## 🟡 Medium Priority (Blocks Design/Implementation)

### OD-5: Brand Identity
**Question**: Is the current logo (cartoon tropical island) the final brand mark, or should a new identity be designed?

**Current state**: The logo is a generic clipart-style illustration. The property name varies between "South Goa Garden Villa", "Luxury Vacation villa", and "Goa Garden Resort" (inferred from email domain).

**Impact**: The logo and brand name affect the entire visual identity, typography treatment, and first impression.

---

### OD-6: Photography
**Question**: Are additional professional photographs available, or should the modernized site work only with the existing 20 images?

**Current state**: 
- ~20 images, most taken via phone/WhatsApp
- Some have text overlays burned in ("BEDROOM", "LIVING ROOM")
- One has a watermark (addtext.com)
- Filenames are auto-generated WhatsApp names
- Several images are unused (in `pics/` but not in HTML)
- Two images are extremely large (3.5 MB each)

**Impact**: Photography quality is the single biggest factor in perceived resort quality. The design brief calls for "authentic property photography" but the current assets have significant quality limitations.

---

### OD-7: Contact Information
**Question**: Is `goagardenresort@gmail.com` the correct business email? Should there be a web contact form?

**Current state**: Email is displayed as plain text in the footer ([index.html:203](file:///c:/GGR/index.html#L203)). No `mailto:` link. No contact form.

**Impact**: Determines whether to add an enquiry form (requires backend email delivery) or keep email/WhatsApp as the only channels.

---

### OD-8: Content Pages
**Question**: Are additional pages needed beyond the current single-page layout?

**Current state**: The entire site is one page (index.html) plus an orphan test page. The planning documents suggest adding: Dining, Experiences, Offers, Gallery, Location, About/Journal.

**Impact**: Determines the scope of content creation, URL structure, and information architecture.

---

### OD-9: Target Audience and Languages
**Question**: Who is the primary guest (domestic Indian travelers, international tourists, families, couples)? Is multi-language support needed?

**Current state**: Content is in English. Phone number is Indian (+91). Location is in Goa (popular with both domestic and international tourists).

**Impact**: Affects copy tone, currency display, language support, and payment options.

---

## 🟢 Lower Priority (Can Be Decided During Implementation)

### OD-10: Analytics and Conversion Tracking
**Question**: Which analytics platform should be used, and what events should be tracked?

**Impact**: Affects script loading, cookie consent, and success metrics.

---

### OD-11: Legal Pages
**Question**: Are privacy policy, terms & conditions, or cancellation policy pages required?

**Impact**: May be legally required depending on jurisdiction and payment handling.

---

### OD-12: Social Media Presence
**Question**: Does the resort have Instagram, Facebook, TripAdvisor, or Google Business profiles that should be linked?

**Impact**: Affects footer content, social proof, and structured data.

---

### OD-13: Maps and Directions
**Question**: Should the site include an interactive map with directions?

**Impact**: Requires Google Maps API key or alternative map provider.

---

### OD-14: The GGR.zip Archive
**Question**: What does `GGR.zip` (31 MB) contain? Is it a backup of a previous version, or the same site files?

**Impact**: May contain additional assets, a different version, or an earlier design that should be reviewed.
