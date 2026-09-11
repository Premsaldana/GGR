import { NextRequest } from 'next/server';
import { subscribeToPricingEvents } from '@/lib/pricing-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let cleanup = () => undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (value: string) => {
        try { controller.enqueue(encoder.encode(value)); } catch { cleanup(); }
      };
      send('retry: 3000\n\n');
      send(': connected\n\n');
      heartbeat = setInterval(() => send(': heartbeat\n\n'), 15_000);
      cleanup = () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
      };
      const unsubscribe = subscribeToPricingEvents((event) => {
        send(`event: pricing\ndata: ${JSON.stringify(event)}\n\n`);
      });
      request.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
