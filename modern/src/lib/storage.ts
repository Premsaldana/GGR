import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export interface StorageAdapter {
  put(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  head(key: string): Promise<{ size: number; mimeType: string } | null>;
  delete(key: string): Promise<void>;
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private get supabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
  }

  async put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('payment-proofs')
      .upload(key, buffer, {
        contentType: mimeType,
        upsert: true
      });
    if (error) throw error;
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const { data, error } = await this.supabase.storage
      .from('payment-proofs')
      .download(key);
    
    if (error || !data) return null;
    
    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, mimeType: data.type };
  }

  async head(key: string): Promise<{ size: number; mimeType: string } | null> {
    const { data, error } = await this.supabase.storage
      .from('payment-proofs')
      .list('', { search: key, limit: 1 });
      
    if (error || !data || data.length === 0) return null;
    
    return { size: data[0].metadata?.size || 0, mimeType: data[0].metadata?.mimetype || 'application/octet-stream' };
  }

  async delete(key: string): Promise<void> {
    await this.supabase.storage.from('payment-proofs').remove([key]);
  }
}

export const paymentProofStorage = new SupabaseStorageAdapter();
export const paymentProofProvider = 'supabase';

export function generateStorageKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
