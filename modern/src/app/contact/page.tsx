import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { EnquiryPlanner } from "@/components/resort/EnquiryPlanner";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Plan Your Private Stay",
  description:
    "Check availability for the complete five-bedroom Goa Garden Resort in Colva, South Goa.",
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-page__visual" aria-label="Goa Garden Resort at night">
        <Image
          src="/resort/hero-pool-night.webp"
          alt="Goa Garden Resort's private pool and villas illuminated at night"
          fill
          sizes="(max-width: 900px) 100vw, 48vw"
          preload
        />
        <div className="contact-page__visual-overlay" />
        <div className="contact-page__visual-copy">
          <p className="eyebrow eyebrow--light">One private resort · Up to 20 guests</p>
          <h1>Let&apos;s make<br /><em>Goa happen.</em></h1>
          <p>Share your dates and group size. We&apos;ll continue the conversation on WhatsApp.</p>
        </div>
      </section>

      <section className="contact-page__panel" aria-labelledby="enquiry-title">
        <Link href="/" className="contact-page__back">
          <ArrowLeft size={16} aria-hidden="true" /> Back to the resort
        </Link>
        <div className="contact-page__heading">
          <p className="eyebrow">Check availability</p>
          <h2 id="enquiry-title">Plan your private stay.</h2>
          <p>The complete five-bedroom resort is reserved as one stay for your group.</p>
        </div>
        <EnquiryPlanner />

        <div className="contact-page__direct">
          <p className="eyebrow">Prefer to reach us directly?</p>
          <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
            <Phone size={17} aria-hidden="true" /> {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`}>
            <Mail size={17} aria-hidden="true" /> {siteConfig.email}
          </a>
          <p><MapPin size={17} aria-hidden="true" /> {siteConfig.address.street}, {siteConfig.address.city}, {siteConfig.address.state}</p>
        </div>
      </section>
    </main>
  );
}
