/**
 * ResortFooter — shared footer
 * ──────────────────────────────────────────────────
 * All contact information confirmed from legacy index.html.
 * No invented content.
 *
 * [OWNER APPROVAL NEEDED]:
 * - Social media links (none found in legacy site — omitted)
 * - Legal page URLs (stubs only)
 */

import Link from "next/link";
import { siteConfig } from "@/content/site";

export function ResortFooter() {
  const year = new Date().getFullYear();
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=Hello%21%20I%20would%20like%20to%20enquire%20about%20a%20villa.`;

  return (
    <footer className="resort-footer" role="contentinfo">
      <div className="resort-footer__inner">

        {/* ── Identity block ── */}
        <div className="resort-footer__brand">
          <p className="resort-footer__property-name">{siteConfig.propertyName}</p>
          {/* [OWNER APPROVAL NEEDED]: tagline pending owner confirmation */}
          <p className="resort-footer__tagline">{siteConfig.tagline}</p>
        </div>

        {/* ── Contact block ── */}
        <address className="resort-footer__contact" aria-label="Contact information">
          <p>
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
              {siteConfig.phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
          <p>
            {siteConfig.address.street},{" "}
            {siteConfig.address.city},{" "}
            {siteConfig.address.state}{" "}
            {siteConfig.address.postalCode},{" "}
            {siteConfig.address.country}
          </p>
          <p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="resort-footer__whatsapp"
            >
              Chat on WhatsApp
            </a>
          </p>
        </address>

        {/* ── Navigation ── */}
        <nav aria-label="Footer navigation">
          <ul className="resort-footer__nav-list" role="list">
            <li><Link href="/stay">Stay</Link></li>
            <li><Link href="/#amenities">Amenities</Link></li>
            <li><Link href="/contact">Enquire</Link></li>
            {/* Legal pages — stubs: add content in Phase 4 */}
            {/* <li><Link href="/legal/privacy">Privacy Policy</Link></li> */}
            {/* <li><Link href="/legal/cancellation">Cancellation Policy</Link></li> */}
          </ul>
        </nav>

      </div>

      {/* ── Legal bar ── */}
      <div className="resort-footer__legal">
        <p>
          &copy; {year} {siteConfig.propertyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
