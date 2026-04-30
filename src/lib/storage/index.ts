export type StorageKind = 'video' | 'image';

export interface PutResult {
  url: string;
  key: string;
  bytes: number;
  contentType: string;
}

export interface StorageProvider {
  put(file: File, kind: StorageKind): Promise<PutResult>;
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

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateFile(file: File, kind: StorageKind): void {
  const maxBytes =
    kind === 'video'
      ? Number(process.env.MAX_VIDEO_BYTES ?? 200_000_000)
      : Number(process.env.MAX_IMAGE_BYTES ?? 10_000_000);
  if (file.size > maxBytes) throw new Error(`File too large (max ${maxBytes} bytes)`);
  const allowed = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) throw new Error(`Unsupported file type: ${file.type}`);
}

export function safeExtension(file: File): string {
  const fromName = file.name.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[file.type] ?? 'bin';
}
