import { NextResponse } from 'next/server';
import { hotelListXml } from '@/lib/google-hotel';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new NextResponse(hotelListXml(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
