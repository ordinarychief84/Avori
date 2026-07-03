import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { audit } from '@/lib/audit';

// Revoke (not delete) so the audit trail keeps the key's history.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    const existing = await prisma.apiKey.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'API key not found');
    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    await audit({ brandId, userId, action: 'apikey.revoke', entity: 'apiKey', entityId: existing.id });
    return ok({ revoked: true });
  } catch (e) {
    return fail(e);
  }
}
