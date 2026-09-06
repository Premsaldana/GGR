/**
 * Rooms content — South Goa Garden Villa
 * ─────────────────────────────────────────
 * Local structured content (Phase 3 — no CMS yet).
 * All facts confirmed from legacy index.html and audit/content-inventory.md.
 *
 * [OWNER APPROVAL NEEDED] comments mark uncertain fields.
 * These MUST be resolved before launch:
 *   - Canonical room names (index.html vs test.html differ)
 *   - Image-room mapping (4bhk.jpeg / 5bhk.jpeg filenames appear SWAPPED)
 *   - Pricing (none exists in legacy site)
 */

import type { Room } from "@/types/content";

/**
 * ─────────────────────────────────────────────
 * IMPORTANT: IMAGE PATH NOTE
 * ─────────────────────────────────────────────
 * Images are served from the legacy /pics/ directory.
 * next.config.ts is configured with images.localPatterns to allow
 * serving these files. The `src` values below are URL paths
 * relative to the Next.js dev server, NOT filesystem paths.
 *
 * Legacy /pics/ is symlinked/copied to modern/public/pics/ via
 * next.config.ts `outputFileTracingIncludes` or served statically.
 * See next.config.ts for the image domain / unoptimized config.
 */

export const rooms: Room[] = [
  {
    slug: "1-bedroom-villa",

    // [OWNER APPROVAL NEEDED]: index.html says "1 bedroom Villa";
    // test.html says "1 BHK Apartments". Using index.html version.
    name: "1 Bedroom Villa",

    shortDescription:
      "A semi-detached private villa with garden retreat and terrace, ideal for up to 4 guests seeking seclusion.",

    // Confirmed from index.html lines 83–88; typos corrected.
    longDescription:
      "This semi-detached private villa has all the facilities as the apartments. Its compact private rear garden and the extensive, private roof garden provide plenty of sun, shade and seclusion where guests can dine and while away the evenings.\n\nThe villa is fully furnished with a double sofa bed in the living room and a king-size double bed in the bedroom. An additional single mattress can be made up on request. The safe is in the wardrobe. The modern, western-style bathroom is complete with a bathtub, shower, and dual electrical sockets.",

    capacity: {
      // Confirmed: index.html line 85 "maximun of 4 guests" (typo in original)
      maxGuests: 4,
      bedrooms: 1,
      bathrooms: 1,
    },

    heroImage: {
      // Confirmed: index.html line 79 — used for 1BHK listing
      // Note: 3.5 MB file — next/image will optimise automatically
      src: "/pics/DSCN2468.JPG",
      // [OWNER APPROVAL NEEDED]: alt text from legacy says "1 BHK Apartment" — updated to match canonical name pending owner confirmation
      alt: "Pool and blue Portuguese-style villa exterior — 1 Bedroom Villa, South Goa Garden Villa",
      width: 1280,
      height: 853,
      priority: true,
    },

    gallery: [
      {
        src: "/pics/Bedroom.jpg",
        // Note: this image has "BEDROOM" text burned into it (see content-inventory.md)
        // Used in gallery only, not as hero. [OWNER APPROVAL NEEDED]: replace with clean image.
        alt: "Bedroom interior with king-size bed and wooden wardrobe — note: image has text overlay",
        width: 800,
        height: 600,
      },
      {
        src: "/pics/380369512.jpg",
        alt: "Bathroom with bathtub and green tile",
        width: 800,
        height: 600,
      },
    ],

    highlights: [
      "Private rear garden and roof terrace",
      "King-size bed + sofa bed (sleeps up to 4)",
      "Western-style bathroom with bathtub",
      "Safe in wardrobe",
      "Dual electrical sockets",
      "Seclusion and privacy",
    ],

    amenities: [
      "Air Conditioning",
      "Free WiFi",
      "Bathtub",
      "King-size Bed",
      "Sofa Bed",
      "Private Garden",
      "Terrace / Roof Garden",
      "Wardrobe / Closet",
      "Safe",
      "Tile / Marble Floor",
      "Fan",
    ],

    _contentWarnings: [
      "gallery[0] (Bedroom.jpg): has 'BEDROOM' text burned into the image — replace before launch",
      "gallery[1] (380369512.jpg): filename is auto-generated — rename before launch",
      "heroImage: DSCN2468.JPG is 3.5 MB — next/image optimises automatically but original should be replaced with professional photo",
      "Canonical room name unconfirmed — 'BHK' vs 'Bedroom Villa' inconsistency in legacy files",
    ],
  },

  {
    slug: "4-bedroom-villa",

    // [OWNER APPROVAL NEEDED]: index.html says "4 bedroom Villa"
    name: "4 Bedroom Villa",

    shortDescription:
      "Four luxury 1-bedroom apartments around a common pool, accommodating up to 16 guests.",

    // Confirmed from index.html lines 72–74; typos corrected.
    longDescription:
      "Four luxury 1-bedroom apartments, each sleeping a maximum of 4 guests. The villa has a common swimming pool and can accommodate up to 16 guests in total.\n\nAll suites sleep four adults and are tastefully designed, each with two air-conditioning units, one bedroom and one lounge with additional overhead fans. There is broadband internet connection to all suites and a business workstation in the reception.",

    capacity: {
      maxGuests: 16,
      bedrooms: 4,
      bathrooms: 4, // [OWNER APPROVAL NEEDED]: 1 bathroom per apartment assumed
    },

    heroImage: {
      // CONTENT WARNING: File named 5bhk.jpeg is used for 4BHK listing in legacy.
      // This appears to be a swap error. Using as-found in legacy. [OWNER APPROVAL NEEDED].
      src: "/pics/5bhk.jpeg",
      alt: "Blue Portuguese-style villa exterior during daytime — 4 Bedroom Villa, South Goa Garden Villa",
      width: 1280,
      height: 853,
    },

    highlights: [
      "Common swimming pool",
      "Four luxury 1-bedroom suites",
      "Two AC units per suite",
      "Broadband in all suites",
      "Business workstation in reception",
      "Sleeps up to 16 guests",
    ],

    amenities: [
      "Swimming Pool",
      "Air Conditioning",
      "Free WiFi",
      "Balcony",
      "Fan",
      "Tile / Marble Floor",
      "24-hour Front Desk",
    ],

    _contentWarnings: [
      "heroImage: Using pics/5bhk.jpeg for 4BHK — filename appears SWAPPED with 5BHK. [OWNER APPROVAL NEEDED] to confirm correct image.",
      "Bathroom count assumed (1 per apartment) — confirm with owner.",
    ],
  },

  {
    slug: "5-bedroom-villa-private-pool",

    // [OWNER APPROVAL NEEDED]: index.html says "5 bedroom Villa with private pool"
    name: "5 Bedroom Villa with Private Pool",

    shortDescription:
      "A secured gated compound with private pool, pool-side dining, and garden — for up to 20 guests.",

    // Confirmed from index.html lines 58–61; typos corrected.
    longDescription:
      "The 5 Bedroom Villa is set within a secured gated compound. The villa has a private swimming pool exclusively for its guests, with a pool-side dining area and a beautiful garden with lawn and flowers.\n\nThe villa has five 1-bedroom apartments, each with a separate entrance. Every apartment includes a living room, bedroom, bathroom, and a balcony with sun beds and a sitting area.",

    capacity: {
      maxGuests: 20,
      bedrooms: 5,
      bathrooms: 5, // [OWNER APPROVAL NEEDED]: 1 bathroom per apartment assumed
    },

    heroImage: {
      // CONTENT WARNING: File named 4bhk.jpeg is used for 5BHK listing in legacy.
      // This appears to be a swap error. Using as-found in legacy. [OWNER APPROVAL NEEDED].
      src: "/pics/4bhk.jpeg",
      alt: "Night view of illuminated pool and villa — 5 Bedroom Villa with Private Pool, South Goa Garden Villa",
      width: 1280,
      height: 853,
    },

    highlights: [
      "Exclusive private swimming pool",
      "Pool-side dining area",
      "Gated secure compound",
      "Garden with lawn and flowers",
      "Five private apartment suites",
      "Balcony with sun beds in each suite",
    ],

    amenities: [
      "Private Swimming Pool",
      "Pool-side Dining",
      "Garden",
      "Air Conditioning",
      "Free WiFi",
      "Balcony",
      "Fan",
    ],

    _contentWarnings: [
      "heroImage: Using pics/4bhk.jpeg for 5BHK — filename appears SWAPPED with 4BHK. [OWNER APPROVAL NEEDED] to confirm correct image.",
      "Bathroom count assumed (1 per apartment) — confirm with owner.",
    ],
  },
];

/** Find a room by slug. Returns undefined if not found. */
export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}

/** Return all room slugs (used by generateStaticParams). */
export function getAllRoomSlugs(): string[] {
  return rooms.map((r) => r.slug);
}
