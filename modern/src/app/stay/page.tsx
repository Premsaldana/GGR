import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { rooms } from "@/content/rooms";

export const metadata: Metadata = {
  title: "Stay — Villas",
  description:
    "Choose from three private villas at South Goa Garden Villa: a 1-bedroom retreat, a 4-bedroom villa, or a 5-bedroom compound with private pool.",
};

export default function StayPage() {
  return (
    <div className="page-section">
      <span className="page-eyebrow">Accommodation</span>
      <h1 className="page-title">Our Villas</h1>
      <p className="page-lead" style={{ marginBottom: "var(--space-12)" }}>
        Three villa options in Colva, South Goa — from an intimate private retreat to a full compound for groups.{" "}
        {/* [OWNER APPROVAL NEEDED]: confirm canonical room names */}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
        gap: "var(--space-8)",
      }}>
        {rooms.map((room, index) => (
          <article key={room.slug} className="room-card">
            <div className="room-card__image">
              <Image
                src={room.heroImage.src}
                alt={room.heroImage.alt}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
              />
            </div>
            <div className="room-card__body">
              <h2 className="room-card__name">
                {/* [OWNER APPROVAL NEEDED]: canonical room names */}
                {room.name}
              </h2>
              <p className="room-card__capacity">
                Up to {room.capacity.maxGuests} guests &middot; {room.capacity.bedrooms}{" "}
                {room.capacity.bedrooms === 1 ? "bedroom" : "bedrooms"}
              </p>
              <p className="room-card__desc">{room.shortDescription}</p>
              <Link href={`/stay/${room.slug}`} className="room-card__link">
                View details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
