import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db, databaseProvider, dbReady } from '@/db';
import { invoices, paymentAttempts, shareLinks } from '@/db/schema';

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const linkQuery = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash));
    const link = databaseProvider === 'postgres' ? (await dbReady, (await linkQuery.execute())[0]) : linkQuery.get();
    if (!link || new Date(link.expiresAt) < new Date()) return NextResponse.json({ error: 'Invalid or expired payment link' }, { status: 404 });

    const invoiceQuery = db.select().from(invoices).where(eq(invoices.id, link.invoiceId));
    const invoice = databaseProvider === 'postgres' ? (await dbReady, (await invoiceQuery.execute())[0]) : invoiceQuery.get();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const attemptQuery = db.select().from(paymentAttempts).where(eq(paymentAttempts.invoiceId, invoice.id)).orderBy(desc(paymentAttempts.createdAt)).limit(1);
    const attempt = databaseProvider === 'postgres' ? (await dbReady, (await attemptQuery.execute())[0]) : attemptQuery.get();
    const isPaid = invoice.balanceMinorUnits <= 0 || invoice.status === 'paid';
    const status = isPaid ? 'paid' : attempt?.status || 'none';
    return NextResponse.json({
      status,
      isVerified: isPaid || status === 'paid',
      amountMinorUnits: attempt?.paidAmountMinorUnits ?? attempt?.amountMinorUnits ?? null,
      expectedAmountMinorUnits: attempt?.amountMinorUnits ?? invoice.balanceMinorUnits,
      providerPaymentId: attempt?.providerPaymentId ?? null,
      utr: attempt?.utr ?? null,
      paidAt: attempt?.paidAt ?? null,
      expiresAt: attempt?.expiresAt ?? null,
      attemptId: attempt?.id ?? null,
      message: status === 'paid' ? 'Payment confirmed by the resort.' : status === 'mismatch' || status === 'late' ? 'Payment received and needs a quick check by the resort.' : status === 'failed' ? 'Payment was not completed. You can try again.' : status === 'expired' ? 'This payment QR has expired. Generate a new one.' : 'Waiting for payment confirmation.',
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Unable to read payment status' }, { status: 500 });
  }
}
