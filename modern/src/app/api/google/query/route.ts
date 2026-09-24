import { NextResponse } from 'next/server';
import { GOOGLE_HOTEL_ID, parseGoogleQuery, getGoogleRate, transactionXml } from '@/lib/google-hotel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const xml = await request.text();
  const query = parseGoogleQuery(xml);
  if (!query.checkIn || !query.nights || !query.properties.includes(GOOGLE_HOTEL_ID)) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Error><Code>400</Code><Message>Unsupported or invalid Google Hotel query</Message></Error>', { status: 400, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  }

  const rate = await getGoogleRate(query.checkIn, query.nights);
  return new NextResponse(transactionXml(rate, GOOGLE_HOTEL_ID, { checkIn: query.checkIn, nights: query.nights }), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  return NextResponse.json({ endpoint: '/api/google/query', propertyId: GOOGLE_HOTEL_ID, status: 'ready' });
}
