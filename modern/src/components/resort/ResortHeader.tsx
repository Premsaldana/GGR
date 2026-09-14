"use client";

import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { siteConfig } from "@/content/site";
import { useRef } from "react";

const navLinks = [
  { href: "/#resort", label: "The resort" },
  { href: "/#pool", label: "Private pool" },
  { href: "/#inside", label: "Inside" },
  { href: "/availability", label: "Prices" },
];

export function ResortHeader() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <header className="resort-header" role="banner">
      <div className="resort-header__inner">
        <Link href="/" className="resort-header__brand" aria-label={`${siteConfig.propertyName} — home`} onClick={closeMenu}>
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
            <li>
              <Link href="/admin" aria-label="Admin Portal" style={{ opacity: 0.5, display: 'flex', alignItems: 'center', height: '100%' }}><LockKeyhole size={14} /></Link>
            </li>
          </ul>
        </nav>

        <Link href="/contact" className="resort-header__enquire">
          Enquire <ArrowUpRight size={16} aria-hidden="true" />
        </Link>

        <details className="resort-header__mobile-menu" ref={detailsRef}>
          <summary aria-label="Open navigation menu">
            <span /><span />
          </summary>
          <nav aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>
            ))}
            <Link href="/admin" onClick={closeMenu} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5, fontSize: '0.9rem', padding: '1rem' }}><LockKeyhole size={16} /> Admin Portal</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
