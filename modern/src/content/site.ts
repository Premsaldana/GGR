/**
 * Site identity — South Goa Garden Villa
 * ─────────────────────────────────────────
 * All values confirmed from legacy index.html.
 * No invented or unverified information.
 */

import type { SiteConfig } from "@/types/content";

export const siteConfig: SiteConfig = {
  // Confirmed: index.html line 15
  propertyName: "South Goa Garden Villa",

  // [OWNER APPROVAL NEEDED]: no tagline in legacy site — placeholder used
  tagline: "Private villas in Colva, South Goa",

  // Confirmed: index.html line 18
  phone: "+91 7813093075",

  // Confirmed: index.html line 27 (wa.me link)
  whatsappNumber: "917813093075",

  // Confirmed: index.html line 203
  email: "goagardenresort@gmail.com",

  // Confirmed: index.html line 206
  address: {
    street: "Behind Colva Police Station, Colva – Benaulim Road",
    city: "Margao",
    state: "Goa",
    postalCode: "403708",
    country: "India",
  },
};
