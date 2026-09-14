'use server';

import { requireAdmin } from '@/lib/session';
import { db, databaseProvider, dbReady } from '@/db';
import { invoices, qrPaymentArtifacts, shareLinks, auditEvents, reservations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

const postgresDb = db as unknown as { transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> };

export async function generateQRAction(invoiceId: string, amountMinorUnits: number) {
  const session = await requireAdmin();

  if (amountMinorUnits < 0) {
    return { error: 'Amount cannot be negative' };
  }

  try {
    if (databaseProvider === 'postgres') {
      await dbReady;
      const result = await postgresDb.transaction(async (tx) => {
        const invoice = (await tx.select().from(invoices).where(eq(invoices.id, invoiceId)).execute())[0];
        if (!invoice) throw new Error('Invoice not found');
        const reservation = (await tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).execute())[0];
        if (!reservation) throw new Error('Reservation not found');
        const existingQrs = await tx.select().from(qrPaymentArtifacts).where(eq(qrPaymentArtifacts.invoiceId, invoiceId)).orderBy(desc(qrPaymentArtifacts.artifactVersion)).execute();
        const newVersion = existingQrs.length > 0 ? existingQrs[0].artifactVersion + 1 : 1;
        const upiId = '9482095412@ybl';
        const payeeName = 'Goa Garden Resort';
        const transactionNote = invoice.invoiceNumber;
        const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${(amountMinorUnits / 100).toFixed(2)}&tr=${encodeURIComponent(transactionNote)}&cu=INR`;
        const qrId = crypto.randomUUID();
        await tx.insert(qrPaymentArtifacts).values({ id: qrId, invoiceId, amountMinorUnits, upiId, payeeName, currency: 'INR', transactionNote, upiUri, qrFormat: 'SVG', artifactVersion: newVersion, createdBy: session.userId, createdAt: new Date() }).execute();
        if (reservation.paymentStatus === 'not_requested') await tx.update(reservations).set({ paymentStatus: 'qr_generated', updatedAt: new Date() }).where(eq(reservations.id, reservation.id)).execute();
        await tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'qr_payment_artifact', entityId: qrId, eventType: 'CREATE', createdAt: new Date() }).execute();
        return { qrId, upiUri, amountMinorUnits, version: newVersion };
      });
      return { success: true, ...result };
    }

    const result = db.transaction((tx) => {
      const invoice = tx.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
      if (!invoice) throw new Error('Invoice not found');

      const reservation = tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
      if (!reservation) throw new Error('Reservation not found');

      // Get latest QR version to increment
      const existingQrs = tx.select().from(qrPaymentArtifacts)
        .where(eq(qrPaymentArtifacts.invoiceId, invoiceId))
        .orderBy(desc(qrPaymentArtifacts.artifactVersion))
        .all();
      
      const newVersion = existingQrs.length > 0 ? existingQrs[0].artifactVersion + 1 : 1;
      
      const upiId = '9482095412@ybl';
      const payeeName = 'Goa Garden Resort';
      const amountStr = (amountMinorUnits / 100).toFixed(2);
      const transactionNote = invoice.invoiceNumber;
      
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&tr=${encodeURIComponent(transactionNote)}&cu=INR`;

      const qrId = crypto.randomUUID();

      tx.insert(qrPaymentArtifacts).values({
        id: qrId,
        invoiceId,
        amountMinorUnits,
        upiId,
        payeeName,
        currency: 'INR',
        transactionNote,
        upiUri,
        qrFormat: 'SVG',
        artifactVersion: newVersion,
        createdBy: session.userId,
        createdAt: new Date(),
      }).run();

      // Ensure reservation paymentStatus is updated, but only to qr_generated if it was not_requested
      if (reservation.paymentStatus === 'not_requested') {
        tx.update(reservations)
          .set({ paymentStatus: 'qr_generated', updatedAt: new Date() })
          .where(eq(reservations.id, reservation.id))
          .run();
      }

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'qr_payment_artifact',
        entityId: qrId,
        eventType: 'CREATE',
        createdAt: new Date(),
      }).run();

      return { qrId, upiUri, amountMinorUnits, version: newVersion };
    });
    
    return { success: true, ...result };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createShareLinkAction(invoiceId: string, durationDays: number = 7) {
  const session = await requireAdmin();

  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const shareId = crypto.randomUUID();

    if (databaseProvider === 'postgres') {
      await dbReady;
      await postgresDb.transaction(async (tx) => {
        await tx.insert(shareLinks).values({ id: shareId, invoiceId, token: tokenHash, expiresAt, createdAt: new Date(), createdBy: session.userId }).execute();
        await tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'share_link', entityId: shareId, eventType: 'CREATE', createdAt: new Date() }).execute();
      });
    } else db.transaction((tx) => {
      tx.insert(shareLinks).values({
        id: shareId,
        invoiceId,
        token: tokenHash,
        expiresAt,
        createdAt: new Date(),
        createdBy: session.userId,
      }).run();

      tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorUserId: session.userId,
        entityType: 'share_link',
        entityId: shareId,
        eventType: 'CREATE',
        createdAt: new Date(),
      }).run();
    });

    return { success: true, rawToken, expiresAt };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function revokeShareLinkAction(tokenId: string) {
  const session = await requireAdmin();

  try {
    if (databaseProvider === 'postgres') {
      await dbReady;
      await postgresDb.transaction(async (tx) => {
        const shareLink = (await tx.select().from(shareLinks).where(eq(shareLinks.id, tokenId)).execute())[0];
        if (shareLink) {
          await tx.update(shareLinks).set({ expiresAt: new Date(0) }).where(eq(shareLinks.id, tokenId)).execute();
          await tx.insert(auditEvents).values({ id: crypto.randomUUID(), actorUserId: session.userId, entityType: 'share_link', entityId: tokenId, eventType: 'REVOKE', createdAt: new Date() }).execute();
        }
      });
    } else db.transaction((tx) => {
      const shareLink = tx.select().from(shareLinks).where(eq(shareLinks.id, tokenId)).get();
      if (shareLink) {
        tx.update(shareLinks)
          .set({ expiresAt: new Date(0) }) // Expire immediately
          .where(eq(shareLinks.id, tokenId))
          .run();

        tx.insert(auditEvents).values({
          id: crypto.randomUUID(),
          actorUserId: session.userId,
          entityType: 'share_link',
          entityId: tokenId,
          eventType: 'REVOKE',
          createdAt: new Date(),
        }).run();
      }
    });
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getShareLinksAction(invoiceId: string) {
  await requireAdmin();
  const query = db.select().from(shareLinks).where(eq(shareLinks.invoiceId, invoiceId));
  return databaseProvider === 'postgres' ? (await dbReady, await query.execute()) : query.all();
}

export async function getLatestQRAction(invoiceId: string) {
  await requireAdmin();
  const query = db.select().from(qrPaymentArtifacts).where(eq(qrPaymentArtifacts.invoiceId, invoiceId)).orderBy(desc(qrPaymentArtifacts.artifactVersion)).limit(1);
  const existingQrs = databaseProvider === 'postgres' ? (await dbReady, await query.execute()) : query.all();
  return existingQrs.length > 0 ? existingQrs[0] : null;
}
