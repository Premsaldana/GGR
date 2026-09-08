"use client";

import { useState } from 'react';
import { useProofRealtime } from '@/lib/useProofRealtime';

export function GuestRealtimeVerification({ token, invoiceId }: { token: string; invoiceId: string }) {
  const [verified, setVerified] = useState(false);
  useProofRealtime(invoiceId, {
    shareToken: token,
    onState: (message) => setVerified(Boolean(message.state.isVerified)),
  });

  if (!verified) return null;
  return (
    <div className="p-6 bg-[#E8F5E9] border-y border-[#C8E6C9] text-center">
      <p className="text-lg font-semibold text-[#2E7D32] mb-1">Payment Verified</p>
      <p className="text-sm text-[#388E3C] mb-5">The resort has verified your payment.</p>
      <a
        href={`/api/share/${token}/download`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 px-4 bg-[#2E7D32] text-white rounded-md text-sm font-semibold hover:bg-[#1B5E20] transition-colors shadow-sm"
      >
        Download Invoice (PDF)
      </a>
    </div>
  );
}
