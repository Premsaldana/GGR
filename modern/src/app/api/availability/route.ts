import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/availability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const rooms = searchParams.get('rooms');
  
  if (!checkIn || !checkOut || !rooms) {
    return NextResponse.json({ available: false, reason: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const result = await checkAvailability(checkIn, checkOut, parseInt(rooms, 10));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Availability check failed:', error);
    return NextResponse.json({ available: false, reason: 'Internal server error' }, { status: 500 });
  }
}
