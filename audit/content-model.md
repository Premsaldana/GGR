# Content Model

**CMS**: Sanity.io  
**Language**: TypeScript schemas in `sanity/schemas/`  
**Status**: Proposed — not yet implemented

> [!NOTE]
> This model covers only the **marketing and content layer**. Availability, reservations, payments, and cancellations are owned by the external booking engine (BookingJini or eZee) and are **not modeled here**. Do not duplicate reservation data into Sanity.

---

## Shared Field Fragments

### `seoFields` (reusable fragment)
Applied to all publishable entities.

| Field | Type | Required | Notes |
|---|---|---|---|
| `seoTitle` | string | No | Overrides default title in `<title>` and OG |
| `seoDescription` | string | No | `<meta name="description">` and OG description |
| `seoImage` | image | No | OG image; falls back to first media asset |
| `canonicalUrl` | url | No | Override for canonical `<link>` (rarely needed) |
| `noIndex` | boolean | No | Default false; set true for draft/unlaunched pages |

### `imageWithMeta` (reusable type)

| Field | Type | Required | Notes |
|---|---|---|---|
| `asset` | image | Yes | Sanity-hosted image asset |
| `alt` | string | **Yes** | Accessibility required; validated in schema |
| `caption` | string | No | |
| `focalPoint` | object (x, y) | No | For crop centering; used by `@sanity/image-url` |
| `usageContext` | string (enum) | No | `hero`, `card`, `gallery`, `thumbnail` |
| `priority` | boolean | No | If true, image gets `loading="eager"` in `<img>` |

---

## Entity: `SiteSetting` (Singleton)

One document. Represents the resort's global identity and contact information.

| Field | Type | Required | Notes |
|---|---|---|---|
| `propertyName` | string | Yes | Canonical name: "South Goa Garden Villa" |
| `tagline` | string | No | Short positioning statement |
| `logo` | imageWithMeta | Yes | |
| `phone` | string | Yes | E.164 format: +917813093075 |
| `whatsappNumber` | string | Yes | E.164; used for wa.me/ links |
| `email` | string | Yes | |
| `address` | object | Yes | street, city, state, postalCode, country, googleMapsUrl |
| `latitude` | number | No | For structured data |
| `longitude` | number | No | For structured data |
| `socialLinks` | array of {platform, url} | No | Instagram, Facebook, TripAdvisor, Google Business |
| `seo` | seoFields | No | Default OG/meta for the entire site |
| `bookingEnginePropertyId` | string | Yes | Used to configure booking widget; **visible only to admin role** |
| `bookingEngineName` | string | Yes | `bookingjini` or `ezee` |

---

## Entity: `Room`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | Sanity document ID |
| `slug` | slug | Yes | URL-safe; e.g., `1-bedroom-villa`, `4-bedroom-villa` |
| `name` | string | Yes | Canonical display name: "1 Bedroom Villa" |
| `shortDescription` | string | Yes | 1–2 sentence summary for listing cards (max 160 chars) |
| `longDescription` | array (block content) | Yes | Rich text body for detail page |
| `type` | string (enum) | Yes | `villa`, `apartment`, `suite` |
| `capacity` | object | Yes | `adults` (int), `children` (int), `maxTotal` (int) |
| `bedrooms` | integer | Yes | |
| `bathrooms` | integer | Yes | |
| `area` | object | No | `value` (number), `unit` (sqft / sqm) |
| `startingRate` | object | No | `amount` (number), `currency` (INR / USD), `per` (night / stay); **display only — booking engine owns actual rates** |
| `rateDisplayNote` | string | No | e.g., "Rates vary by season. Check availability for current prices." |
| `heroImage` | imageWithMeta | Yes | Primary image for card and detail page |
| `gallery` | array of imageWithMeta | No | Additional images; ordered |
| `highlights` | array of string | No | 3–6 key selling points for listing card |
| `amenities` | array of reference (Amenity) | No | |
| `bookingEngineRoomCode` | string | No | Room/unit identifier in the booking engine; **admin-only field** |
| `included` | array of string | No | What's included in the rate |
| `policies` | array of reference (Policy) | No | Cancellation, pets, check-in time, etc. |
| `seo` | seoFields | No | Per-room SEO override |
| `status` | string (enum) | Yes | `draft`, `published`, `hidden` |
| `order` | integer | No | Display order in listing (lower = first) |
| `_createdAt` | datetime | Auto | |
| `_updatedAt` | datetime | Auto | |

---

## Entity: `Amenity`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `name` | string | Yes | e.g., "Swimming Pool", "Free WiFi" |
| `icon` | string | No | Icon name from the project's icon set |
| `category` | string (enum) | Yes | `facilities`, `bedroom`, `bathroom`, `transport`, `safety`, `dining`, `outdoor`, `reception` |
| `description` | string | No | Optional short clarification |

---

