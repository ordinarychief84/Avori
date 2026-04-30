import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  type StorageProvider,
  type PutResult,
  type StorageKind,
  validateFile,
  safeExtension,
} from './index';

export class LocalStorageProvider implements StorageProvider {
  private root = process.env.LOCAL_UPLOAD_DIR ?? './public/uploads';

  async put(file: File, kind: StorageKind): Promise<PutResult> {
    validateFile(file, kind);
    const ext = safeExtension(file);
    const dir = kind === 'video' ? 'videos' : 'images';
    const filename = `${randomUUID()}.${ext}`;
    const absDir = path.resolve(this.root, dir);
    const absFile = path.join(absDir, filename);

    await mkdir(absDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absFile, buffer);

    const publicUrl = `/uploads/${dir}/${filename}`;
    return { url: publicUrl, key: `${dir}/${filename}`, bytes: file.size, contentType: file.type };
  }

  async delete(key: string): Promise<void> {
    if (key.includes('..')) return;
    const abs = path.resolve(this.root, key);
    try {
      await unlink(abs);
    } catch {
      // best-effort; missing file is fine
    }
  }
}
