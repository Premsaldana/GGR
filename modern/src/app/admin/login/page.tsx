'use client';

import { useState, useEffect } from 'react';
import { sendOtp, verifyOtp, setupTotp, verifyTotp, verifyRecoveryCode } from '../actions';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'totp_setup' | 'totp' | 'recovery'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [totp, setTotp] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await sendOtp(email);
    if (res?.error) setError(res.error);
    else setStep('otp');
    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await verifyOtp(otp);
    if (res?.error) setError(res.error);
    else if (res?.needsTotpSetup) {
      const setupRes = await setupTotp();
      if (setupRes?.error) setError(setupRes.error);
      else {
        setTotpUri(setupRes.uri!);
        setTotpSecret(setupRes.secret!);
        setRecoveryCodes(setupRes.recoveryCodes!);
        setStep('totp_setup');
      }
    } else {
      setStep('totp');
    }
    setLoading(false);
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await verifyTotp(totp, step === 'totp_setup' ? totpSecret : undefined);
    if (res?.error) setError(res.error);
    else router.push('/admin');
    setLoading(false);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await verifyRecoveryCode(recoveryCode);
    if (res?.error) setError(res.error);
    else {
      // Recovery success, prompt to setup TOTP again
      const setupRes = await setupTotp();
      if (setupRes?.error) setError(setupRes.error);
      else {
        setTotpUri(setupRes.uri!);
        setTotpSecret(setupRes.secret!);
        setRecoveryCodes(setupRes.recoveryCodes!);
        setStep('totp_setup');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (totpUri) {
      QRCode.toDataURL(totpUri).then(setQrCodeUrl);
    }
  }, [totpUri]);

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
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Sign in with your authorized email to receive a code.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md" placeholder="admin@goagardenresort.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium hover:bg-[var(--color-admin-danger)] transition">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Enter the 6-digit code sent to {email}.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Email Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="w-full px-3 py-2 border rounded-md tracking-widest text-center text-lg" placeholder="123456" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium hover:bg-[var(--color-admin-danger)] transition">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {step === 'totp_setup' && !setupComplete && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[var(--color-admin-danger)] mb-4 text-center">Save these recovery codes! You will not see them again.</p>
            <div className="bg-white border rounded p-4 font-mono text-sm grid grid-cols-2 gap-2 text-center h-32 overflow-auto">
              {recoveryCodes.map((code) => <div key={code}>{code}</div>)}
            </div>
            <button onClick={() => setSetupComplete(true)} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium transition">
              I have saved my recovery codes
            </button>
          </div>
        )}

        {step === 'totp_setup' && setupComplete && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Set up your Authenticator App. Scan the QR code below.</p>
            <div className="flex justify-center mb-4">
              {qrCodeUrl && <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48 border rounded-md" />}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Authenticator Code</label>
              <input type="text" value={totp} onChange={(e) => setTotp(e.target.value)} required maxLength={6} className="w-full px-3 py-2 border rounded-md tracking-widest text-center text-lg" placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium transition">
              {loading ? 'Verifying...' : 'Complete Setup'}
            </button>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Enter the code from your Authenticator app.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Authenticator Code</label>
              <input type="text" value={totp} onChange={(e) => setTotp(e.target.value)} required maxLength={6} className="w-full px-3 py-2 border rounded-md tracking-widest text-center text-lg" placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium transition mb-2">
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            <button type="button" onClick={() => setStep('recovery')} className="text-xs text-center w-full text-[var(--color-admin-sage)] hover:underline">
              Lost your device? Use a recovery code.
            </button>
          </form>
        )}

        {step === 'recovery' && (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-admin-sage)] mb-4">Enter one of your 8-character recovery codes to reset MFA.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Recovery Code</label>
              <input type="text" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required maxLength={8} className="w-full px-3 py-2 border rounded-md font-mono text-center text-lg uppercase" placeholder="ABCDEF12" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] py-2 rounded-md font-medium transition">
              {loading ? 'Verifying...' : 'Use Recovery Code'}
            </button>
            <button type="button" onClick={() => setStep('totp')} className="text-xs text-center w-full text-[var(--color-admin-sage)] hover:underline mt-2">
              Back to Authenticator
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
