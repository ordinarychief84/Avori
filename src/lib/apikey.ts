import crypto from 'crypto';
import { prisma } from './prisma';
import { HttpError } from './auth';

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Full key is shown exactly once at creation; only the sha256 is stored.
export function generateApiKey(): { key: string; prefix: string; hashedKey: string } {
  const key = `avk_${crypto.randomBytes(24).toString('base64url')}`;
  return { key, prefix: key.slice(0, 12), hashedKey: sha256(key) };
}

// Auth for the public REST API (/api/v1/*). Callers send
// `Authorization: Bearer avk_...`. Returns the tenant scope for every query.
export async function requireApiKey(req: Request): Promise<{ brandId: string; apiKeyId: string }> {
  const header = req.headers.get('authorization') ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key) throw new HttpError(401, 'Missing API key. Send Authorization: Bearer <key>');

  const record = await prisma.apiKey.findUnique({
    where: { hashedKey: sha256(key) },
    include: { brand: { select: { disabled: true } } },
  });
  if (!record || record.revokedAt) throw new HttpError(401, 'Invalid or revoked API key');
  if (record.brand.disabled) throw new HttpError(403, 'This workspace is disabled');

  // Touch lastUsedAt at most once a minute, fire-and-forget so the request
  // never waits on bookkeeping.
  if (!record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > 60_000) {
    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }

  return { brandId: record.brandId, apiKeyId: record.id };
}
