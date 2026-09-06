/**
 * ResortHeader — shared responsive navigation shell
 * ──────────────────────────────────────────────────
 * HTML-first mobile menu using <details>/<summary> — functional without JS.
 * All nav items are real anchor/links with proper ARIA.
 * WhatsApp CTA + Enquire CTA always visible.
 *
 * Content: property name confirmed from legacy index.html line 15.
 * Phone: confirmed from index.html line 18.
 * [OWNER APPROVAL NEEDED]: Logo — current asset is cartoon clipart, flagged for replacement.
 */

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/content/site";

const navLinks = [
  { href: "/stay",    label: "Stay" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/contact", label: "Contact" },
];

export function ResortHeader() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=Hello%21%20I%20would%20like%20to%20enquire%20about%20a%20villa.`;

  return (
    <header className="resort-header" role="banner">
      <div className="resort-header__inner">
        {/* ── Logo + Property Name ── */}
        <Link href="/" className="resort-header__brand" aria-label={`${siteConfig.propertyName} — home`}>
          <Image
            src="/logo.png"
            alt="South Goa Garden Villa logo"
            width={48}
            height={48}
            className="resort-header__logo"
            priority
          />
          <span className="resort-header__name">{siteConfig.propertyName}</span>
        </Link>

        {/* ── Desktop navigation ── */}
        <nav className="resort-header__nav" aria-label="Main navigation">
          <ul className="resort-header__nav-list" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="resort-header__nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── CTAs ── */}
        <div className="resort-header__ctas">
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="resort-header__phone"
            aria-label={`Call us: ${siteConfig.phone}`}
          >
            {siteConfig.phone}
          </a>

          <a
            href="/contact"
            className="resort-header__cta-btn"
          >
            Enquire Now
          </a>
        </div>

        {/* ── Mobile menu (HTML-first: <details>/<summary>) ── */}
        <details className="resort-header__mobile-menu">
          <summary
            className="resort-header__hamburger"
            aria-label="Open navigation menu"
          >
            <span className="resort-header__hamburger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>

          <nav
            className="resort-header__mobile-nav"
            aria-label="Mobile navigation"
          >
            <ul role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="resort-header__mobile-link">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="/contact"
                  className="resort-header__mobile-link resort-header__mobile-link--cta"
                >
                  Enquire Now
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resort-header__mobile-link"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
