"use client";

import { useState } from 'react';
import { useProofRealtime } from '@/lib/useProofRealtime';
import { Button } from '@/components/ui/Button';

export function GuestRealtimeVerification({ token, invoiceId }: { token: string; invoiceId: string }) {
  const [verified, setVerified] = useState(false);
  useProofRealtime(invoiceId, {
    shareToken: token,
    onState: (message) => {
      if (message.type === 'proof.state') setVerified(Boolean(message.state.isVerified));
      if (message.type === 'proof.event' && (message.event.type === 'proof.verified' || message.event.type === 'invoice.finalized')) setVerified(true);
    },
  });

  if (!verified) return null;
  return (
    <div className="p-6 bg-[#E8F5E9] border-y border-[#C8E6C9] text-center">
      <p className="text-lg font-semibold text-[#2E7D32] mb-1">Payment Verified</p>
      <p className="text-sm text-[#388E3C] mb-5">The resort has verified your payment.</p>
      <Button as="a" href={`/api/share/${token}/download`} target="_blank" rel="noopener noreferrer" className="w-full">
        Download Invoice (PDF)
      </Button>
    </div>
  );
}
