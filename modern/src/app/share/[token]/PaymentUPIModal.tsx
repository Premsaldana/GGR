'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPaymentAttemptAction } from './actions';
import { Button } from '@/components/ui/Button';

type Attempt = {
  id: string;
  upiUri: string | null;
  amountMinorUnits: number;
  expiresAt: string | Date;
  provider: string;
};

type PaymentStatus = {
  status: 'none' | 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'mismatch' | 'late';
  isVerified: boolean;
  amountMinorUnits: number | null;
  expectedAmountMinorUnits: number;
  providerPaymentId: string | null;
  utr: string | null;
  expiresAt: string | null;
  message: string;
};

function rupees(minorUnits: number | null | undefined) {
  return `₹${((minorUnits || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function secondsUntil(value: string | Date | null | undefined) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function PaymentUPIModal({ token, balanceMinorUnits }: { token: string; balanceMinorUnits: number }) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    const response = await fetch(`/api/share/${encodeURIComponent(token)}/payment-status`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to read payment status');
    const next = (await response.json()) as PaymentStatus & { attemptId?: string };
    setStatus(next);
    setCountdown(secondsUntil(next.expiresAt));
    if (next.status === 'expired' || next.status === 'failed') setAttempt((current) => current && current.id === next.attemptId ? null : current);
    return next;
  }, [token]);

  const createAttempt = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createPaymentAttemptAction(token, balanceMinorUnits);
      if (!result.success || !result.attempt) {
        setError(result.message || result.error || 'Automated payment is unavailable. Use the screenshot fallback below.');
        return;
      }
      setAttempt({
        id: result.attempt.id,
        upiUri: result.attempt.upiUri,
        amountMinorUnits: result.attempt.amountMinorUnits,
        expiresAt: result.attempt.expiresAt,
        provider: result.attempt.provider,
      });
      setCountdown(secondsUntil(result.attempt.expiresAt));
      await loadStatus();
    } catch {
      setError('Unable to start UPI payment. Please try again or upload payment proof.');
    } finally {
      setLoading(false);
    }
  }, [balanceMinorUnits, loadStatus, token]);

  useEffect(() => {
    if (!open || !attempt) return;
    let active = true;
    const poll = async () => {
      try {
        const next = await loadStatus();
        if (active && (next.isVerified || ['mismatch', 'late'].includes(next.status))) return;
      } catch {
        // Temporary network failures are retried on the next polling tick.
      }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), document.visibilityState === 'visible' ? 3000 : 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [attempt, loadStatus, open]);

  useEffect(() => {
    if (!open || !attempt) return;
    const timer = window.setInterval(() => setCountdown(secondsUntil(attempt.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [attempt, open]);

  const isConfirmed = status?.isVerified || status?.status === 'paid';
  const needsReview = status?.status === 'mismatch' || status?.status === 'late';
  const expired = countdown === 0 || status?.status === 'expired';
  const modalTitle = useMemo(() => {
    if (isConfirmed) return 'Payment confirmed';
    if (needsReview) return 'Payment received';
    if (status?.status === 'failed') return 'Payment failed';
    if (expired) return 'QR expired';
    return 'Pay securely with UPI';
  }, [expired, isConfirmed, needsReview, status?.status]);

  return (
    <>
      <div className="w-full rounded-xl border border-[#D6E7DD] bg-[#F3FBF6] p-5 text-center shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#3E6B55]">Automated payment</div>
        <h2 className="text-lg font-semibold text-[#233B35]">Pay your balance with UPI</h2>
        <p className="mt-1 text-sm text-gray-600">Get instant confirmation after the payment provider reports success.</p>
        <Button type="button" className="mt-4 w-full" onClick={() => { setOpen(true); void createAttempt(); }}>
          Pay {rupees(balanceMinorUnits)} with UPI
        </Button>
        <p className="mt-2 text-[11px] text-gray-500">You can still upload a screenshot if confirmation is delayed.</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="upi-payment-title">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3E6B55]">Goa Garden Resort</p>
                <h2 id="upi-payment-title" className="mt-1 text-xl font-semibold text-[#233B35]">{modalTitle}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-xl leading-none text-gray-500 hover:bg-gray-100" aria-label="Close payment modal">×</button>
            </div>

            {loading && <div className="py-12 text-center text-sm text-gray-600">Preparing your secure payment QR…</div>}
            {error && <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}

            {!loading && !error && isConfirmed && (
              <div className="mt-6 rounded-xl bg-[#E8F5E9] p-5 text-center text-[#2E7D32]">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4CAF50] text-2xl text-white">✓</div>
                <p className="font-semibold">Payment confirmed automatically.</p>
                <p className="mt-1 text-sm">Received {rupees(status?.amountMinorUnits)}{status?.utr ? ` · UTR ${status.utr}` : ''}</p>
                <Button as="a" href={`/api/share/${token}/download`} target="_blank" rel="noopener noreferrer" className="mt-4 w-full">Download voucher</Button>
              </div>
            )}

            {!loading && !error && needsReview && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {status?.message} Please do not pay again. The resort team will review this payment.
              </div>
            )}

            {!loading && !error && !isConfirmed && !needsReview && attempt && !expired && (
              <div className="mt-5 text-center">
                <div className="rounded-xl border border-gray-100 bg-[#FFFCF6] p-4">
                  {attempt.upiUri && <QRCodeSVG value={attempt.upiUri} size={220} className="mx-auto h-auto max-w-full" includeMargin />}
                </div>
                <p className="mt-4 text-3xl font-bold text-[#233B35]">{rupees(attempt.amountMinorUnits)}</p>
                <p className="mt-1 text-sm text-gray-600">Scan the QR code from any UPI app</p>
                {attempt.upiUri && <Button as="a" href={attempt.upiUri} className="mt-4 w-full sm:hidden">Open UPI app</Button>}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8A5A00]" aria-live="polite">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#D99A25]" /> Waiting for payment · QR expires in {formatCountdown(countdown)}
                </div>
                <p className="mt-3 text-xs text-gray-500">Keep this window open. We check for confirmation every few seconds.</p>
              </div>
            )}

            {!loading && !error && !isConfirmed && !needsReview && (expired || status?.status === 'failed') && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">{status?.message || 'This payment attempt has ended.'}</p>
                <Button type="button" loading={loading} className="mt-4 w-full" onClick={() => void createAttempt()}>Get a new QR</Button>
              </div>
            )}

            {!loading && !isConfirmed && (
              <p className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">Paid but not confirmed? Close this window and use the screenshot upload option below.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
