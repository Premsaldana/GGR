# SEO Baseline

## Current SEO State: ❌ Extremely Weak

The legacy site has almost no SEO infrastructure. A search engine will index the page but with minimal semantic understanding, no structured data, and weak metadata.

---

## Page-Level Metadata

### index.html
| Element | Present? | Value | Issue |
|---|---|---|---|
| `<html lang>` | ✅ | `en` | Correct |
| `<meta charset>` | ✅ | `UTF-8` | Correct |
| `<meta viewport>` | ✅ | `width=device-width, initial-scale=1.0` | Correct |
| `<title>` | ✅ | "Luxury Vacation villa" | Generic, inconsistent with property name "South Goa Garden Villa"; no location keyword; inconsistent capitalization |
| `<meta description>` | ❌ | — | **Missing entirely** |
| `<meta keywords>` | ❌ | — | Missing (low importance) |
| `<link rel="canonical">` | ❌ | — | **Missing** |
| Open Graph tags | ❌ | — | **No OG title, description, image, or URL** — no social preview |
| Twitter Card tags | ❌ | — | Missing |
| `<link rel="icon">` | ❌ | — | Favicon exists in `pics/` but **not linked in HTML** |
| Structured data (JSON-LD) | ❌ | — | **No schema.org markup** (no Hotel, LodgingBusiness, LocalBusiness, etc.) |

### test.html
| Element | Present? | Value | Issue |
|---|---|---|---|
| `<title>` | ✅ | "1 BHK Apartments" | Orphan page with no inbound links from index.html |
| `<meta description>` | ❌ | — | Missing |
| All other SEO elements | ❌ | — | Missing |

---

## Heading Structure

### index.html

```
H1: South Goa Garden Villa (line 15)
  H2: Accommodations (line 49)
    H1: 5 bedroom Villa with private pool (line 57) ← WRONG: should be H2 or H3
    H1: 4 bedroom Villa (line 70) ← WRONG: should be H2 or H3
    H1: 1 bedroom Villa (line 82) ← WRONG: should be H2 or H3
  H2: Explore Our Villa (line 96)
  H2: Amenities (line 107)
    H2: Most Popular Facilities (line 110)
    H2: Bedroom (line 129)
    H2: Parking & Transport (line 137)
    H2: Policies & Payments (line 146)
    H2: Rooms (line 153)
    H2: Reception Services (line 164)
    H2: Safety & Security (line 176)
    H2: Outdoor & View (line 184)
  H2: Contact Us (line 202)
```

**Issues**:
- **Multiple H1 elements**: 4 total (the property name + 3 room names). Should be exactly 1 H1.
- **Flat heading hierarchy**: All amenity sub-sections use H2 instead of H3, creating no meaningful hierarchy.
- Room names should be H2 or H3, not H1.

---

## Sitemap and Robots

| File | Present? |
|---|---|
| `sitemap.xml` | ❌ Not found |
| `robots.txt` | ❌ Not found |

---

## Redirects

No redirect rules found. No `.htaccess` at root level (only in `pics/`). No `_redirects`, `netlify.toml`, `vercel.json`, or equivalent.

---

## Canonicalization

- No `<link rel="canonical">` tag on any page
- No HTTPS/HTTP preference enforcement visible
- No www/non-www normalization visible
- No trailing-slash policy

---

## Crawlability Concerns

1. **`pics/.htaccess` enables directory listing** ([pics/.htaccess:1](file:///c:/GGR/pics/.htaccess#L1)): `Options +Indexes` allows search engines and visitors to browse the raw file list of the images directory.
2. **test.html is orphaned**: No link from index.html points to test.html. It may still be indexed if the URL was previously shared or crawled.
3. **No internal linking**: The site is a single page with anchor links only. No page-to-page navigation.
4. **WhatsApp links use `target="_blank"`** without `rel="noopener"` or `rel="noreferrer"`.

---

## Content SEO

- **No keyword targeting**: The title uses generic "Luxury Vacation villa" rather than location-specific terms like "villa in South Goa", "Colva villa", "Benaulim resort"
- **No location SEO**: The address is in the footer only; there's no structured LocalBusiness or Hotel schema
- **No image SEO**: Most images lack alt text; filenames are auto-generated WhatsApp names (e.g., "WhatsApp Image 2022-06-15...")
- **No internal links**: Everything is on one page with anchors

---

## Mobile SEO

- Viewport meta tag is present and correct
- Hamburger menu is dynamically created via JavaScript ([script.js:92–103](file:///c:/GGR/script.js#L92-L103))
- Media queries at 1024px, 768px, and 480px provide basic responsiveness
- **No AMP** (not needed)
- **No mobile-specific structured data**

---

## Recommendations for Modernization

1. Add unique, descriptive `<title>` tags with location keywords
2. Add `<meta name="description">` with compelling property summary
3. Implement `<link rel="canonical">` on all pages
4. Add `Hotel` or `LodgingBusiness` JSON-LD structured data
5. Add Open Graph and Twitter Card tags for social sharing
6. Create `sitemap.xml` with all public URLs
7. Create `robots.txt` with appropriate directives
8. Fix heading hierarchy to use a single H1
9. Add descriptive alt text to all images
10. Disable directory listing in `pics/`
11. Implement proper `rel="noopener noreferrer"` on external links
