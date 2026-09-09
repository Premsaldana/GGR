'use client';

import { useState } from 'react';
import { sendOtp, verifyOtp } from '../actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(email);
      if (res?.error) setError(res.error);
      else setStep('otp');
    } catch {
      setError('We could not start sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(otp);
      if (res?.error) setError(res.error);
      else router.push('/admin');
    } catch {
      setError('We could not verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-admin-shell)] rounded-xl shadow-lg border border-[var(--color-admin-mist)] p-8">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold mb-6 text-center">Goa Garden Resort Admin</h1>

        {error && (
          <div className="mb-4 p-3 bg-[var(--color-admin-danger)]/10 border border-[var(--color-admin-danger)] text-[var(--color-admin-danger)] rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Enter your authorized email to receive a Gmail verification code.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md" placeholder="admin@goagardenresort.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium hover:bg-[var(--color-admin-danger)] transition">
              {loading ? 'Sending...' : 'Send Gmail OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Enter the 6-digit code sent to {email}.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Gmail Verification Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} inputMode="numeric" autoComplete="one-time-code" className="w-full px-3 py-2 border rounded-md tracking-widest text-center text-lg" placeholder="123456" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium hover:bg-[var(--color-admin-danger)] transition">
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
