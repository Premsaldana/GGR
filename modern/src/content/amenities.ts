/**
 * Amenities — South Goa Garden Villa
 * ─────────────────────────────────────
 * All confirmed from index.html lines 108–191.
 * No invented amenities.
 */

import type { Amenity } from "@/types/content";

export const amenities: Amenity[] = [
  // Most Popular Facilities — confirmed index.html lines 112–127
  { name: "Swimming Pool",                  category: "facilities" },
  { name: "Pool-side Dining",               category: "facilities" },
  { name: "Garden",                         category: "facilities" },
  { name: "Family Rooms",                   category: "facilities" },
  { name: "Free Parking",                   category: "facilities" },
  { name: "Restaurant",                     category: "facilities" },
  { name: "Room Service",                   category: "facilities" },
  { name: "Facilities for Disabled Guests", category: "facilities" },
  { name: "Breakfast",                      category: "facilities" },
  { name: "Jacuzzi",                        category: "facilities" },
  { name: "Washing Machine",                category: "facilities" },
  { name: "Free WiFi",                      category: "facilities" },
  { name: "Terrace",                        category: "facilities" },
  { name: "Balcony",                        category: "facilities" },
  { name: "Bathtub",                        category: "facilities" },
  { name: "Air Conditioning",               category: "facilities" },

  // Bedroom — confirmed index.html lines 131–134
  { name: "Linen",                          category: "bedroom" },
  { name: "Wardrobe / Closet",             category: "bedroom" },
  { name: "Extra-long Beds (> 2 m)",        category: "bedroom" },

  // Parking & Transport — confirmed index.html lines 139–145
  { name: "Free WiFi in Public Areas",      category: "transport" },
  { name: "Free Self-parking",              category: "transport" },
  { name: "Private Car Service (extra charge)", category: "transport" },
  { name: "Car Rental On-site",             category: "transport" },

  // Policies & Payments — confirmed index.html lines 148–152
  { name: "Credit Cards",                   category: "payments" },
  { name: "Debit Cards",                    category: "payments" },
  { name: "NFC Mobile Payments",            category: "payments" },
  { name: "Cash",                           category: "payments" },

  // Rooms — confirmed index.html lines 155–161
  { name: "Socket Near the Bed",            category: "rooms" },
  { name: "Sofa Bed",                       category: "rooms" },
  { name: "Drying Rack",                    category: "rooms" },
  { name: "Clothes Rack",                   category: "rooms" },
  { name: "Tile / Marble Floor",            category: "rooms" },
  { name: "Fan",                            category: "rooms" },

  // Reception — confirmed index.html lines 165–175
  { name: "Invoice Provided",               category: "reception" },
  { name: "Lockers",                        category: "reception" },
  { name: "Private Check-in / Check-out",  category: "reception" },
  { name: "Concierge Service",              category: "reception" },
  { name: "Luggage Storage",               category: "reception" },
  { name: "Tour Desk",                      category: "reception" },
  { name: "Currency Exchange",              category: "reception" },
  { name: "Express Check-in / Check-out",  category: "reception" },
  { name: "24-hour Front Desk",             category: "reception" },

  // Safety & Security — confirmed index.html lines 177–183
  { name: "Fire Extinguishers",             category: "safety" },
  { name: "CCTV Outside Property",          category: "safety" },
  { name: "CCTV in Common Areas",           category: "safety" },
  { name: "Key Access",                     category: "safety" },
  { name: "24-hour Security",               category: "safety" },

  // Outdoor & View — confirmed index.html lines 185–190
  { name: "Inner Courtyard View",           category: "outdoor" },
  { name: "Pool View",                      category: "outdoor" },
  { name: "Garden View",                    category: "outdoor" },
];

/** Helper: filter amenities by category. */
export function getAmenitiesByCategory(category: Amenity["category"]): Amenity[] {
  return amenities.filter((a) => a.category === category);
}
