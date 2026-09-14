/**
 * Public accommodation source of truth.
 *
 * Goa Garden Resort is no longer sold as separate 1, 4, or 5-bedroom
 * inventory. The complete five-bedroom gated resort is the only guest-facing
 * stay. This compatibility export remains for booking-adapter code that still
 * consumes the Room shape.
 */
import type { Room } from "@/types/content";

export const rooms: Room[] = [
  {
    slug: "private-five-bedroom-resort",
    name: "Entire 5-Bedroom Private Resort",
    shortDescription:
      "The complete gated Goa Garden Resort, with a private pool, tropical garden, and poolside dining for up to 20 guests.",
    longDescription:
      "Goa Garden Resort is reserved as one complete private stay. The gated compound has an exclusive swimming pool, a poolside dining area, a garden with lawn and flowers, and five independent one-bedroom suites. Each suite has a separate entrance, living room, bedroom, bathroom, and balcony with seating.",
    capacity: {
      maxGuests: 20,
      bedrooms: 5,
      bathrooms: 5,
    },
    heroImage: {
      src: "/resort/hero-pool-night.webp",
      alt: "The private swimming pool and five-bedroom Goa Garden Resort at night",
      width: 2400,
      height: 1500,
      priority: true,
    },
    gallery: [
      {
        src: "/resort/villa-cobalt.webp",
        alt: "Cobalt-blue facade of Goa Garden Resort",
        width: 1600,
        height: 1900,
      },
      {
        src: "/resort/pool-courtyard-day.webp",
        alt: "Private pool courtyard in daylight",
        width: 2200,
        height: 1500,
      },
    ],
    highlights: [
      "Complete resort reserved for one group",
      "Exclusive private swimming pool",
      "Five independent one-bedroom suites",
      "Poolside dining area",
      "Gated compound and tropical garden",
      "Accommodates up to 20 guests",
    ],
    amenities: [
      "Private Swimming Pool",
      "Pool-side Dining",
      "Garden",
      "Air Conditioning",
      "Free WiFi",
      "Balcony",
      "Free Parking",
    ],
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}

export function getAllRoomSlugs(): string[] {
  return rooms.map((room) => room.slug);
}
