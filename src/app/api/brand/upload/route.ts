import { NextRequest } from 'next/server';
import { requireBrand, HttpError } from '@/lib/auth';
import { storage, type StorageKind, isAllowedMime, maxBytesFor } from '@/lib/storage';
import { sniffMime, extensionFor } from '@/lib/storage/sniff';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await requireBrand();

    const kindHeader = (req.nextUrl.searchParams.get('kind') ?? '') as StorageKind | '';
    const contentLength = Number(req.headers.get('content-length') ?? 0);

    // Pre-check size before reading the body so a hostile upload can't OOM us.
    // We don't know the kind yet (it comes from formData) so we use the higher of
    // image/video caps and re-check post-parse.
    const cap = Math.max(maxBytesFor('video'), maxBytesFor('image'));
    if (contentLength > cap + 10_000) {
      throw new HttpError(413, 'Payload too large');
    }

    const form = await req.formData();
    const file = form.get('file');
    const kindRaw = (form.get('kind') as string) || kindHeader;
    if (!(file instanceof File)) throw new HttpError(400, 'No file provided');
    const kind: StorageKind = kindRaw === 'video' ? 'video' : 'image';

    const sizeCap = maxBytesFor(kind);
    if (file.size > sizeCap) throw new HttpError(413, `File too large (max ${sizeCap} bytes)`);

    const buf = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffMime(buf);
    if (!sniffed) throw new HttpError(415, 'Unsupported file type');
    if (!isAllowedMime(kind, sniffed)) {
      throw new HttpError(415, `${sniffed} is not allowed for ${kind}`);
    }

    const ext = extensionFor(sniffed);
    const result = await storage().put(buf, { kind, mime: sniffed, ext });
    return ok({ url: result.url, key: result.key, bytes: result.bytes, contentType: result.contentType });
  } catch (e) {
    return fail(e);
  }
}
