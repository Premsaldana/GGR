import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Users } from "lucide-react";
import { siteConfig } from "@/content/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://goagardenresort.vercel.app";

export const metadata: Metadata = {
  title: "Private Pool Villa in Colva, Goa | Goa Garden Resort",
  description:
    "Book the entire five-bedroom Goa Garden Resort in Colva, South Goa. A private pool villa for families, reunions and groups of up to 20 guests.",
  alternates: { canonical: "/private-pool-villa-colva-goa" },
  openGraph: {
    title: "Private Pool Villa in Colva, Goa | Goa Garden Resort",
    description:
      "A complete five-bedroom private resort with an exclusive pool and tropical garden in Colva, South Goa.",
    url: `${siteUrl}/private-pool-villa-colva-goa`,
    images: [{ url: `${siteUrl}/resort/pool-courtyard-day.webp`, width: 1200, height: 800, alt: "Private pool at Goa Garden Resort in Colva" }],
  },
};

const faqs = [
  {
    question: "Is Goa Garden Resort a private pool villa?",
    answer: "Yes. Goa Garden Resort is offered as one complete private five-bedroom resort with an exclusive swimming pool and shared garden courtyard for your group.",
  },
  {
    question: "How many guests can stay at Goa Garden Resort?",
    answer: "The resort is designed for groups of up to 20 guests across five private suites. Enter your dates and guest count on the booking search to check availability.",
  },
  {
    question: "Where is the resort located?",
    answer: "Goa Garden Resort is on Colva–Benaulim Road, behind Colva Police Station, in South Goa. The location is convenient for guests visiting Colva and nearby beaches.",
  },
  {
    question: "Can I book the resort directly?",
    answer: "Yes. Use the availability search on this website or contact the resort directly for dates, group requirements and booking assistance.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Hotel",
      "@id": `${siteUrl}/#hotel`,
      name: siteConfig.propertyName,
      url: siteUrl,
      telephone: siteConfig.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.street,
        addressLocality: siteConfig.address.city,
        addressRegion: siteConfig.address.state,
        postalCode: siteConfig.address.postalCode,
        addressCountry: "IN",
      },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Private swimming pool", value: true },
        { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
        { "@type": "LocationFeatureSpecification", name: "Free parking", value: true },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

export default function PrivatePoolVillaColvaPage() {
  return (
    <main className="seo-guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="seo-guide-hero">
        <div>
          <p className="eyebrow">Goa Garden Resort · Colva, South Goa</p>
          <h1>Private pool villa in Colva, Goa</h1>
          <p className="seo-guide-hero__lede">
            Bring your whole group to one private five-bedroom resort, with an exclusive pool, tropical garden and room to spend the day together or apart.
          </p>
          <div className="seo-guide-actions">
            <Link href="/" className="button button--sun">Check availability <ArrowUpRight aria-hidden="true" size={18} /></Link>
            <Link href="/contact" className="text-link">Ask about your dates <ArrowUpRight aria-hidden="true" size={16} /></Link>
          </div>
        </div>
        <div className="seo-guide-hero__facts" aria-label="Resort highlights">
          <div><strong>05</strong><span>private suites</span></div>
          <div><strong>20</strong><span>guests maximum</span></div>
          <div><strong>01</strong><span>resort, entirely yours</span></div>
        </div>
      </section>

      <section className="seo-guide-section seo-guide-section--split">
        <div>
          <p className="eyebrow">A private stay in South Goa</p>
          <h2>More than a room near Colva Beach.</h2>
        </div>
        <div className="seo-guide-copy">
          <p>Goa Garden Resort is made for families, reunions and groups who want the freedom of a complete resort instead of separate hotel rooms. Five independent suites gather around a private pool and garden courtyard.</p>
          <p>Each suite gives guests personal space, while the shared poolside setting makes it easy to spend time together. The property is located behind Colva Police Station on Colva–Benaulim Road, South Goa.</p>
          <div className="seo-guide-meta"><span><MapPin size={17} aria-hidden="true" /> Colva–Benaulim Road, South Goa</span><span><Users size={17} aria-hidden="true" /> Up to 20 guests</span></div>
        </div>
      </section>

      <section className="seo-guide-section seo-guide-section--feature">
        <div>
          <p className="eyebrow">Why groups choose the resort</p>
          <h2>Your people together. Your own pool. Your own pace.</h2>
        </div>
        <ul className="seo-guide-list">
          <li><Check size={18} aria-hidden="true" /><span><strong>Entire resort privacy</strong> — book a complete five-bedroom estate for your group.</span></li>
          <li><Check size={18} aria-hidden="true" /><span><strong>Private swimming pool</strong> — enjoy the pool and courtyard without sharing them with another hotel group.</span></li>
          <li><Check size={18} aria-hidden="true" /><span><strong>Independent suites</strong> — gather together while keeping comfortable personal space.</span></li>
          <li><Check size={18} aria-hidden="true" /><span><strong>Direct booking</strong> — check dates and enquire with the resort team directly.</span></li>
        </ul>
      </section>

      <section className="seo-guide-section seo-guide-section--faq" aria-labelledby="faq-title">
        <p className="eyebrow">Plan your stay</p>
        <h2 id="faq-title">Questions about Goa Garden Resort</h2>
        <div className="seo-guide-faqs">
          {faqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </div>
        <Link href="/availability" className="button button--sun">See current availability <ArrowUpRight aria-hidden="true" size={18} /></Link>
      </section>
    </main>
  );
}
