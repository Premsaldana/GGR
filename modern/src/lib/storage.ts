import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageAdapter {
  put(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  head(key: string): Promise<{ size: number; mimeType: string } | null>;
  delete(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'storage', 'proofs');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string) {
    return path.join(this.baseDir, key);
  }

  async put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const filePath = this.getFilePath(key);
    // Write both data and mimeType for local testing
    await fs.promises.writeFile(filePath, buffer);
    await fs.promises.writeFile(`${filePath}.mime`, mimeType);
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const filePath = this.getFilePath(key);
    try {
      const buffer = await fs.promises.readFile(filePath);
      const mimeType = await fs.promises.readFile(`${filePath}.mime`, 'utf8');
      return { buffer, mimeType };
    } catch (err) {
      return null;
    }
  }

  async head(key: string): Promise<{ size: number; mimeType: string } | null> {
    const filePath = this.getFilePath(key);
    try {
      const stat = await fs.promises.stat(filePath);
      const mimeType = await fs.promises.readFile(`${filePath}.mime`, 'utf8');
      return { size: stat.size, mimeType };
    } catch (err) {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(`${filePath}.mime`);
    } catch (err) {
      // Ignore if missing
    }
  }
}

export class S3StorageAdapter implements StorageAdapter {
  async put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    throw new Error('S3 adapter not implemented yet');
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    throw new Error('S3 adapter not implemented yet');
  }

  async head(key: string): Promise<{ size: number; mimeType: string } | null> {
    throw new Error('S3 adapter not implemented yet');
  }

  async delete(key: string): Promise<void> {
    throw new Error('S3 adapter not implemented yet');
  }
}

// In production, we'd look at env vars to select the provider
const isProd = process.env.NODE_ENV === 'production';
export const paymentProofStorage = isProd ? new S3StorageAdapter() : new LocalStorageAdapter();
export const paymentProofProvider = isProd ? 's3' : 'local';

export function generateStorageKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
