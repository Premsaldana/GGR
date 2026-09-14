/**
 * Content types — South Goa Garden Villa
 * ─────────────────────────────────────────
 * Typed shapes for local content files.
 * These mirror the Sanity CMS schema (audit/content-model.md)
 * so CMS integration in Phase 4 is a drop-in replacement.
 *
 * Fields marked [OWNER APPROVAL NEEDED] contain uncertain data
 * confirmed from legacy site content with known inconsistencies.
 */

export type ImageAsset = {
  /** Path relative to workspace root — served via next.config images.localPatterns */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** If true, image gets loading="eager" / priority in next/image */
  priority?: boolean;
};

export type RoomCapacity = {
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
};

export type Room = {
  /** URL-safe slug — becomes /stay/[slug] */
  slug: string;
  /** Canonical display name — [OWNER APPROVAL NEEDED] for all rooms */
  name: string;
  /** 1–2 sentence summary for listing cards */
  shortDescription: string;
  /** Full prose for detail page */
  longDescription: string;
  capacity: RoomCapacity;
  heroImage: ImageAsset;
  /** Additional gallery images */
  gallery?: ImageAsset[];
  /** 3–5 key selling points */
  highlights: string[];
  /** Relevant amenity names (subset of full amenity list) */
  amenities: string[];
  /**
   * Content warnings — shown in code comments, NOT rendered to guests.
   * Used to flag image/content issues for owner resolution.
   */
  _contentWarnings?: string[];
};

export type AmenityCategory =
  | "facilities"
  | "bedroom"
  | "transport"
  | "payments"
  | "rooms"
  | "reception"
  | "safety"
  | "outdoor";

export type Amenity = {
  name: string;
  category: AmenityCategory;
};

export type SiteConfig = {
  propertyName: string;
  /** Short positioning tagline */
  tagline: string;
  phone: string;
  /** E.164 format for wa.me/ links */
  whatsappNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};
