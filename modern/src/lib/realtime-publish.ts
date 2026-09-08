import 'server-only';

export type RealtimeEventType = 'proof.submitted' | 'proof.verified' | 'proof.rejected' | 'proof.resubmit_requested' | 'invoice.issued' | 'invoice.finalized';

export async function publishRealtimeEvent(event: {
  type: RealtimeEventType;
  invoiceId: string;
  reservationId: string;
  proof?: Record<string, unknown>;
  invoice?: Record<string, unknown>;
  reservation?: Record<string, unknown>;
}) {
  const baseUrl = process.env.REALTIME_SERVER_URL || `http://127.0.0.1:${process.env.PORT || '3000'}`;
  try {
    const response = await fetch(`${baseUrl}/api/realtime/publish`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-realtime-secret': process.env.SESSION_SECRET || '',
      },
      body: JSON.stringify(event),
      cache: 'no-store',
    });
    if (!response.ok) console.error('Realtime publish failed:', response.status, await response.text());
  } catch (error) {
    console.error('Realtime publish unavailable:', error);
  }
}
