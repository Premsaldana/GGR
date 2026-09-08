import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { invoices, shareLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

const TOKEN_TTL_SECONDS = 60 * 60;

function sign(payload: string) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET!).update(payload).digest('base64url');
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get('invoiceId');
  const shareToken = request.nextUrl.searchParams.get('shareToken');
  if (!invoiceId) return NextResponse.json({ error: 'Invoice is required' }, { status: 400 });

  let role: 'admin' | 'guest';
  if (shareToken) {
    const tokenHash = crypto.createHash('sha256').update(shareToken).digest('hex');
    const link = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();
    if (!link || link.invoiceId !== invoiceId || new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 401 });
    }
    role = 'guest';
  } else {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'owner_admin' || !session.emailVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    role = 'admin';
  }

  const invoice = db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, invoiceId)).get();
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ invoiceId, role, exp })).toString('base64url');
  return NextResponse.json({ token: `${payload}.${sign(payload)}`, expiresAt: exp * 1000 });
}
