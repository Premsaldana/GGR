# CMS / Admin Plan

**CMS**: Sanity.io  
**Admin interface**: Sanity Studio (web-based; hosted by Sanity)  
**Authentication**: Sanity's built-in user management + Google OAuth  
**Status**: Proposed — awaiting booking provider confirmation before CMS setup

---

## Roles and Permissions

### Role: Owner / Admin
**Who**: Resort owner, lead developer

| Permission | Allowed |
|---|---|
| Publish / unpublish any content | ✅ |
| Delete documents | ✅ |
| Edit all fields including admin-only fields (bookingEnginePropertyId, bookingEngineRoomCode, couponCodes) | ✅ |
| View and manage enquiries | ✅ |
| View audit log | ✅ |
| Manage Sanity users and roles | ✅ |
| Access environment variables / secrets | ✅ (Vercel dashboard only — not in Studio) |
| Create/manage booking engine account | ✅ (External provider dashboard) |
| Manage payment gateway account | ✅ (External provider dashboard) |

### Role: Content Editor
**Who**: Marketing staff, someone updating room descriptions, gallery, FAQs, offers

| Permission | Allowed |
|---|---|
| Create and edit documents (Room, Offer, Experience, DiningVenue, GalleryAsset, FAQ, Policy) | ✅ |
| Upload and edit images (with required alt text) | ✅ |
| Save drafts | ✅ |
| Preview draft content on staging | ✅ |
| Publish (push live) | ❌ — requires Admin approval |
| View booking engine admin-only fields | ❌ |
| View coupon codes | ❌ |
| Access booking engine account or dashboard | ❌ |
| Access payment gateway account | ❌ |
| View enquiry personal data | ❌ |
| Delete documents | ❌ |

### Role: Operations / Reservations
**Who**: Front desk staff who respond to enquiries

| Permission | Allowed |
|---|---|
| View enquiry list and details | ✅ |
| Update enquiry status (responded / closed) | ✅ |
| View published room, offer, policy content | ✅ |
| Edit any content | ❌ |
| Publish content | ❌ |
| View booking engine admin fields | ❌ |
| Access payment gateway account | ❌ |

> [!CAUTION]
> **Booking engine credentials, payment gateway API keys, and webhook secrets must never appear in Sanity Studio, CMS documents, or any field visible to content editors or operations staff.** These must live exclusively in Vercel environment variables, accessible only to the admin/owner via the Vercel dashboard. If a booking engine room code or property ID must be editable by staff, only admin role should see this field.

---

## Content Management Workflows

### 1. Add a New Room / Villa

