import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { paymentProofStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ key: string }> }
) {
  const params = await props.params;
  try {
    // 1. Authorize admin
    await requireAdmin();

    // 2. Fetch from storage
    const file = await paymentProofStorage.get(params.key);

    if (!file) {
      return new NextResponse('Proof not found', { status: 404 });
    }

    // 3. Return as stream or buffer with correct content type
    return new NextResponse(file.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.error('Error fetching proof:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
