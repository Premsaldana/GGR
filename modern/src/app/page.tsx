import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BedDouble,
  Car,
  Check,
  ShieldCheck,
  Snowflake,
  Waves,
  Wifi,
} from "lucide-react";
import { ParallaxMedia } from "@/components/resort/ParallaxMedia";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Goa Garden Resort — Your Private 5-Bedroom Resort in Colva",
  description:
    "Take over an entire gated 5-bedroom resort in Colva, South Goa, with a private swimming pool, tropical garden, and poolside dining for up to 20 guests.",
};

const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
  "Hello! I would like to check availability for the private 5-bedroom Goa Garden Resort.",
)}`;

const highlights = [
  { value: "05", label: "Private suites" },
  { value: "20", label: "Guests maximum" },
  { value: "01", label: "Resort, entirely yours" },
];

const amenities = [
  { icon: Waves, title: "Private pool", copy: "Reserved exclusively for your group." },
  { icon: BedDouble, title: "Five suites", copy: "Each with its own living room and entrance." },
  { icon: Snowflake, title: "Air conditioned", copy: "Comfort across the resort's private suites." },
  { icon: Wifi, title: "Free Wi-Fi", copy: "Stay connected throughout your holiday." },
  { icon: Car, title: "Free parking", copy: "Easy arrivals inside the gated compound." },
  { icon: ShieldCheck, title: "Gated privacy", copy: "A self-contained stay for your people." },
];

export default function HomePage() {
  return (
    <main className="resort-site">
      <section className="hero" aria-labelledby="hero-title">
        <ParallaxMedia
          src="/resort/hero-pool-night.webp"
          alt="The illuminated private pool and cobalt-blue villas at Goa Garden Resort after sunset"
          className="hero__media"
          imageClassName="hero__image"
          preload
          speed="cinematic"
        />
        <div className="hero__wash" aria-hidden="true" />
        <div className="hero__grain" aria-hidden="true" />

        <div className="hero__content">
          <p className="eyebrow eyebrow--light">Colva · South Goa</p>
          <h1 id="hero-title">
            The whole place.
            <em>All yours.</em>
          </h1>
          <p className="hero__lede">
            One private five-bedroom resort, one pool, and no one else&apos;s itinerary.
          </p>
          <div className="hero__actions">
            <Link href="/contact" className="button button--sun">
              Plan your stay <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
            <a href="#resort" className="button button--glass">
              Explore the resort <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
        </div>

        <div className="hero__signature" aria-hidden="true">
          <span>Goa</span>
          <span>Garden</span>
          <span>Resort</span>
        </div>

        <div className="hero__facts" role="group" aria-label="Resort at a glance">
          {highlights.map((item) => (
            <div key={item.label} className="hero__fact">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="ticker">
        <div className="ticker__track">
          <span>Private pool</span><i>✦</i><span>Five suites</span><i>✦</i>
          <span>Gated compound</span><i>✦</i><span>Poolside dining</span><i>✦</i>
          <span>Tropical garden</span><i>✦</i><span>Up to 20 guests</span>
        </div>
      </div>

      <section className="intro" id="resort" aria-labelledby="intro-title">
        <div className="intro__label">
          <span>01</span>
          <p className="eyebrow">A resort of your own</p>
        </div>
        <div className="intro__statement">
          <h2 id="intro-title">
            Not a room in Goa.
            <br />
            <em>Your own corner of it.</em>
          </h2>
          <div className="intro__copy">
            <p>
              Goa Garden Resort is offered as one complete private estate: five
              one-bedroom suites gathered around a pool, garden, and places to
              slow down together.
            </p>
            <p>
              Every suite has a separate entrance, living room, bedroom,
              bathroom, and balcony—so your group can be together without giving
              up personal space.
            </p>
          </div>
        </div>
      </section>

      <section className="estate-story" aria-label="Discover the private resort">
        <div className="estate-story__sticky">
          <ParallaxMedia
            src="/resort/villa-cobalt.webp"
            alt="The vivid cobalt-blue resort villa framed by coconut palms"
            className="estate-story__portrait"
            imageClassName="estate-story__image"
            sizes="(max-width: 900px) 86vw, 46vw"
            speed="cinematic"
          />
          <div className="estate-story__number" aria-hidden="true">05</div>
          <div className="estate-story__card">
            <p className="eyebrow">The estate</p>
            <h2>Five private suites. One shared escape.</h2>
            <p>
              A secured, gated compound designed for big families, reunions, and
              groups who want the freedom of a resort without sharing it.
            </p>
            <ul>
              <li><Check size={16} aria-hidden="true" /> Five separate suite entrances</li>
              <li><Check size={16} aria-hidden="true" /> Living room in every suite</li>
              <li><Check size={16} aria-hidden="true" /> Balcony seating and sun beds</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pool-feature" id="pool" aria-labelledby="pool-title">
        <ParallaxMedia
          src="/resort/pool-courtyard-day.webp"
          alt="The private swimming pool, poolside tables, garden, and resort buildings in daylight"
          className="pool-feature__media"
          imageClassName="pool-feature__image"
          speed="cinematic"
        />
        <div className="pool-feature__overlay" />
        <div className="pool-feature__content">
          <p className="eyebrow eyebrow--light">The heart of the resort</p>
          <h2 id="pool-title">Pool days that turn into pool nights.</h2>
          <p>
            Swim, gather for a poolside meal, or claim a quiet corner of the
            garden. The entire courtyard belongs only to your group.
          </p>
        </div>
      </section>

      <section className="inside" id="inside" aria-labelledby="inside-title">
        <div className="inside__heading">
          <div>
            <p className="eyebrow">Inside your stay</p>
            <h2 id="inside-title">Space to gather.<br /><em>Room to disappear.</em></h2>
          </div>
          <p>
            Comfortable, independent suites make the resort work as well for
            slow mornings as it does for a house full of celebration.
          </p>
        </div>

        <div className="gallery-grid">
          <figure className="gallery-grid__item gallery-grid__item--wide">
            <Image
              src="/resort/suite-living.webp"
              alt="A private suite living room with seating, dining table, and kitchenette"
              fill
              sizes="(max-width: 800px) 100vw, 58vw"
            />
            <figcaption>Independent living space</figcaption>
          </figure>
          <figure className="gallery-grid__item gallery-grid__item--tall">
            <Image
              src="/resort/suite-bedroom.webp"
              alt="A bright private bedroom with double bed and garden-facing window"
              fill
              sizes="(max-width: 800px) 100vw, 32vw"
            />
            <figcaption>Private bedrooms</figcaption>
          </figure>
          <figure className="gallery-grid__item gallery-grid__item--pool">
            <Image
              src="/resort/pool-aerial.webp"
              alt="Elevated view across the resort's private swimming pool and lawn"
              fill
              sizes="(max-width: 800px) 100vw, 42vw"
            />
            <figcaption>Your private courtyard</figcaption>
          </figure>
          <figure className="gallery-grid__item gallery-grid__item--arrival">
            <Image
              src="/resort/villa-arrival.webp"
              alt="The gated entrance and blue facade of Goa Garden Resort"
              fill
              sizes="(max-width: 800px) 100vw, 48vw"
            />
            <figcaption>A gated arrival</figcaption>
          </figure>
        </div>
      </section>

      <section className="amenities" id="amenities" aria-labelledby="amenities-title">
        <div className="amenities__heading">
          <p className="eyebrow">Everything that matters</p>
          <h2 id="amenities-title">Built for the<br />whole crew.</h2>
          <p>
            The ease of a resort, with the rare luxury of having it to yourselves.
          </p>
        </div>
        <div className="amenities__list">
          {amenities.map(({ icon: Icon, title, copy }, index) => (
            <article className="amenity" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon aria-hidden="true" strokeWidth={1.4} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <Image
          src="/resort/hero-pool-night.webp"
          alt=""
          fill
          sizes="100vw"
          className="closing__image"
        />
        <div className="closing__overlay" />
        <div className="closing__content">
          <p className="eyebrow eyebrow--light">Your dates. Your people. Your resort.</p>
          <h2 id="closing-title">Make Goa<br /><em>all yours.</em></h2>
          <div className="closing__actions">
            <Link href="/contact" className="button button--sun">
              Check availability <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-link text-link--light">
              Or talk to us on WhatsApp <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          </div>
        </div>
      </section>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Enquire about Goa Garden Resort on WhatsApp"
      >
        <span>WhatsApp</span>
        <ArrowUpRight aria-hidden="true" size={18} />
      </a>
    </main>
  );
}
