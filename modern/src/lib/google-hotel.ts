import { getMonthlyPrices } from '@/lib/pricing';
import { nextIsoDate } from '@/lib/pricing-core';

export const GOOGLE_HOTEL_ID = 'ggr-goa-garden-resort';
export const GOOGLE_ROOM_ID = 'private-pool-resort';
export const GOOGLE_PACKAGE_ID = 'standard-direct';
export const GOOGLE_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goagardenresort.vercel.app';
export const GOOGLE_LATITUDE = process.env.GOOGLE_HOTEL_LATITUDE || '15.2779104';
export const GOOGLE_LONGITUDE = process.env.GOOGLE_HOTEL_LONGITUDE || '73.9265747';

function escapeXml(value: string | number) {
  return String(value).replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '\"': '&quot;' })[character] || character);
}

function money(amountMinorUnits: number) {
  return (amountMinorUnits / 100).toFixed(2);
}

function datesBetween(checkIn: string, nights: number) {
  const dates: string[] = [];
  let current = checkIn;
  for (let index = 0; index < nights; index += 1) {
    dates.push(current);
    current = nextIsoDate(current) || '';
  }
  return dates;
}

export async function getGoogleRate(checkIn: string, nights: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !Number.isInteger(nights) || nights < 1 || nights > 30) return null;
  const dates = datesBetween(checkIn, nights);
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  const monthly = await Promise.all(months.map((month) => getMonthlyPrices(month)));
  const prices = new Map(monthly.flatMap((result) => result.prices.map((price) => [price.date, price.amountMinorUnits] as const)));
  const unavailable = new Set(monthly.flatMap((result) => result.availability.map((item) => item.date)));
  if (dates.some((date) => unavailable.has(date) || !prices.has(date))) return null;
  const nightlyRates = dates.map((date) => prices.get(date) as number);
  return { checkIn, nights, checkOut: nextIsoDate(dates[dates.length - 1]) || '', nightlyRates, baseRateMinorUnits: nightlyRates.reduce((sum, rate) => sum + rate, 0), taxMinorUnits: 0, otherFeesMinorUnits: 0 };
}

export function hotelListXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<listings xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.gstatic.com/localfeed/local_feed.xsd">\n  <language>en</language>\n  <listing>\n    <id>${GOOGLE_HOTEL_ID}</id>\n    <name>Goa Garden Resort</name>\n    <address format="simple">\n      <component name="addr1">Behind Colva Police Station, Colva - Benaulim Road</component>\n      <component name="city">Margao</component>\n      <component name="province">Goa</component>\n      <component name="postal_code">403708</component>\n    </address>\n    <country>IN</country>\n    <latitude>${GOOGLE_LATITUDE}</latitude>\n    <longitude>${GOOGLE_LONGITUDE}</longitude>\n    <phone type="main">+917813093075</phone>\n    <category>hotel</category>\n    <content>\n      <attributes>\n        <website>${escapeXml(GOOGLE_SITE_URL)}</website>\n      </attributes>\n    </content>\n  </listing>\n</listings>`;
}

export function transactionXml(rate: Awaited<ReturnType<typeof getGoogleRate>>, propertyId = GOOGLE_HOTEL_ID, unavailableItinerary?: { checkIn: string; nights: number }) {
  if (!rate) {
    const checkIn = unavailableItinerary?.checkIn || new Date().toISOString().slice(0, 10);
    const nights = unavailableItinerary?.nights || 1;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Transaction timestamp="${new Date().toISOString()}" id="ggr-unavailable-${Date.now()}"><Result><Property>${escapeXml(propertyId)}</Property><Checkin>${checkIn}</Checkin><Nights>${nights}</Nights><Baserate currency="INR">-1</Baserate><Unavailable><NoVacancy/></Unavailable><Tax currency="INR">0.00</Tax><OtherFees currency="INR">0.00</OtherFees></Result></Transaction>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Transaction timestamp="${new Date().toISOString()}" id="ggr-${Date.now()}">\n  <Result>\n    <Property>${escapeXml(propertyId)}</Property>\n    <RoomID>${GOOGLE_ROOM_ID}</RoomID>\n    <PackageID>${GOOGLE_PACKAGE_ID}</PackageID>\n    <Checkin>${rate.checkIn}</Checkin>\n    <Nights>${rate.nights}</Nights>\n    <Baserate currency="INR">${money(rate.baseRateMinorUnits)}</Baserate>\n    <Tax currency="INR">${money(rate.taxMinorUnits)}</Tax>\n    <OtherFees currency="INR">${money(rate.otherFeesMinorUnits)}</OtherFees>\n    <Refundable available="false"/>\n    <ChargeCurrency>web</ChargeCurrency>\n    <Occupancy>20</Occupancy>\n    <AllowablePointsOfSale><PointOfSale id="ggr-direct"/></AllowablePointsOfSale>\n  </Result>\n</Transaction>`;
}

export function parseGoogleQuery(xml: string) {
  const checkIn = xml.match(/<Checkin>\s*(\d{4}-\d{2}-\d{2})\s*<\/Checkin>/i)?.[1];
  const nights = Number(xml.match(/<Nights>\s*(\d+)\s*<\/Nights>/i)?.[1] || 0);
  const properties = [...xml.matchAll(/<Property>\s*([^<]+?)\s*<\/Property>/gi)].map((match) => match[1]);
  return { checkIn, nights, properties };
}
