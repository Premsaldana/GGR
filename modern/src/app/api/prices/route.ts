import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyPrices } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  try {
    return NextResponse.json(getMonthlyPrices(month), {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load prices for this month.' }, { status: 400 });
  }
}
