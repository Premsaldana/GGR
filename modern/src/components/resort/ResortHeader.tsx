import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/content/site";

const navLinks = [
  { href: "/#resort", label: "The resort" },
  { href: "/#pool", label: "Private pool" },
  { href: "/#inside", label: "Inside" },
];

export function ResortHeader() {
  return (
    <header className="resort-header" role="banner">
      <div className="resort-header__inner">
        <Link href="/" className="resort-header__brand" aria-label={`${siteConfig.propertyName} — home`}>
          <span className="resort-header__monogram" aria-hidden="true">GGR</span>
          <span className="resort-header__name">
            Goa Garden
            <small>Private Resort · Colva</small>
          </span>
        </Link>

        <nav className="resort-header__nav" aria-label="Main navigation">
          <ul className="resort-header__nav-list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/contact" className="resort-header__enquire">
          Enquire <ArrowUpRight size={16} aria-hidden="true" />
        </Link>

        <details className="resort-header__mobile-menu">
          <summary aria-label="Open navigation menu">
            <span /><span />
          </summary>
          <nav aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link href={link.href} key={link.href}>{link.label}</Link>
            ))}
            <Link href="/contact">Check availability</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
