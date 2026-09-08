# Integration Inventory

## Third-Party Services

### 1. WhatsApp Business (Primary Booking Channel)
- **Type**: External link / chat handoff
- **Usage**: Two distinct links found
  - **Nav booking link** ([index.html:27](file:///c:/GGR/index.html#L27)): `https://wa.me/+917813093075?text=hey%21%20I%20would%20like%20to%20make%20a%20booking`
  - **Floating widget** ([index.html:193](file:///c:/GGR/index.html#L193)): `https://wa.me/+917813093075?text=Hello!%20I%20would%20like%20to%20inquire%20about%20your%20villa.`
- **Phone number**: +91 7813093075
- **Risk**: WhatsApp is the **only** booking/enquiry mechanism. No web form, no email form, no third-party booking engine. All conversion depends on the guest having WhatsApp installed.
- **Widget icon**: Uses `pics/favicon-64x64.ico` (a favicon file repurposed as the WhatsApp icon; not a standard WhatsApp logo).

### 2. Google Fonts (Remote CSS)
- **Type**: External stylesheet import
- **Usage**: Two `@import` statements in [styles.css](file:///c:/GGR/styles.css):
  - Line 2: `Alex Brush` (cursive display font for the property name `h1`)
  - Line 5 and Line 280 (duplicated): `Playfair Display` (serif heading font)
- **Risk**: Render-blocking imports; both `@import` directives block first paint. The Playfair import is duplicated at two locations in the same file.

### 3. Phone / Tel Protocol
- **Type**: Native `tel:` link
- **Location**: [index.html:18](file:///c:/GGR/index.html#L18)
- **Number**: +91 7813093075
- **Usage**: Header bar click-to-call

---

## Integrations NOT Present (Notable Absences)

| Integration | Present? | Impact |
|---|---|---|
| Analytics (GA, GTM, etc.) | ❌ No | No visitor tracking, no conversion measurement |
| Cookie consent banner | ❌ No | No third-party cookies either, so currently low risk |
| Booking engine (Booking.com, OTA, custom) | ❌ No | All bookings go through WhatsApp only |
| Contact/enquiry web form | ❌ No | No HTML form element on any page |
| Email form submission | ❌ No | Email address listed but no `mailto:` link or form |
| Maps embed (Google/OSM) | ❌ No | Address text only; no interactive map |
| Social media links | ❌ No | No Facebook, Instagram, TripAdvisor, etc. |
| Structured data / JSON-LD | ❌ No | No schema.org markup |
| Sitemap.xml | ❌ No | No XML sitemap |
| Robots.txt | ❌ No | No robots.txt at root |
| Favicon (HTML `<link>`) | ❌ No | `favicon-64x64.ico` exists in `pics/` but is not linked in `<head>` |
| Meta description | ❌ No | No `<meta name="description">` |
| Open Graph / social preview | ❌ No | No OG tags |
| CRM / email marketing | ❌ No | No newsletter signup or CRM script |
| Payment gateway | ❌ No | No payment integration |
| Chat widget (Tawk.to, etc.) | ❌ No | Only the WhatsApp floating button |
| CDN | ❌ No | All assets served locally |
| SSL certificate evidence | ❌ Unknown | No hosting config in repository |

---

## Server-Side Configuration

### Apache .htaccess
- **Location**: [pics/.htaccess](file:///c:/GGR/pics/.htaccess)
- **Content**: `Options +Indexes` and `IndexOptions FancyIndexing NameWidth=* DescriptionWidth=*`
- **Purpose**: Enables Apache directory listing for the `pics/` folder
- **Risk**: **Security concern** — allows anyone to browse and enumerate all image files. Should be disabled in production.

---

## Summary

The current site has **extremely minimal integration surface**. The only external dependencies are Google Fonts (2 families) and WhatsApp (2 links). There is no analytics, no booking engine, no forms, no CRM, no maps, and no structured data. This simplifies migration but means the new site needs to add most integrations from scratch.
