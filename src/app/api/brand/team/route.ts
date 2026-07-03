import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { teamInviteSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { audit } from '@/lib/audit';

// Only workspace owners can manage the team.
async function requireOwner(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.brandRole !== 'OWNER') throw new HttpError(403, 'Only the workspace owner can manage the team');
}

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    await requireOwner(userId);
    const data = teamInviteSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new HttpError(409, 'A user with this email already exists');

    const member = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name || null,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: 'BRAND',
        brandRole: data.brandRole ?? 'STAFF',
        brandId,
      },
      select: { id: true, email: true, name: true, brandRole: true, createdAt: true },
    });
    await audit({ brandId, userId, action: 'team.invite', entity: 'user', entityId: member.id, meta: { email: member.email, brandRole: member.brandRole } });
    return ok({ member }, 201);
  } catch (e) {
    return fail(e);
  }
}
