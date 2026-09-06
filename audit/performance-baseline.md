# Performance Baseline

## Technology Summary

| Attribute | Value |
|---|---|
| Type | Purely static HTML/CSS/JS — no build system, no bundler, no framework |
| HTML files | 2 (`index.html`, `test.html`) |
| CSS files | 1 (`styles.css`, 10.8 KB) |
| JS files | 1 (`script.js`, 3.7 KB) |
| Total image weight (used) | ~11.5 MB across 8 images referenced in index.html |
| Total video weight | ~29 MB (9.6 MB in `vid/`, 19.3 MB in `pics/` — only the 9.6 MB one is actively used) |
| External CSS | 2 Google Fonts via `@import` (render-blocking) |
| External JS | None |
| Build system | None (no `package.json`, no bundler, no preprocessor) |
| Minification | None |

---

## Critical Performance Issues

### 1. Enormous Image Sizes (No Optimization)
All images are served at original resolution with no compression, no responsive `srcset`, no WebP/AVIF, and no explicit `width`/`height` attributes.

| Image | File Size | Issue |
|---|---|---|
| `pics/DSCN2471.JPG` | 3.6 MB | Commented out but still in the repository |
| `pics/DSCN2468.JPG` | 3.5 MB | Served as-is for 1BHK listing |
| `pics/5bhk.jpeg` | 2.2 MB | Served as-is in slider + listing |
| `pics/4bhk.jpeg` | 1.2 MB | Served as-is in slider + listing |
| Remaining images | 55–212 KB each | Reasonable sizes but still unoptimized |

**Impact**: A first-time visitor on mobile downloads approximately **7+ MB of images** just from the visible slider and accommodations section, before any video loads.

### 2. Autoplay Video (9.6 MB)
- [index.html:98](file:///c:/GGR/index.html#L98): `<video autoplay muted>` loads a 9.6 MB MP4
- No `poster` attribute — no preview image while loading
- No `preload="none"` — browser may eagerly download the full file
- First `<source>` path points to a non-existent root-level file (falls through to second `<source>`)

### 3. Render-Blocking Google Fonts
- [styles.css:2](file:///c:/GGR/styles.css#L2) and [styles.css:5](file:///c:/GGR/styles.css#L5): `@import` inside CSS blocks rendering
- Should use `<link rel="preload">` or `<link>` with `display=swap` in HTML `<head>`
- Playfair Display import is **duplicated** at line 280

### 4. Script in `<body>` Before Content
- [index.html:10](file:///c:/GGR/index.html#L10): `<script src="script.js">` is placed at the top of `<body>` without `defer` or `async`
- This blocks HTML parsing until the script is downloaded and executed
- The script relies on `DOMContentLoaded` internally, so it could safely use `defer`

### 5. No Lazy Loading
- No `loading="lazy"` on any image
- All slider images (including hidden ones) load eagerly on page load
- No `IntersectionObserver` or scroll-triggered loading

### 6. Duplicate CSS
- The entire CSS file contains massive duplication:
  - `.heading` rule appears twice (lines 14–23 and 282–291)
  - `body` rule appears twice (lines 53–58 and 302–307)
  - `header` rule appears twice (lines 60–65 and 309–314)
  - `nav ul` appears twice (lines 67–70 and 316–319)
  - `#accommodations` appears twice (lines 71–76 and 320–323)
  - `footer` appears twice (lines 107–112 and 353–358)
  - `@media 768px` appears twice (lines 415–463 and 551–577)
  - `@media 480px` appears twice (lines 465–483 and 579–586)
  - `@import` for Playfair Display appears twice (lines 5 and 280)
- The second half of `styles.css` (lines ~275–588) largely duplicates the first half with minor variations

### 7. CSS Syntax Error
- [styles.css:48](file:///c:/GGR/styles.css#L48): Orphan `*/` closing a multi-line comment that was incorrectly nested, leaving an invalid `}` fragment

### 8. No Image Dimensions
- No `width` or `height` attributes on `<img>` elements → causes Cumulative Layout Shift (CLS)
- Object-fit CSS is applied but browser cannot reserve space before image loads

---

## Estimated Page Weight (index.html)

| Resource | Size |
|---|---|
| HTML | 9.6 KB |
| CSS (styles.css) | 10.8 KB |
| JS (script.js) | 3.7 KB |
| Google Fonts (2 families) | ~50–80 KB (estimated) |
| Logo PNG | 19 KB |
| Slider images (6 visible) | ~3.8 MB |
| Accommodation images (3) | ~6.9 MB (some duplicated from slider) |
| WhatsApp widget icon | 17 KB |
| Video (autoplay) | 9.6 MB |
| **Total estimated first load** | **~13–16 MB** |

> [!CAUTION]
> A 13–16 MB initial page load is catastrophic for mobile users, especially in India where many visitors will be on 4G or slower connections. Core Web Vitals (LCP, CLS, FID/INP) will fail badly.

---

## Responsive Behavior

The site has three CSS breakpoints:
- **1024px**: Accommodation containers stack vertically
- **768px**: Header reflows, hamburger menu appears, nav becomes dropdown, WhatsApp widget shrinks
- **480px**: Logo shrinks, container padding reduced, heading/content font sizes reduced, slider nav buttons smaller

**Issues**:
- The hamburger menu is created dynamically via JS ([script.js:92–103](file:///c:/GGR/script.js#L92-L103)) — if JS fails, there is no mobile navigation
- No explicit `<meta name="theme-color">` for mobile browser chrome
- Images are `object-fit: cover` but have no responsive `srcset` or `sizes`
- The slider height is inconsistent: CSS has conflicting rules (500px fixed vs auto) due to duplicate/commented blocks

---

## Accessibility Issues

| Issue | Severity | Location |
|---|---|---|
| Multiple H1 elements (4 total) | High | [index.html:15,57,70,82](file:///c:/GGR/index.html#L15) |
| Empty alt text on slider images (4 of 7) | High | [index.html:35,38,39,41](file:///c:/GGR/index.html#L35) |
| Slider nav buttons lack accessible labels | Medium | [index.html:44–45](file:///c:/GGR/index.html#L44-L45) — only HTML entities ❮/❯ |
| No skip-to-content link | Medium | Missing |
| No ARIA landmarks | Medium | `<header>`, `<nav>`, `<footer>` present (good), but no `<main>`, no `role` attributes |
| WhatsApp widget has no visible text label | Medium | [index.html:192–196](file:///c:/GGR/index.html#L192-L196) |
| No focus styles defined beyond browser defaults | Medium | No `:focus` or `:focus-visible` custom styles in CSS |
| Color contrast potentially insufficient | Medium | White text on `#333` header is acceptable; but gold `#C89722` underline on white may fail |
| Auto-playing video with no pause mechanism | Medium | [index.html:98](file:///c:/GGR/index.html#L98) — has `controls` but autoplays |
| Inline `onclick` handlers on slider buttons | Low | [index.html:44–45](file:///c:/GGR/index.html#L44-L45) |
| `<br>` used for spacing instead of CSS margins | Low | [index.html:60,72,85–87](file:///c:/GGR/index.html#L60) |
| No `<main>` element | Low | Content is directly in `<body>` |
| No reduced-motion support | Medium | No `prefers-reduced-motion` media query; slider auto-advances every 3s |
| Keyboard trap potential in slider | Medium | Arrow keys globally captured ([script.js:62–70](file:///c:/GGR/script.js#L62-L70)) even when not focused on slider |
