# Resort Website Visual Design Brief

**Working direction:** Place-led editorial luxury

## Design objective

Make the resort feel desirable before the visitor reads every detail. The interface should communicate atmosphere, trust, and ease of booking in that order. The visual system must feel authored for the property’s landscape, architecture, and guest profile rather than assembled from a generic hospitality template.

## Creative principles

| Principle | Application |
|---|---|
| Place before promotion | Lead with the actual landscape, architecture, rituals, and local context rather than stock “luxury” language |
| Editorial pacing | Use asymmetric sections, intentional whitespace, varied image scales, and concise copy |
| Calm confidence | Prefer quiet hierarchy and precise typography over decorative clutter |
| Tactile materiality | Use texture through photography, subtle grain, fine rules, and warm surfaces rather than gradients everywhere |
| Conversion without pressure | Keep booking and enquiry actions visible, but let the narrative earn the click |
| Authenticity | Use approved photography and verifiable claims; do not invent views, amenities, or experiences |

## Starting visual language

Use a warm mineral base such as limestone, sand, or pale shell; a deep botanical, charcoal, or midnight ink for contrast; and one restrained accent drawn from the property, such as oxidized terracotta, brass, saffron, or sea-glass. Avoid default SaaS blues, excessive pure white, high-saturation gradients, and uniform rounded cards.

Pair a distinctive display serif for editorial headlines with a neutral sans-serif for navigation, metadata, forms, and room facts. Define a type scale with a dramatic but readable hero title, compact eyebrow labels, generous body leading, and numerals that remain legible in prices and room specifications.

Use a twelve-column desktop grid with deliberate off-grid moments, a four-column mobile grid, and a spacing scale that makes the site breathe. Let full-bleed photography interrupt contained text sections. Use corners and shadows sparingly; thin rules, tonal surfaces, and image cropping should do most of the structural work.

## Page composition

The homepage should open with a high-impact visual and a compact statement of place, followed by a clear booking action. It should then move through distinctive proof, stay discovery, experiences, dining or wellness, practical reassurance, and a final conversion moment. Avoid a stack of identical three-card sections.

The rooms listing should support comparison. Use room cards with meaningful differences, starting rates only where accurate, capacity, key inclusions, and a clear path to the full detail page. The room detail page should combine a strong image sequence, concise facts, a longer emotional description, inclusions, availability handoff, policies, and nearby alternatives.

The booking or enquiry experience should become more functional and less theatrical. Do not hide forms behind elaborate transitions. Preserve browser history, show validation inline, provide clear error recovery, and make the success state useful.

## Motion system

Use short, deliberate transitions. Hover treatments should usually remain within 100–180 ms; drawers and modals may be longer when their spatial relationship is clear. Use transform and opacity for motion, never motion that delays essential content. Provide a reduced-motion mode and a low-bandwidth fallback for rich hero experiences.

Possible signature moments include a restrained parallax or image reveal, a slow text-and-image editorial transition, and a location narrative. Limit the number of signature moments per route so the site retains calmness and performance.

## Unicorn Studio brief

Use Unicorn Studio only for a signature scene with a clear guest-facing purpose. The scene should have an immediate static fallback, an explicit loading boundary, a mobile simplification, and a measurable performance budget. The embed must not block the first meaningful copy, navigation, booking CTA, or accessibility tree. Validate on a mid-range mobile device and a reduced-motion setting before accepting it.

## 21st.dev adaptation brief

Use 21st.dev for isolated interaction references such as a polished navigation pattern, a responsive gallery, an accessible drawer, or a room comparison interaction. Rebuild the selected pattern using the project’s own tokens and component conventions. Retain only behavior that improves the resort journey. Remove unnecessary dependencies, replace placeholder copy with real content, and test keyboard, touch, reduced motion, loading, empty, and error states.

## Asset rules

Prioritize client-approved photography. For every image, define the intended crop, focal point, aspect ratio, mobile crop, alt text, loading priority, and fallback. Do not use AI-generated imagery to imply that a view, room, amenity, or activity exists. If temporary assets are used during development, mark them clearly and replace them before launch.

## Anti-generic acceptance test

A reviewer should be able to identify at least three property-specific choices in the first viewport without seeing the logo. The site should not be interchangeable with a hotel template if the copy and images are removed. At least one interaction should express the character of the location, and every decorative decision should support atmosphere, comprehension, trust, or conversion.

## Content prompts for the design team

Ask the resort team for the three most defensible reasons guests choose this property, the most photographed or emotionally resonant places on site, the strongest arrival moment, the guest type the resort wants more of, the objections that stop people booking, and the details that staff are proud to explain. Use the answers as source material for the visual narrative.
