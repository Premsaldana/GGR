import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db, databaseProvider, dbReady } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { requireAdmin } from '@/lib/session';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
    const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';

    if (!endpoint.startsWith('https://') || !p256dh || !auth || endpoint.length > 2048) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
    }

    const now = new Date();
    const existingQuery = db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    const existing = databaseProvider === 'postgres'
      ? (await dbReady, (await existingQuery.execute())[0])
      : existingQuery.get();

    if (existing) {
      const update = db.update(pushSubscriptions).set({ p256dh, auth, updatedAt: now }).where(eq(pushSubscriptions.id, existing.id));
      if (databaseProvider === 'postgres') { await dbReady; await update.execute(); } else update.run();
    } else {
      const insert = db.insert(pushSubscriptions).values({ id: crypto.randomUUID(), endpoint, p256dh, auth, createdAt: now, updatedAt: now });
      if (databaseProvider === 'postgres') { await dbReady; await insert.execute(); } else insert.run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription failed:', error);
    return NextResponse.json({ error: 'Could not save push subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
    if (!endpoint) return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });

    const deletion = db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint)));
    if (databaseProvider === 'postgres') { await dbReady; await deletion.execute(); } else deletion.run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
    return NextResponse.json({ error: 'Could not remove push subscription' }, { status: 500 });
  }
}
