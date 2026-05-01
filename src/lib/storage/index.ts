export type StorageKind = 'video' | 'image';

export interface PutResult {
  url: string;
  key: string;
  bytes: number;
  contentType: string;
}

export interface StorageProvider {
  put(buffer: Buffer, opts: { kind: StorageKind; mime: string; ext: string }): Promise<PutResult>;
  delete(key: string): Promise<void>;
}

import { LocalStorageProvider } from './local';

let _provider: StorageProvider | null = null;

export function storage(): StorageProvider {
  if (_provider) return _provider;
  const kind = process.env.STORAGE_PROVIDER ?? 'local';
  switch (kind) {
    case 'local':
      _provider = new LocalStorageProvider();
      return _provider;
    // case 's3':       _provider = new S3Provider();         return _provider;
    // case 'r2':       _provider = new R2Provider();         return _provider;
    // case 'mux':      _provider = new MuxProvider();        return _provider;
    // case 'uploadcare': _provider = new UploadcareProvider(); return _provider;
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${kind}`);
  }
}

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function maxBytesFor(kind: StorageKind): number {
  return kind === 'video'
    ? Number(process.env.MAX_VIDEO_BYTES ?? 200_000_000)
    : Number(process.env.MAX_IMAGE_BYTES ?? 10_000_000);
}

export function isAllowedMime(kind: StorageKind, mime: string): boolean {
  return kind === 'video' ? VIDEO_MIMES.has(mime) : IMAGE_MIMES.has(mime);
}
