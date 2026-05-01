import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { type StorageProvider, type PutResult, type StorageKind } from './index';

export class LocalStorageProvider implements StorageProvider {
  private root = process.env.LOCAL_UPLOAD_DIR ?? './public/uploads';

  async put(
    buffer: Buffer,
    opts: { kind: StorageKind; mime: string; ext: string }
  ): Promise<PutResult> {
    const dir = opts.kind === 'video' ? 'videos' : 'images';
    const filename = `${randomUUID()}.${opts.ext}`;
    const absDir = path.resolve(this.root, dir);
    const absFile = path.join(absDir, filename);

    await mkdir(absDir, { recursive: true });
    await writeFile(absFile, buffer);

    return {
      url: `/uploads/${dir}/${filename}`,
      key: `${dir}/${filename}`,
      bytes: buffer.length,
      contentType: opts.mime,
    };
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
