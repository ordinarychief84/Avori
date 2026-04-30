import { NextRequest } from 'next/server';
import { requireBrand, HttpError } from '@/lib/auth';
import { storage, type StorageKind } from '@/lib/storage';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await requireBrand();
    const form = await req.formData();
    const file = form.get('file');
    const kindRaw = form.get('kind');
    if (!(file instanceof File)) throw new HttpError(400, 'No file provided');
    const kind: StorageKind = kindRaw === 'video' ? 'video' : 'image';
    const result = await storage().put(file, kind);
    return ok({ url: result.url, key: result.key, bytes: result.bytes });
  } catch (e) {
    return fail(e);
  }
}
