"use client";

import { useEffect, useRef } from 'react';

type ProofRealtimeMessage = {
  type: 'proof.state';
  invoiceId: string;
  state: {
    fingerprint: string;
    proofs?: unknown[];
    isVerified?: boolean;
    latestStatus?: string | null;
  };
};

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

    const connect = async () => {
      const query = new URLSearchParams({ invoiceId });
      if (options.shareToken) query.set('shareToken', options.shareToken);
      const tokenResponse = await fetch(`/api/realtime/token?${query.toString()}`);
      if (!tokenResponse.ok || stopped) return;
      const { token } = await tokenResponse.json();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/api/realtime?token=${encodeURIComponent(token)}`);
      socket.onopen = () => { reconnectDelay = 500; };
      socket.onmessage = (event) => {
        try { onStateRef.current(JSON.parse(event.data) as ProofRealtimeMessage); } catch { /* ignore malformed messages */ }
      };
      socket.onclose = () => {
        if (!stopped) {
          reconnectTimer = window.setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 10000);
        }
      };
    };

    connect().catch(() => {
      if (!stopped) reconnectTimer = window.setTimeout(connect, reconnectDelay);
    });
    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [invoiceId, options.shareToken]);
}

export type { ProofRealtimeMessage };
