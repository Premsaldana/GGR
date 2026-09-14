"use client";

import { useEffect, useRef } from 'react';

type ProofRealtimeEvent = {
  type: 'proof.submitted' | 'proof.verified' | 'proof.rejected' | 'proof.resubmit_requested' | 'invoice.issued' | 'invoice.finalized';
  invoiceId: string;
  reservationId: string;
  proof?: Record<string, unknown>;
  invoice?: Record<string, unknown>;
  reservation?: Record<string, unknown>;
};

type ProofRealtimeMessage =
  | { type: 'proof.state'; invoiceId: string; state: { proofs?: unknown[]; isVerified?: boolean; latestStatus?: string | null } }
  | { type: 'proof.event'; invoiceId: string; event: ProofRealtimeEvent };

export function useProofRealtime(
  invoiceId: string | undefined,
  options: { shareToken?: string; onState: (message: ProofRealtimeMessage) => void },
) {
  const onStateRef = useRef(options.onState);

  useEffect(() => {
    onStateRef.current = options.onState;
  }, [options.onState]);

  useEffect(() => {
    if (!invoiceId) return;
    let socket: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: number | undefined;
    let reconnectDelay = 500;
    let reconnectAttempts = 0;
    let hasConnected = false;
    let tokenRequest: AbortController | undefined;

    const connect = async () => {
      if (stopped || reconnectAttempts >= 5) return;
      reconnectAttempts += 1;
      tokenRequest = new AbortController();
      const query = new URLSearchParams({ invoiceId });
      if (options.shareToken) query.set('shareToken', options.shareToken);
      const tokenResponse = await fetch(`/api/realtime/token?${query.toString()}`, { signal: tokenRequest.signal });
      if (!tokenResponse.ok || stopped) return;
      const { token } = await tokenResponse.json();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/api/realtime?token=${encodeURIComponent(token)}`);
      socket.onopen = () => { hasConnected = true; reconnectAttempts = 0; reconnectDelay = 500; };
      socket.onmessage = (event) => {
        try { onStateRef.current(JSON.parse(event.data) as ProofRealtimeMessage); } catch { /* ignore malformed messages */ }
      };
      socket.onclose = () => {
        const shouldReconnect = !stopped && (hasConnected || reconnectAttempts < 5);
        if (shouldReconnect) {
          reconnectTimer = window.setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 10000);
        }
      };
    };

    connect().catch(() => {
      if (!stopped && reconnectAttempts < 5) reconnectTimer = window.setTimeout(connect, reconnectDelay);
    });
    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      tokenRequest?.abort();
      socket?.close();
    };
  }, [invoiceId, options.shareToken]);
}

export type { ProofRealtimeEvent, ProofRealtimeMessage };
