# Legacy Baseline

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| Markup | HTML5 | 2 files (`index.html`, `test.html`), no templating |
| Styling | Vanilla CSS | 1 file (`styles.css`, 588 lines, 10.8 KB), no preprocessor |
| Scripting | Vanilla JavaScript | 1 file (`script.js`, 112 lines, 3.7 KB), no framework |
| Fonts | Google Fonts (remote) | Alex Brush + Playfair Display via CSS `@import` |
| Build system | **None** | No `package.json`, no bundler, no minifier, no task runner |
| Framework | **None** | Pure static HTML |
| Server hints | Apache (inferred) | `.htaccess` file present in `pics/` |

---

## Repository State

| Attribute | Value |
|---|---|
| Git remote | `https://github.com/Premsaldana/GGR.git` |
| Branch | `brownfield-branch` (current), `main` (also exists, same commit) |
| Commits | 1 total: `9f20b46 — Brownfield initalization` |
| `.gitignore` | **Not present** |
| Untracked files | `What Can You Do_ (1)/` directory (planning docs) |
| Archive | `GGR.zip` (31 MB, committed to repo — likely a duplicate/backup of the same files) |

---

## File Inventory

### Application Files (6)
| File | Size | Purpose |
|---|---|---|
| [index.html](file:///c:/GGR/index.html) | 9.6 KB (209 lines) | Main (and only production) page |
| [test.html](file:///c:/GGR/test.html) | 3.6 KB (113 lines) | Standalone accommodation card prototype with inline CSS |
| [script.js](file:///c:/GGR/script.js) | 3.7 KB (112 lines) | Image slider + hamburger menu + video play helper |
| [styles.css](file:///c:/GGR/styles.css) | 10.8 KB (588 lines) | All styling including media queries |
| [Logo-removebg-preview-...png](file:///c:/GGR/Logo-removebg-preview-qq6wh6g4wz82nc76ok0qaufradm5peq1sm7h835v5s.png) | 19 KB | Property logo (cartoon tropical island) |
| [GGR.zip](file:///c:/GGR/GGR.zip) | 31 MB | Archive — contents unknown (see OD-14) |

### Media Assets: `pics/` (21 files including .htaccess)
- 18 image files (JPEG/JPG/PNG): ~11.6 MB total
- 1 video file (MP4): 19.3 MB (commented out; not actively used)
- 1 favicon/icon file (ICO): 17 KB (used as WhatsApp widget icon)
- 1 `.htaccess`: 75 bytes (enables directory listing)

### Media Assets: `vid/` (1 file)
- 1 video file (MP4): 9.6 MB (used in "Explore Our Villa" section)

### Planning Documents: `What Can You Do_ (1)/` (6 files)
- Not part of the legacy application; planning/design docs for modernization

---

## JavaScript Behavior Analysis

### script.js — Three Functional Blocks

#### Block 1: Image Slider (lines 1–86)
- **DOMContentLoaded** listener
- Manages a slide index, shows/hides `.slide` elements
- Auto-advances every **3 seconds** (`setInterval`)
- Supports prev/next buttons and arrow key navigation
- Has video play/pause logic for slides containing `<video>` (currently no video slides are active — commented out)
- **Bug**: The `play-pause-btn` selector references elements that don't exist in the current HTML
- **Accessibility issue**: Arrow key listeners are global, not scoped to the slider

#### Block 2: Hamburger Menu (lines 92–103)
- **DOMContentLoaded** listener (second one — both fire independently)
- Dynamically creates a `<button class="menu-toggle">` with ☰ character
- Appends it to `<header>`
- Toggles `.active` class on `nav ul` on click
- **Issue**: Menu button is created by JS — if JS fails, no mobile navigation exists
- **Issue**: No ARIA attributes (`aria-expanded`, `aria-controls`, etc.)

#### Block 3: Video Play Helper (lines 106–112)
- Function `playVideo()` — hides thumbnail and play button, shows and plays `#villaVideo`
- **Not called anywhere** in the current HTML — appears to be dead code from a previous design
- The current video section uses native `<video controls autoplay muted>` instead

### Inline JavaScript
- [index.html:44–45](file:///c:/GGR/index.html#L44-L45): `onclick="changeSlide(-1)"` and `onclick="changeSlide(1)"` on slider buttons
- **Issue**: `changeSlide()` is defined inside a `DOMContentLoaded` closure and not globally accessible — these inline handlers **silently fail**
- The slider still works because `script.js` also adds `addEventListener` to `.prev` and `.next` buttons

---

## CSS Analysis

### Structure
- 588 lines, single file, no preprocessor
- Contains **massive duplication** — approximately 50% of the file is a copy of the other 50% with minor variations
- Two `@import` for Google Fonts (one duplicated)
- No CSS custom properties (no `--variables`)
- No CSS reset or normalize

### Key Observations
- `.heading::after` creates a gold (`#C89722`) underline for section headings — this is the only brand-like color in the CSS
- `#hero` rule references `hero-image.jpg` which does not exist — dead CSS
- `.room` class is defined but never used in HTML — dead CSS
- `form` styles exist but there are no forms in the HTML — dead CSS
- CSS has a syntax error near line 48 (orphaned comment closer)

### Breakpoints
| Width | Changes |
|---|---|
| ≤1024px | Accommodation cards stack vertically |
| ≤768px | Header reflows, hamburger shows, nav becomes dropdown, video goes 100% width |
| ≤480px | Smaller logo, fonts, padding, slider buttons |

---

## Duplicated, Obsolete, and Suspicious Files

| File | Status | Reason |
|---|---|---|
| `GGR.zip` (31 MB) | Suspicious | Large archive committed to Git; likely contains duplicate site files |
| `pics/DSCN2471.JPG` (3.6 MB) | Unused | Referenced only in a commented-out line ([index.html:37](file:///c:/GGR/index.html#L37)) |
| `pics/accomodation.jpg` | Unused | A screenshot/mockup of a different design; not referenced in any HTML |
| `pics/WhatsApp Video 2024-11-10...mp4` (19.3 MB) | Unused | Referenced only in a commented-out line ([index.html:43](file:///c:/GGR/index.html#L43)) |
| 6 WhatsApp images (2022/2023/2024) | Unused | Present in `pics/` but not referenced in any HTML file |
| `test.html` | Orphan | No inbound links; appears to be a development prototype |
| CSS rules for `#hero`, `.room`, `form` | Dead CSS | Reference elements or files that don't exist |
| `playVideo()` function | Dead code | Defined but never called |
| `changeSlide()` inline `onclick` | Silent failure | Called inline but defined in closure — handlers never execute |
| Second half of `styles.css` (lines ~275+) | Duplicated | Near-complete repeat of the first half |

---

## Rollback Plan

The legacy site is fully preserved in:
1. Git commit `9f20b46` on both `main` and `brownfield-branch`
2. All original files remain at the workspace root, unmodified
3. `GGR.zip` may contain an additional archive copy

To restore: check out commit `9f20b46` and deploy the static files to any web server.