1. Admin or Editor opens Sanity Studio → Rooms → New Room
2. Fills: slug (auto-generated from name), name, shortDescription, longDescription, capacity fields, bedrooms/bathrooms, heroImage (with alt text), gallery images, amenities (reference picker), highlights, policies
3. Admin-only: fills `bookingEngineRoomCode` (the unit code in the booking engine's dashboard)
4. Saves as **Draft**
5. **Preview**: Admin opens the preview URL to review the live-rendered room detail page before publishing
6. Admin clicks **Publish**
7. Sanity fires a revalidation webhook → Next.js ISR regenerates `/stay/[slug]` and `/stay` pages
8. New room is live on the website within ~10 seconds

### 2. Update Room Rate Display

1. Admin or Editor opens Room document → edits `startingRate.amount` and/or `rateDisplayNote`
2. Note: **This is a display label only** — actual rates are managed in the booking engine's admin dashboard. The website shows "From ₹X/night" as guidance, not as a live rate.
3. Saves → Publishes → ISR regenerates the page

> [!IMPORTANT]
> The booking engine is the single source of truth for rates and availability. Never display a specific live rate from the booking engine's API in a statically generated page — it will become stale. Show only a "starting from" display rate from the CMS as marketing context, and let the booking engine's widget show actual current rates.

### 3. Publish a New Offer / Package

1. Editor creates Offer document, fills content, sets `validFrom` / `validTo`
2. If there is a promo code from the booking engine, **Admin** enters it in the `bookingEngineOfferCode` field (Editor cannot see this field)
3. Editor sets status to Draft → Admin reviews and publishes
4. ISR regenerates `/offers/[slug]`

### 4. Upload and Manage Gallery

1. Editor opens Gallery → New Gallery Asset
2. Uploads image (Sanity handles image compression and CDN delivery)
3. **Must fill alt text** — the schema validates this field as required; publish is blocked without it
4. Assigns a category (pool, rooms, garden, etc.)
5. Sets `featured: true` if this image should appear on the homepage
6. Saves and publishes
7. Gallery page and homepage are revalidated

### 5. Manage FAQs

1. Editor creates or edits FAQ documents
2. Organizes by category (booking, check-in, facilities, payment, policies)
3. Sets order integer for display sequence
4. Publishes → FAQ page revalidated

### 6. View and Respond to Enquiries

1. Operations staff opens Sanity Studio → Enquiries
2. Read-only list showing: name, email, room of interest, dates, message, submission time, email delivery status
3. Staff replies via the email address shown in the enquiry — **not through Sanity** (no reply function in CMS)
4. Staff marks enquiry as `responded` or `closed` using the status field
5. **Personal data is visible only in the Operations and Admin role documents** — not visible to Content Editors

### 7. Update Policies

1. Admin or Editor opens Policy document
2. Edits rich text content
3. Publishes — the `_updatedAt` field is automatically updated and displayed to guests as "Last updated: [date]"

---

## Image Management Rules

| Rule | Detail |
|---|---|
| Alt text required | Validated in Sanity schema; publishing is blocked without alt text |
| Focal point | Set per image; prevents faces and key subjects from being cropped out on mobile |
| Max upload size | Sanity accepts up to 100 MB; but uploads should be under 10 MB JPEG/PNG |
| Format | Sanity's CDN serves WebP automatically when the browser supports it |
| Usage context | Tag each image as `hero`, `card`, `gallery`, or `thumbnail` to enable correct sizing |
| Do not use AI-generated images to represent rooms or amenities that do not exist at the property | Stated in design brief |
| Do not use images with text overlays as primary hero images | The "BEDROOM" / "LIVING ROOM" overlay images should be replaced before launch |
| Watermarked images | The `Living room.jpg` watermark must be removed or the image replaced before use |

---

## SEO Fields Workflow

Every Room, Offer, Experience, and Policy document includes SEO fields:
- `seoTitle`: if blank, Next.js falls back to the document's `name` field + " | South Goa Garden Villa"
- `seoDescription`: if blank, falls back to `shortDescription`
- `seoImage`: if blank, falls back to `heroImage`

The `SiteSetting` document has default SEO fields applied to every page that does not override them.

Sanity Studio shows a live character count for `seoTitle` (target: 50–60 chars) and `seoDescription` (target: 150–160 chars). The editor can see the SEO preview before publishing.

---

## Backup and Recovery

| What | How | Frequency |
|---|---|---|
| Sanity content | Sanity Cloud has automatic daily snapshots | Daily |
| Sanity content export | GROQ export script (can be scripted via Sanity CLI: `sanity dataset export`) | On demand / weekly |
| Media assets | Stored in Sanity's asset store (CDN); not in Git | Backed up by Sanity |
| Next.js application code | Git on `brownfield-branch`; push to GitHub | On every commit |
| Environment variables | Vercel dashboard; owner must maintain a secure offline copy | Owner responsibility |
| Enquiry log | Stored in Sanity; included in dataset export | Daily (automatic) |

> [!WARNING]
> Environment variables (API keys, webhook secrets) are stored in Vercel's environment variable system. If Vercel becomes unavailable, the owner must have these stored securely elsewhere (e.g., a password manager). Never commit secrets to Git.

---

## Sanity Studio Desk Structure

The Sanity Studio sidebar will be organized as:

```
South Goa Garden Villa
├── 🏨 Property Settings (SiteSetting — singleton)
├── 🛏 Rooms & Villas (Room documents)
├── 🎁 Offers & Packages (Offer documents)
├── 🌊 Experiences (Experience documents)
├── 🍽 Dining (DiningVenue documents)
├── 🖼 Gallery (GalleryAsset documents)
├── ❓ FAQs (FAQ documents)
├── 📜 Policies (Policy documents)
├── 📩 Enquiries (Enquiry — read-only for Operations role)
└── 📋 Audit Log (AuditEvent — read-only for Admin)
```

Admin-only sections (Enquiries, Audit Log, and admin fields within Room/Offer) are hidden from Content Editor role using Sanity's document-level access control.

---

## Authentication

- **Sanity Studio login**: Sanity's managed identity; Google OAuth supported; staff log in with Google accounts
- **No separate admin login is needed** for the marketing site — Sanity Studio is the admin panel
- **Draft preview** on the Next.js public site: protected by Next.js `draftMode()` + a secret token; only staff with the preview URL and token can see draft content
- **API routes** (`/api/enquiry`, `/api/booking-webhook`, `/api/revalidate`) are protected by: HMAC secret verification for webhooks, Zod validation + rate limiting for enquiry, and a shared secret for revalidation

---

## Staff Training Checklist

Before handing the CMS to resort staff, the following must be completed:

- [ ] At least two staff accounts created and tested (admin + editor)
- [ ] All 3 rooms fully documented and published with correct images and alt text
- [ ] All amenities tagged and categorized
- [ ] All active offers entered
- [ ] FAQ content entered and categorized
- [ ] Cancellation and check-in policies published
- [ ] Staff have tested enquiry submission flow end-to-end
- [ ] Staff know how to: upload images, write alt text, save drafts, request publish, preview, and update room descriptions
- [ ] Staff know NOT to: share Sanity Studio URL publicly, store booking engine credentials in CMS documents, or publish guest enquiry data
