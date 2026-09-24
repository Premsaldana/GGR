import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, ArrowRight } from 'lucide-react';
import { getGoogleRate, GOOGLE_HOTEL_ID, GOOGLE_SITE_URL } from '@/lib/google-hotel';
import { siteConfig } from '@/content/site';

export const dynamic = 'force-dynamic';

function textParam(value: string | string[] | undefined, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function googleCheckIn(params: Record<string, string | string[] | undefined>) {
  const direct = textParam(params.checkIn, textParam(params.checkin, ''));
  if (direct) return direct;
  const day = textParam(params.checkinDay);
  const month = textParam(params.checkinMonth);
  const year = textParam(params.checkinYear);
  return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
}

export default async function GoogleHotelLanding({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkIn = googleCheckIn(params);
  const checkOut = textParam(params.checkOut, textParam(params.checkout, ''));
  const nightsFromGoogle = Number(textParam(params.nights, '0'));
  const nights = nightsFromGoogle || (checkIn && checkOut ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0);
  const rate = checkIn && nights > 0 ? await getGoogleRate(checkIn, nights) : null;
  const adults = Number(textParam(params.adults, textParam(params.occupancy, '2'))) || 2;
  const children = Number(textParam(params.children, '0')) || 0;
  const bookingUrl = rate ? `/stay/overview?checkIn=${encodeURIComponent(rate.checkIn)}&checkOut=${encodeURIComponent(rate.checkOut)}&adults=${adults}&children=${children}&rooms=1` : '/';

  return (
    <main data-nav-stage="landing" className="overview-page">
      <section className="overview-page__grid">
        <div className="overview-page__main">
          <div className="overview-card" itemScope itemType="https://schema.org/Hotel https://schema.org/LodgingReservation">
            <meta itemProp="identifier" content={GOOGLE_HOTEL_ID} />
            <meta itemProp="url" content={GOOGLE_SITE_URL} />
            <div className="overview-card__image-wrap"><Image src="/resort/villa-cobalt.webp" alt="Goa Garden Resort private five-bedroom resort with pool" fill className="overview-card__image" sizes="(max-width: 900px) 100vw, 50vw" /></div>
            <div className="overview-card__content">
              <p className="eyebrow">Direct rate from Goa Garden Resort</p>
              <h1 itemProp="name">Goa Garden Resort</h1>
              <p className="overview-card__desc">The complete private five-bedroom resort in Colva, South Goa, with a private pool and space for up to 20 guests.</p>
              <div className="overview-card__meta"><span><MapPin size={16} /> {siteConfig.address.city}, {siteConfig.address.state}</span><span><Users size={16} /> Up to 20 guests</span></div>
              <div data-nav-stage="checkout" data-nav-stage-final={rate ? 'true' : 'false'} className="booking-summary" itemProp="makesOffer" itemScope itemType="https://schema.org/Offer">
                <meta itemProp="priceCurrency" content="INR" />
                <meta itemProp="availability" content={rate ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
                {rate ? <>
                  <p><strong>Check-in:</strong> {rate.checkIn} · <strong>Check-out:</strong> {rate.checkOut}</p>
                  <p><strong>Guests:</strong> {adults} adults{children ? `, ${children} children` : ''}</p>
                  <p className="overview-card__price"><span itemProp="price">{(rate.baseRateMinorUnits / 100).toFixed(2)}</span> <span>INR total for {rate.nights} night{rate.nights === 1 ? '' : 's'}</span></p>
                  <Link href={bookingUrl} className="button button--sun" data-nav-criticalpath="true" data-nav-interactiontype="CLICK" data-nav-interactionorder="1">Continue to booking <ArrowRight size={16} /></Link>
                </> : <><p>{checkIn ? 'These dates are unavailable or a rate has not been loaded yet.' : 'Choose dates on the website to see the direct rate.'}</p><Link href="/" className="button button--sun">Choose dates</Link></>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
