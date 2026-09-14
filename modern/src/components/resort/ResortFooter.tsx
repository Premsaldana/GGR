import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/content/site";

export function ResortFooter() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hello! I would like to enquire about a private stay at Goa Garden Resort.",
  )}`;

  return (
    <footer className="resort-footer" role="contentinfo">
      <div className="resort-footer__topline">
        <p>One resort. One group. All of Goa ahead.</p>
        <Link href="/contact">Plan your stay <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
      <div className="resort-footer__main">
        <div className="resort-footer__identity">
          <span className="resort-footer__mark">GGR</span>
          <p>{siteConfig.propertyName}</p>
          <small>Private five-bedroom resort · Colva, South Goa</small>
        </div>
        <div>
          <p className="resort-footer__label">Explore</p>
          <nav aria-label="Footer navigation" className="resort-footer__links">
            <Link href="/#resort">The resort</Link>
            <Link href="/#pool">Private pool</Link>
            <Link href="/#inside">Inside the suites</Link>
            <Link href="/#amenities">Amenities</Link>
          </nav>
        </div>
        <div>
          <p className="resort-footer__label">Talk to us</p>
          <address className="resort-footer__links">
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </address>
        </div>
        <div>
          <p className="resort-footer__label">Find us</p>
          <address className="resort-footer__address">
            {siteConfig.address.street}<br />
            {siteConfig.address.city}, {siteConfig.address.state}<br />
            {siteConfig.address.postalCode}, {siteConfig.address.country}
          </address>
        </div>
      </div>
      <div className="resort-footer__legal">
        <p>© {new Date().getFullYear()} {siteConfig.propertyName}</p>
        <p>Made for unhurried days in South Goa.</p>
      </div>
    </footer>
  );
}
