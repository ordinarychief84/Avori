import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { audit } from '@/lib/audit';

const patchSchema = z.object({ brandRole: z.enum(['OWNER', 'MANAGER', 'STAFF']) });

async function requireOwner(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.brandRole !== 'OWNER') throw new HttpError(403, 'Only the workspace owner can manage the team');
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    await requireOwner(userId);
    const data = patchSchema.parse(await req.json());
    const existing = await prisma.user.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Team member not found');
    const member = await prisma.user.update({
      where: { id: existing.id },
      data: { brandRole: data.brandRole },
      select: { id: true, email: true, name: true, brandRole: true },
    });
    return ok({ member });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    await requireOwner(userId);
    if (params.id === userId) throw new HttpError(400, 'You cannot remove yourself');
    const existing = await prisma.user.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Team member not found');
    await prisma.user.delete({ where: { id: existing.id } });
    await audit({ brandId, userId, action: 'team.remove', entity: 'user', entityId: existing.id, meta: { email: existing.email } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