## Entity: `Offer`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `slug` | slug | Yes | |
| `title` | string | Yes | |
| `shortDescription` | string | Yes | |
| `longDescription` | array (block content) | No | |
| `heroImage` | imageWithMeta | Yes | |
| `gallery` | array of imageWithMeta | No | |
| `offerType` | string (enum) | No | `earlybird`, `lastminute`, `package`, `seasonal`, `other` |
| `rooms` | array of reference (Room) | No | Which rooms this offer applies to |
| `validFrom` | date | No | |
| `validTo` | date | No | |
| `bookingEngineCouponCode` | string | No | Promo code in the booking engine; **admin-only field** |
| `ctaText` | string | No | e.g., "Book This Offer" |
| `ctaLink` | url | No | Link to booking engine filtered by offer |
| `seo` | seoFields | No | |
| `status` | string (enum) | Yes | `draft`, `published`, `archived` |
| `order` | integer | No | |

---

## Entity: `Experience`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `slug` | slug | Yes | |
| `title` | string | Yes | |
| `shortDescription` | string | Yes | |
| `longDescription` | array (block content) | No | |
| `heroImage` | imageWithMeta | Yes | |
| `gallery` | array of imageWithMeta | No | |
| `category` | string (enum) | No | `water`, `wellness`, `adventure`, `cultural`, `dining`, `transport` |
| `duration` | string | No | e.g., "Half day", "2 hours" |
| `included` | array of string | No | What's included |
| `booking` | object | No | `type` (included/book-separately/enquire), `link` (url) |
| `seo` | seoFields | No | |
| `status` | string (enum) | Yes | `draft`, `published` |
| `order` | integer | No | |

---

## Entity: `DiningVenue`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `name` | string | Yes | |
| `description` | array (block content) | No | |
| `heroImage` | imageWithMeta | No | |
| `gallery` | array of imageWithMeta | No | |
| `mealTypes` | array of string (enum) | No | `breakfast`, `lunch`, `dinner`, `allday`, `poolside` |
| `openingHours` | string | No | |
| `menuHighlights` | array of string | No | |
| `bookingRequired` | boolean | No | |

---

## Entity: `GalleryAsset`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `image` | imageWithMeta | Yes | alt text required |
| `category` | string (enum) | No | `rooms`, `pool`, `garden`, `exterior`, `dining`, `amenities` |
| `featured` | boolean | No | Featured in homepage gallery section |
| `order` | integer | No | Display order within category |

---

## Entity: `FAQ`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `question` | string | Yes | |
| `answer` | array (block content) | Yes | |
| `category` | string (enum) | No | `booking`, `checkin`, `facilities`, `payment`, `policies`, `transport` |
| `order` | integer | No | |
| `status` | string (enum) | Yes | `draft`, `published` |

---

## Entity: `Policy`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | Auto | |
| `title` | string | Yes | e.g., "Cancellation Policy", "Pet Policy" |
| `slug` | slug | Yes | |
| `content` | array (block content) | Yes | |
| `type` | string (enum) | Yes | `cancellation`, `payment`, `checkin`, `pets`, `children`, `smoking`, `other` |
| `seo` | seoFields | No | |
| `status` | string (enum) | Yes | `draft`, `published` |
| `_updatedAt` | datetime | Auto | Used to show "Last updated" to guests |

---

## Entity: `Enquiry` (Server-Created, Read-Only in CMS)

Enquiries are created by the `/api/enquiry` API route — never directly from the CMS editor. They are read-only in Sanity Studio for the operations role.

| Field | Type | Notes |
|---|---|---|
| `_id` | string | Auto |
| `submittedAt` | datetime | Server-set |
| `name` | string | From form |
| `email` | string | From form |
| `phone` | string | From form (optional) |
| `roomInterest` | string | Which room/villa from dropdown |
| `checkInDate` | date | From form (optional) |
| `checkOutDate` | date | From form (optional) |
| `message` | string | From form; max 1000 chars |
| `emailDeliveryStatus` | string | `delivered`, `failed` |
| `source` | string | `contact-form`, `room-detail`, `offer-page` |
| `ipHash` | string | Hashed IP for rate-limiting audit (not raw IP) |

> [!CAUTION]
> **Do not log raw guest message content unnecessarily in analytics or error tracking systems.** The enquiry document exists for operational response only. Define a retention/deletion policy before launch (e.g., delete after 24 months).

---

## Entity: `AuditEvent` (System-Created)

Automatic log of significant CMS changes. Created by GROQ mutations on publish/unpublish/delete actions (or via a Sanity webhook to a custom audit log table).

| Field | Type | Notes |
|---|---|---|
| `_id` | string | Auto |
| `timestamp` | datetime | |
| `userId` | string | Sanity user ID |
| `userEmail` | string | |
| `action` | string | `publish`, `unpublish`, `delete`, `update` |
| `documentType` | string | `room`, `offer`, etc. |
| `documentId` | string | |
| `documentTitle` | string | Human-readable label |

---

## Draft / Publish Workflow

```
Content Editor creates/edits document
  ↓
Status: "draft" (not visible on live site)
  ↓
Editor requests review → Owner/Admin reviews in Sanity Studio "Preview" mode
  ↓ (approved)
Owner/Admin clicks "Publish"
  ↓
Sanity fires a webhook → /api/revalidate → Next.js ISR re-generates the affected page
  ↓
New content visible on live site within seconds
```

**Preview**: Sanity Studio + Next.js draft mode (`draftMode()`) enables a preview URL for unpublished content visible only to authenticated staff.

**Rollback**: In Sanity, use "History" to restore a previous published version of any document. ISR re-runs and new content is live within seconds.
