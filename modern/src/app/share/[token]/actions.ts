'use server';

import { db, databaseProvider, dbReady } from '@/db';
import { shareLinks, invoices, paymentProofs, reservations, paymentAttempts, auditEvents } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { paymentProofStorage, paymentProofProvider, generateStorageKey } from '@/lib/storage';
import { buildUpiIntent, getPaymentProviderConfig } from '@/lib/payments/provider';

import { uploadProofSchema } from '@/lib/validations';
import { publishRealtimeEvent } from '@/lib/realtime-publish';
import { notifyAdminsOfProofUpload } from '@/lib/push';

export async function createPaymentAttemptAction(token: string, requestedAmountMinorUnits?: number) {
  try {
    const config = getPaymentProviderConfig();
    if (!config.enabled) return { success: false, fallback: true, message: 'Automated payment is currently unavailable' };
    if (!config.upiId || !config.payeeName) throw new Error('Automated UPI collection details are not configured');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const shareLinkQuery = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash));
    const shareLink = databaseProvider === 'postgres' ? (await dbReady, (await shareLinkQuery.execute())[0]) : shareLinkQuery.get();
    if (!shareLink || new Date(shareLink.expiresAt) < new Date()) throw new Error('Invalid or expired payment link');

    const invoiceQuery = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId));
    const invoice = databaseProvider === 'postgres' ? (await dbReady, (await invoiceQuery.execute())[0]) : invoiceQuery.get();
    if (!invoice || invoice.status === 'cancelled' || invoice.finalizedAt || invoice.balanceMinorUnits <= 0) throw new Error('Payment is no longer available for this invoice');
    const amountMinorUnits = requestedAmountMinorUnits ?? invoice.balanceMinorUnits;
    if (!Number.isInteger(amountMinorUnits) || amountMinorUnits <= 0 || amountMinorUnits > invoice.balanceMinorUnits) throw new Error('Payment amount must be a positive amount within the invoice balance');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.expiryMinutes * 60_000);
    const idempotencyWindow = Math.floor(now.getTime() / (config.expiryMinutes * 60_000));
    const idempotencyKey = `${invoice.id}:${invoice.version}:${amountMinorUnits}:${idempotencyWindow}`;
    const provider = config.provider;

    if (databaseProvider === 'postgres') {
      await dbReady;
      const result = await (db as unknown as { transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> }).transaction(async (tx) => {
        const active = (await tx.select().from(paymentAttempts).where(and(eq(paymentAttempts.invoiceId, invoice.id), inArray(paymentAttempts.status, ['created', 'pending']))).execute())[0];
        if (active) return active;
        const attemptId = crypto.randomUUID();
        const attemptReference = `GGR-${invoice.invoiceNumber}-${attemptId}`;
        const upiUri = buildUpiIntent({ upiId: config.upiId, payeeName: config.payeeName, amountMinorUnits, attemptReference });
        await tx.insert(paymentAttempts).values({ id: attemptId, invoiceId: invoice.id, invoiceVersion: invoice.version, provider, providerRef: attemptReference, amountMinorUnits, currency: 'INR', status: 'created', upiUri, expiresAt, idempotencyKey, createdAt: now, updatedAt: now }).execute();
        await tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: null, entityType: 'payment_attempt', entityId: attemptId, eventType: 'CREATE', afterJson: JSON.stringify({ amountMinorUnits, provider, expiresAt }), createdAt: now }).execute();
        return (await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attemptId)).execute())[0];
      });
      return { success: true, attempt: result };
    }

    const result = db.transaction((tx) => {
      const active = tx.select().from(paymentAttempts).where(and(eq(paymentAttempts.invoiceId, invoice.id), inArray(paymentAttempts.status, ['created', 'pending']))).get();
      if (active) return active;
      const attemptId = crypto.randomUUID();
      const attemptReference = `GGR-${invoice.invoiceNumber}-${attemptId}`;
      const upiUri = buildUpiIntent({ upiId: config.upiId, payeeName: config.payeeName, amountMinorUnits, attemptReference });
      tx.insert(paymentAttempts).values({ id: attemptId, invoiceId: invoice.id, invoiceVersion: invoice.version, provider, providerRef: attemptReference, amountMinorUnits, currency: 'INR', status: 'created', upiUri, expiresAt, idempotencyKey, createdAt: now, updatedAt: now }).run();
      tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: null, entityType: 'payment_attempt', entityId: attemptId, eventType: 'CREATE', afterJson: JSON.stringify({ amountMinorUnits, provider, expiresAt }), createdAt: now }).run();
      return tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attemptId)).get();
    });
    return { success: true, attempt: result };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unable to create payment attempt', success: false };
  }
}

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
    const shareLinkQuery = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash));
    const shareLink = databaseProvider === 'postgres' ? (await dbReady, (await shareLinkQuery.execute())[0]) : shareLinkQuery.get();

    if (!shareLink) {
      return { error: 'Invalid token', success: false };
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      return { error: 'Token expired', success: false };
    }

    const invoiceQuery = db.select().from(invoices).where(eq(invoices.id, shareLink.invoiceId));
    const invoice = databaseProvider === 'postgres' ? (await dbReady, (await invoiceQuery.execute())[0]) : invoiceQuery.get();
    if (!invoice) {
      return { error: 'Invoice not found', success: false };
    }

    const reservationQuery = db.select().from(reservations).where(eq(reservations.id, invoice.reservationId));
    const reservation = databaseProvider === 'postgres' ? (await dbReady, (await reservationQuery.execute())[0]) : reservationQuery.get();
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
    const pendingQuery = db.select().from(paymentProofs).where(eq(paymentProofs.invoiceId, invoice.id));
    const existingPending = (databaseProvider === 'postgres' ? (await dbReady, await pendingQuery.execute()) : pendingQuery.all()).filter(p => p.status === 'pending_review');

    if (existingPending.length > 0) {
      return { error: 'A payment proof is already pending review.', success: false };
    }

    const storageKey = generateStorageKey();

    // Perform storage and DB insert
    await paymentProofStorage.put(storageKey, buffer, detectedMime);

    const proofId = crypto.randomUUID();
    const insertProof = db.insert(paymentProofs).values({
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
    });
    if (databaseProvider === 'postgres') { await dbReady; await insertProof.execute(); } else insertProof.run();

    const proofQuery = db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId));
    const proof = databaseProvider === 'postgres' ? (await dbReady, (await proofQuery.execute())[0]) : proofQuery.get();
    await publishRealtimeEvent({
      type: 'proof.submitted',
      invoiceId: invoice.id,
      reservationId: reservation.id,
      proof: proof ? { ...proof } : undefined,
    });
    await notifyAdminsOfProofUpload(reservation.reservationNumber, reservation.id);

    return { success: true };
  } catch (err: unknown) {
    console.error('Upload proof error:', err instanceof Error ? err.message : err);
    return { error: 'Server error during upload', success: false };
  }
}
