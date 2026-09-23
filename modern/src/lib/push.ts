import 'server-only';

import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db, databaseProvider, dbReady } from '@/db';
import { pushSubscriptions } from '@/db/schema';

let configured = false;

function configureWebPush() {
  if (configured) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function notifyAdminsOfProofUpload(reservationNumber: string, reservationId: string) {
  if (!configureWebPush()) {
    console.warn('Push notifications skipped: VAPID environment variables are not configured.');
    return;
  }

  const subscriptionQuery = db.select().from(pushSubscriptions);
  const subscriptions = databaseProvider === 'postgres'
    ? (await dbReady, await subscriptionQuery.execute())
    : subscriptionQuery.all();
  const payload = JSON.stringify({
    title: 'New payment screenshot',
    body: `Payment proof uploaded for ${reservationNumber}. Review required.`,
    url: `/admin/reservations/${reservationId}?view=proofs`,
    tag: `payment-proof-${reservationId}`,
  });

  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload);
    } catch (error: unknown) {
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      if (statusCode === 404 || statusCode === 410) {
        const deletion = db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        if (databaseProvider === 'postgres') { await dbReady; await deletion.execute(); } else deletion.run();
      } else {
        console.error('Push notification delivery failed:', error);
      }
    }
  }));
}
