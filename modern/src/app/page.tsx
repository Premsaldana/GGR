import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { rooms } from "@/content/rooms";
import { siteConfig } from "@/content/site";

import { UnicornHero } from "@/components/resort/UnicornHero";

export const metadata: Metadata = {
  title: "South Goa Garden Villa — Private Villas in Colva, South Goa",
  description:
    "Three private villas in Colva, South Goa — 1-bedroom to 5-bedroom with private pool. Peaceful gardens, pool, and personalised hospitality.",
};

export default function HomePage() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=Hello%21%20I%20would%20like%20to%20enquire%20about%20a%20villa.`;

  return (
    <>
      {/* ── Hero ── */}
      <section aria-label="Property overview" style={{ position: "relative", background: "var(--color-ink-900)" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/7", overflow: "hidden" }}>
          <UnicornHero
            fallbackSrc="/pics/WhatsApp Image 2022-03-01 at 9.52.45 PM.jpeg"
            fallbackAlt="Aerial view of the swimming pool and tropical garden at South Goa Garden Villa, Colva"
            projectId="ggr-hero-01"
          />
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "var(--gutter)",
          maxWidth: "var(--max-content)", margin: "0 auto", left: 0, right: 0,
        }}>
          <span style={{
            display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--text-eyebrow)",
            fontWeight: "500", letterSpacing: "var(--tracking-widest)", textTransform: "uppercase",
            color: "var(--color-accent-400)", marginBottom: "var(--space-4)",
          }}>
            Colva, South Goa
          </span>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "var(--text-hero)",
            color: "var(--color-base-50)", lineHeight: "1.1", letterSpacing: "var(--tracking-tight)",
            maxWidth: "16ch", marginBottom: "var(--space-6)",
          }}>
            {siteConfig.propertyName}
          </h1>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-subheading)",
            color: "var(--color-base-300)", maxWidth: "36ch", marginBottom: "var(--space-8)",
            lineHeight: "var(--leading-snug)",
          }}>
            Private villas with pool, gardens, and seclusion — from one bedroom to a full compound for twenty guests.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Link href="/stay" className="btn btn-primary btn-lg">
              Explore Villas
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg"
              style={{ borderColor: "var(--color-base-300)", color: "var(--color-base-50)" }}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Amenities Highlights ── */}
      <section aria-label="Property highlights" style={{
        padding: "var(--space-8) var(--gutter)",
        background: "var(--color-base-50)",
        borderBottom: "1px solid var(--color-base-200)"
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "var(--space-6)",
          justifyContent: "center", maxWidth: "var(--max-content)", margin: "0 auto",
          color: "var(--color-base-600)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
          fontWeight: "500", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)"
        }}>
          <span>✦ Swimming Pool</span>
          <span>✦ Tropical Garden</span>
          <span>✦ Free WiFi</span>
          <span>✦ Air Conditioning</span>
          <span>✦ Private Parking</span>
        </div>
      </section>

      {/* ── Rooms preview ── */}
      <section aria-labelledby="stay-heading" className="page-section">
        <span className="page-eyebrow">Accommodation</span>
        <h2 id="stay-heading" className="page-title">Choose your villa</h2>
        <p className="page-lead" style={{ marginBottom: "var(--space-10)" }}>
          Three villa options — from an intimate one-bedroom retreat to a five-bedroom compound with a private pool.{" "}
          {/* [OWNER APPROVAL NEEDED]: confirm canonical room names */}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "var(--space-6)" }}>
          {rooms.map((room) => (
            <article key={room.slug} className="room-card">
              <div className="room-card__image">
                <Image
                  src={room.heroImage.src}
                  alt={room.heroImage.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="room-card__body">
                <h3 className="room-card__name">
                  {/* [OWNER APPROVAL NEEDED]: canonical room names not yet confirmed */}
                  {room.name}
                </h3>
                <p className="room-card__capacity">Up to {room.capacity.maxGuests} guests</p>
                <p className="room-card__desc">{room.shortDescription}</p>
                <Link href={`/stay/${room.slug}`} className="room-card__link">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Enquiry CTA strip ── */}
      <section
        aria-label="Contact and enquiry"
        style={{
          background: "var(--color-ink-900)", color: "var(--color-base-50)",
          padding: "var(--space-16) var(--gutter)", textAlign: "center",
        }}
      >
        <span style={{
          display: "block", fontFamily: "var(--font-sans)", fontSize: "var(--text-eyebrow)",
          fontWeight: "500", letterSpacing: "var(--tracking-widest)", textTransform: "uppercase",
          color: "var(--color-accent-400)", marginBottom: "var(--space-4)",
        }}>
          Get in touch
        </span>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "var(--text-heading)",
          color: "var(--color-base-50)", marginBottom: "var(--space-4)",
          letterSpacing: "var(--tracking-tight)",
        }}>
          Plan your stay
        </h2>
        <p style={{ color: "var(--color-base-400)", marginBottom: "var(--space-8)", maxWidth: "40ch", margin: "0 auto var(--space-8)" }}>
          Our team responds within 24 hours. Contact us by form or WhatsApp.
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/contact" className="btn btn-primary btn-lg">Enquire Now</Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-lg"
            style={{ borderColor: "var(--color-base-300)", color: "var(--color-base-50)", border: "1px solid" }}>
            WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
