'use client';

import React, { useState, useRef } from 'react';
import { uploadProofAction } from './actions';
import { Button } from '@/components/ui/Button';

export function PaymentUploadForm({ token, hasPendingProof }: { token: string, hasPendingProof: boolean }) {
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(hasPendingProof);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (success) {
    return (
      <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
        <p className="text-sm font-medium text-green-700">Payment proof submitted for verification.</p>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a file to upload.');
      return;
    }

    const file = fileInputRef.current.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed.');
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    try {
      const result = await uploadProofAction(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
      <h3 className="text-sm font-medium text-gray-800 mb-2">Upload Payment Proof</h3>
      <p className="text-xs text-gray-500 mb-4">Please upload a screenshot of your payment (JPG, PNG, PDF max 5MB).</p>
      
      <form onSubmit={handleUpload} className="flex flex-col items-center space-y-3 w-full max-w-sm">
        <label htmlFor="proof-upload" className="sr-only">Upload file</label>
        <input 
          id="proof-upload"
          name="file"
          type="file" 
          ref={fileInputRef} 
          accept="image/jpeg, image/png, application/pdf"
          required
          className="text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#233B35] file:text-white hover:file:bg-[#1a2c27] cursor-pointer w-full"
          disabled={isUploading}
        />
        
        {error && <p className="text-xs text-red-600">{error}</p>}
        
        <Button type="submit" loading={isUploading} className="w-full">
          {isUploading ? 'Uploading...' : 'Submit Proof'}
        </Button>
      </form>
    </div>
  );
}
