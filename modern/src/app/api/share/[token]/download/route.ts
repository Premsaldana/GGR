import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoicePayments, qrPaymentArtifacts, shareLinks, paymentProofs, reservations, guests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { generateInvoicePDFStream } from '@/lib/pdfGenerator';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const shareLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();

    if (!shareLink) {
      return new NextResponse('Invalid token', { status: 404 });
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      return new NextResponse('Token expired', { status: 403 });
    }

    const invoice = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId)).get();
    if (!invoice) return new NextResponse('Invoice not found', { status: 404 });

    const isFinalized = invoice.finalizedAt !== null;
    const isPaid = invoice.status === 'paid' || invoice.balanceMinorUnits <= 0;
    
    // Check if there's a verified proof
    const verifiedProof = db.select().from(paymentProofs)
      .where(eq(paymentProofs.invoiceId, invoice.id))
      .all()
      .find(p => p.status === 'verified');

    if (!isFinalized && !isPaid && !verifiedProof) {
      return new NextResponse('Invoice not yet verified for download', { status: 403 });
    }

    const reservation = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
    if (!reservation) return new NextResponse('Reservation not found', { status: 404 });

    const guest = db.select().from(guests).where(eq(guests.id, reservation.guestId)).get();
    const guestSlug = guest ? guest.fullName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'guest';

    let snapshot;
    try {
      snapshot = invoice.snapshotJson ? JSON.parse(invoice.snapshotJson) : null;
      if (snapshot && snapshot.input && Array.isArray(snapshot.input.lineItems)) {
        snapshot.input.lineItems = snapshot.input.lineItems.map((li: any) => ({
          ...li,
          amountMinorUnits: li.amountMinorUnits ?? (li.quantity * li.rateMinorUnits)
        }));
      }
    } catch (e) {
      snapshot = null;
    }

    const payments = db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invoice.id)).all();
    
    const qrArtifact = db.select().from(qrPaymentArtifacts)
      .where(eq(qrPaymentArtifacts.invoiceId, invoice.id))
      .orderBy(desc(qrPaymentArtifacts.artifactVersion))
      .limit(1)
      .get();

    const pdfStream = await generateInvoicePDFStream(invoice, snapshot, payments, qrArtifact || null);

    const webStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      }
    });

    const filename = `GGR-${invoice.invoiceNumber}-${guestSlug}.pdf`;

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    console.error('Error generating PDF download', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
