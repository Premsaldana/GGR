import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoicePayments, qrPaymentArtifacts, reservations, guests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateInvoicePDFStream } from '@/lib/pdfGenerator';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'owner_admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    const invoice = db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
    if (!invoice) return new NextResponse('Not found', { status: 404 });

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

    const payments = db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invoiceId)).all();
    
    const qrArtifact = db.select().from(qrPaymentArtifacts)
      .where(eq(qrPaymentArtifacts.invoiceId, invoiceId))
      .orderBy(desc(qrPaymentArtifacts.artifactVersion))
      .limit(1)
      .get();

    const pdfStream = await generateInvoicePDFStream(invoice, snapshot, payments, qrArtifact || null);

    // Convert NodeJS Readable stream to Web ReadableStream
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
    console.error('Error generating PDF', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
