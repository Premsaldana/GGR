import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Users, MapPin, Check } from 'lucide-react';
import { checkAvailability } from '@/lib/availability';
import { siteConfig } from '@/content/site';

export const metadata = {
  title: 'Resort Overview | Goa Garden Resort',
  description: 'Review your stay at Goa Garden Resort.'
};

export const dynamic = 'force-dynamic';

export default async function StayOverviewPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const checkIn = typeof searchParams.checkIn === 'string' ? searchParams.checkIn : '';
  const checkOut = typeof searchParams.checkOut === 'string' ? searchParams.checkOut : '';
  const adults = typeof searchParams.adults === 'string' ? searchParams.adults : '2';
  const children = typeof searchParams.children === 'string' ? searchParams.children : '0';
  const rooms = typeof searchParams.rooms === 'string' ? searchParams.rooms : '1';

  let available = false;
  let reason = '';
  
  if (checkIn && checkOut && rooms) {
    const res = await checkAvailability(checkIn, checkOut, parseInt(rooms, 10));
    available = res.available;
    reason = res.reason || '';
  }

  // Calculate nights
  let nights = 0;
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const proceedUrl = `/contact?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}&rooms=1&unit=private-pool-villa`;

  return (
    <main className="overview-page">
      <div className="overview-page__header">
        <Link href="/" className="overview-page__back">
          <ArrowLeft size={16} /> Back to search
        </Link>
      </div>

      {!available ? (
        <div className="overview-page__unavailable">
          <h2>{reason || "These dates are no longer available. Please search again."}</h2>
          <div className="overview-page__actions">
            <Link href="/" className="button button--sun">Try different dates</Link>
            <a href={`https://wa.me/${siteConfig.whatsappNumber}`} className="button button--glass">Contact us on WhatsApp</a>
          </div>
        </div>
      ) : (
        <div className="overview-page__grid">
          <section className="overview-page__main">
            <div className="overview-card">
              <div className="overview-card__image-wrap">
                <Image 
                  src="/resort/villa-cobalt.webp" 
                  alt="5 Bedroom Villa with Private Pool" 
                  fill 
                  className="overview-card__image" 
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
                <span className="overview-card__badge">Available for your dates</span>
              </div>
              <div className="overview-card__content">
                <h2>5 BHK VILLA WITH POOL</h2>
                <p className="overview-card__desc">
                  Goa Garden Resort is offered as one complete private estate: five one-bedroom suites gathered around a pool, garden, and places to slow down together.
                </p>
                <div className="overview-card__meta">
                  <span><Users size={16} aria-hidden="true" /> Up to 20 guests</span>
                  <span><Check size={16} aria-hidden="true" /> Entire private resort</span>
                </div>
                <div className="overview-card__footer">
                  <div className="overview-card__price">
                    <span className="overview-card__price-label">Price shared after enquiry</span>
                  </div>
                  {/* Since this is a single unit, we just proceed directly or mark it selected */}
                  <Link href={proceedUrl} className="button button--sun">Select Villa</Link>
                </div>
              </div>
            </div>
          </section>

          <aside className="overview-page__sidebar">
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <p className="booking-summary__location"><MapPin size={16} aria-hidden="true"/> Goa Garden Resort, Colva</p>
              
              <div className="booking-summary__dates">
                <div className="booking-summary__date">
                  <span>Check-in</span>
                  <strong>{checkIn}</strong>
                </div>
                <div className="booking-summary__nights">{nights} Night{nights > 1 ? 's' : ''}</div>
                <div className="booking-summary__date">
                  <span>Check-out</span>
                  <strong>{checkOut}</strong>
                </div>
              </div>

              <div className="booking-summary__guests">
                <p><strong>Guests:</strong> {adults} Adults, {children} Children</p>
                <p><strong>Rooms:</strong> 1 (Complete Private Resort)</p>
              </div>

              <div className="booking-summary__selected">
                <h4>Selected Unit</h4>
                <p>5 Bedroom Villa with Private Pool</p>
              </div>

              <Link href={proceedUrl} className="button button--ink booking-summary__proceed">
                Proceed to Enquiry
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
