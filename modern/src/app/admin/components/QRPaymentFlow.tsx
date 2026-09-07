'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateQRAction, createShareLinkAction, getShareLinksAction, getLatestQRAction, revokeShareLinkAction } from '../(protected)/calendar/actions-qr';
import { Loader2, Copy, CheckCircle2, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface QRPaymentFlowProps {
  invoiceId: string;
  totalMinorUnits: number;
  advanceMinorUnits: number;
  balanceMinorUnits: number;
  securityDepositMinorUnits: number;
}

export function QRPaymentFlow({ invoiceId, totalMinorUnits, advanceMinorUnits, balanceMinorUnits, securityDepositMinorUnits }: QRPaymentFlowProps) {
  const [amountInput, setAmountInput] = useState<string>((balanceMinorUnits / 100).toString());
  const [qrArtifact, setQrArtifact] = useState<any>(null);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const loadData = async () => {
    const qr = await getLatestQRAction(invoiceId);
    if (qr) setQrArtifact(qr);
    const links = await getShareLinksAction(invoiceId);
    setShareLinks(links || []);
  };

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const handleGenerateQR = async () => {
    setError(null);
    const amt = parseFloat(amountInput) * 100;
    if (isNaN(amt) || amt < 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    setLoading(true);
    const res = await generateQRAction(invoiceId, Math.round(amt));
    if (res.error) {
      setError(res.error);
    } else {
      await loadData();
    }
    setLoading(false);
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    const res = await createShareLinkAction(invoiceId, 7);
    if (res.error) {
      setError(res.error);
    } else {
      const url = `${window.location.origin}/share/${res.rawToken}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 3000);
      } catch (err) {
        // Fallback if clipboard API fails
        console.warn('Clipboard API failed');
      }
      setGeneratedUrl(url);
      await loadData();
    }
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    setLoading(true);
    await revokeShareLinkAction(id);
    await loadData();
    setLoading(false);
  };

  const activeLinks = shareLinks.filter(l => new Date(l.expiresAt) > new Date());

  return (
    <div className="mt-8 border-t border-[#E8E1D6] pt-6 bg-white p-6 rounded shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-[#1D2422]">Payment Collection & Sharing (Slice 4A)</h3>
      
      {error && <div className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: QR Generation */}
        <div className="space-y-4">
          <h4 className="font-medium text-[#233B35] border-b pb-2">Generate UPI QR</h4>
          
          <div className="bg-gray-50 p-3 text-sm rounded border border-gray-200">
            <p><strong>Total:</strong> ₹{totalMinorUnits / 100}</p>
            <p><strong>Advance:</strong> ₹{advanceMinorUnits / 100}</p>
            <p><strong>Balance:</strong> ₹{balanceMinorUnits / 100}</p>
            <p className="text-xs text-gray-500 mt-1">Admin must explicitly confirm the QR amount.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleGenerateQR(); }}>
            <div>
              <label className="block text-sm font-medium mb-1">QR Payment Amount (₹) <span className="text-red-500">*</span></label>
              <input 
                required
                min="0"
                step="any"
                type="number" 
                value={amountInput} 
                onChange={(e) => setAmountInput(e.target.value)} 
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#233B35] text-white py-2 rounded hover:bg-opacity-90 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : qrArtifact ? <><RefreshCw size={16}/> Regenerate QR</> : "Generate QR"}
            </button>
          </form>

          {qrArtifact && (
            <div className="mt-4 flex flex-col items-center p-4 border border-[#E8E1D6] rounded bg-[#FFFCF6]">
              <div className="bg-white p-2 shadow-sm rounded">
                <QRCodeSVG value={qrArtifact.upiUri} size={150} />
              </div>
              <p className="text-sm font-bold mt-3 text-center">₹{qrArtifact.amountMinorUnits / 100}</p>
              <p className="text-xs text-center text-gray-500 mb-2">Payee: {qrArtifact.payeeName}</p>
              <div className="w-full bg-yellow-50 text-yellow-800 text-xs p-2 rounded text-center border border-yellow-200">
                QR generated for this amount. Payment is not verified by this screen.
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Share Link */}
        <div className="space-y-4">
          <h4 className="font-medium text-[#233B35] border-b pb-2">Shareable Guest Bill</h4>
          
          <p className="text-sm text-gray-600">
            Create a secure, read-only link for the guest to view their bill and scan the active QR code.
          </p>

          <button 
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full bg-[#B75E3C] text-white py-2 rounded hover:bg-opacity-90 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><LinkIcon size={16} /> Generate Share Link</>}
          </button>

          {copiedToken && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 size={14}/> Link copied to clipboard!
            </p>
          )}

          {generatedUrl && (
            <div className="mt-2 p-2 bg-gray-50 border rounded text-xs break-all flex flex-col gap-2">
              <span className="font-semibold text-gray-700">One-time viewing link:</span>
              <code className="text-blue-600">{generatedUrl}</code>
              <button 
                onClick={() => setGeneratedUrl(null)}
                className="text-gray-500 hover:text-gray-700 self-end"
              >
                Clear
              </button>
            </div>
          )}

          {activeLinks.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-semibold text-gray-500 uppercase">Active Links ({activeLinks.length})</h5>
              {activeLinks.map(link => (
                <div key={link.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 border rounded">
                  <span className="text-gray-600">Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                  <button onClick={() => handleRevoke(link.id)} className="text-red-500 hover:underline text-xs">Revoke</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
