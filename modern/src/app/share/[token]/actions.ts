'use server';

import { db } from '@/db';
import { shareLinks, invoices, paymentProofs, reservations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { paymentProofStorage, paymentProofProvider, generateStorageKey } from '@/lib/storage';

import { uploadProofSchema } from '@/lib/validations';
import { publishRealtimeEvent } from '@/lib/realtime-publish';

export async function uploadProofAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const token = formData.get('token') as string;

    const parseResult = uploadProofSchema.safeParse({ file, token });
    if (!parseResult.success) {
      return { error: parseResult.error.issues[0]?.message || 'Invalid input', success: false };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'File too large', success: false };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic byte validation
    const header = buffer.subarray(0, 8).toString('hex').toUpperCase();
    let detectedMime = '';

    if (header.startsWith('FFD8FF')) {
      detectedMime = 'image/jpeg';
    } else if (header.startsWith('89504E470D0A1A0A')) {
      detectedMime = 'image/png';
    } else if (buffer.subarray(0, 5).toString('utf8') === '%PDF-') {
      detectedMime = 'application/pdf';
    }

    if (!detectedMime) {
      return { error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.', success: false };
    }

    // Token validation
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const shareLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();

    if (!shareLink) {
      return { error: 'Invalid token', success: false };
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      return { error: 'Token expired', success: false };
    }

    const invoice = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId)).get();
    if (!invoice) {
      return { error: 'Invoice not found', success: false };
    }

    const reservation = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
    if (!reservation) {
      return { error: 'Reservation not found', success: false };
    }

    // Check if invoice is finalized or payment is already closed
    if (invoice.finalizedAt !== null || invoice.status === 'cancelled') {
      return { error: 'Payment is already finalized or closed', success: false };
    }

    if (invoice.balanceMinorUnits <= 0) {
      return { error: 'Payment is already finalized or closed', success: false };
    }

    // Prevent duplicate pending uploads
    const existingPending = db.select().from(paymentProofs)
      .where(eq(paymentProofs.invoiceId, invoice.id))
      .all()
      .filter(p => p.status === 'pending_review');

    if (existingPending.length > 0) {
      return { error: 'A payment proof is already pending review.', success: false };
    }

    const storageKey = generateStorageKey();

    // Perform storage and DB insert
    await paymentProofStorage.put(storageKey, buffer, detectedMime);

    const proofId = crypto.randomUUID();
    db.insert(paymentProofs).values({
      id: proofId,
      invoiceId: invoice.id,
      shareLinkId: shareLink.id,
      storageProvider: paymentProofProvider,
      storageKey,
      mimeType: detectedMime,
      sizeBytes: file.size,
      status: 'pending_review',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).run();

    const proof = db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).get();
    await publishRealtimeEvent({
      type: 'proof.submitted',
      invoiceId: invoice.id,
      reservationId: reservation.id,
      proof: proof ? { ...proof } : undefined,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Upload proof error:', err.message);
    return { error: 'Server error during upload', success: false };
  }
}
