import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { rooms, getRoomBySlug, getAllRoomSlugs } from "@/content/rooms";
import { BookingCTA } from "@/components/resort/BookingCTA";
import { siteConfig } from "@/content/site";

/**
 * Room detail page — /stay/[slug]
 * ──────────────────────────────────────────────────────────
 * Vertical slice: 1 Bedroom Villa is the primary tested route.
 * All three rooms share this template.
 *
 * Phase 3: content from local TypeScript files (no CMS).
 * Phase 4: replace getRoomBySlug() with a Sanity GROQ query.
 */

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** SSG: pre-render all known room slugs at build time. */
export async function generateStaticParams() {
  return getAllRoomSlugs().map((slug) => ({ slug }));
}

/** Per-room SEO metadata. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    title: room.name,
    description: room.shortDescription,
    openGraph: {
      title: `${room.name} | ${siteConfig.propertyName}`,
      description: room.shortDescription,
      url: `${siteUrl}/stay/${room.slug}`,
      images: [
        {
          url: `${siteUrl}${room.heroImage.src}`,
          alt: room.heroImage.alt,
          width: room.heroImage.width,
          height: room.heroImage.height,
        },
      ],
    },
    alternates: {
      canonical: `${siteUrl}/stay/${room.slug}`,
    },
  };
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);

  // Return 404 for unknown slugs
  if (!room) notFound();

  // Related rooms (other villas — exclude current)
  const relatedRooms = rooms.filter((r) => r.slug !== room.slug).slice(0, 2);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: siteConfig.propertyName,
    url: siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.postalCode,
      addressCountry: "IN",
    },
    containsPlace: {
      "@type": "Room",
      name: room.name,
      description: room.shortDescription,
      occupancy: {
        "@type": "QuantitativeValue",
        maxValue: room.capacity.maxGuests,
      },
    },
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero image — full width, priority ── */}
      <div className="room-detail__hero">
        <Image
          src={room.heroImage.src}
          alt={room.heroImage.alt}
          fill
          priority={true}
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="room-detail">
        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="room-detail__breadcrumb">
          <Link href="/">Home</Link>
          {" / "}
          <Link href="/stay">Stay</Link>
          {" / "}
          <span aria-current="page">{room.name}</span>
        </nav>

        {/* ── Two-column layout: main content + sidebar CTA ── */}
        <div className="room-detail__layout">

          {/* ── Main content column ── */}
          <div>
            {/* ── Heading block ── */}
            <div className="room-detail__heading">
              <span className="room-detail__eyebrow">
                {/* [OWNER APPROVAL NEEDED]: confirm canonical villa type label */}
                Private Villa · Colva, South Goa
              </span>
              {/* Single H1 per page — required for accessibility & SEO */}
              <h1 className="room-detail__title">
                {room.name}
                {/* [OWNER APPROVAL NEEDED]: canonical room name unconfirmed */}
              </h1>
              <p className="room-detail__short-desc">{room.shortDescription}</p>
            </div>

            {/* ── Capacity facts grid ── */}
            <dl className="room-detail__facts">
              <div className="room-detail__fact">
                <dt className="room-detail__fact-label">Guests</dt>
                <dd className="room-detail__fact-value">{room.capacity.maxGuests}</dd>
              </div>
              <div className="room-detail__fact">
                <dt className="room-detail__fact-label">Bedrooms</dt>
                <dd className="room-detail__fact-value">{room.capacity.bedrooms}</dd>
              </div>
              <div className="room-detail__fact">
                <dt className="room-detail__fact-label">Bathrooms</dt>
                <dd className="room-detail__fact-value">{room.capacity.bathrooms}</dd>
              </div>
            </dl>

            {/* ── Full description ── */}
            <div className="room-detail__description">
              {room.longDescription.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* ── Key highlights ── */}
            {room.highlights.length > 0 && (
              <div style={{ marginTop: "var(--space-8)" }}>
                <p className="room-detail__section-title">What&rsquo;s included</p>
                <ul className="room-detail__highlights" aria-label="Room highlights">
                  {room.highlights.map((h) => (
                    <li key={h} className="room-detail__highlight">{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Gallery ── */}
            {room.gallery && room.gallery.length > 0 && (
              <div style={{ marginTop: "var(--space-10)" }}>
                <p className="room-detail__section-title">Gallery</p>
                <div className="room-detail__gallery" role="list" aria-label="Room photo gallery">
                  {room.gallery.map((img) => (
                    <div key={img.src} className="room-detail__gallery-item" role="listitem">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar: Booking CTA ── */}
          <aside className="room-detail__sidebar" aria-label="Booking and enquiry">
            <BookingCTA
              roomSlug={room.slug}
              roomName={room.name}
              variant="detail"
            />

            {/* Back to all villas */}
            <div style={{ marginTop: "var(--space-6)", textAlign: "center" }}>
              <Link
                href="/stay"
                style={{
                  fontSize: "var(--text-eyebrow)",
                  fontWeight: "500",
                  letterSpacing: "var(--tracking-widest)",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  transition: "color var(--duration-fast) var(--ease-default)",
                }}
              >
                ← All villas
              </Link>
            </div>
          </aside>

        </div>

        {/* ── Other villas ── */}
        {relatedRooms.length > 0 && (
          <section
            aria-labelledby="other-villas-heading"
            style={{ marginTop: "var(--space-24)" }}
          >
            <hr style={{ marginBottom: "var(--space-12)" }} />
            <span className="page-eyebrow">Also available</span>
            <h2 id="other-villas-heading" className="page-title" style={{ marginBottom: "var(--space-8)" }}>
              Other villas
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: "var(--space-6)",
            }}>
              {relatedRooms.map((r) => (
                <article key={r.slug} className="room-card">
                  <div className="room-card__image">
                    <Image
                      src={r.heroImage.src}
                      alt={r.heroImage.alt}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="room-card__body">
                    <h3 className="room-card__name">{r.name}</h3>
                    <p className="room-card__capacity">Up to {r.capacity.maxGuests} guests</p>
                    <p className="room-card__desc">{r.shortDescription}</p>
                    <Link href={`/stay/${r.slug}`} className="room-card__link">
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
