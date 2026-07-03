import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { loyaltyTierSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function findTier(brandId: string, id: string) {
  const tier = await prisma.loyaltyTier.findFirst({
    where: { id, program: { brandId } },
  });
  if (!tier) throw new HttpError(404, 'Tier not found');
  return tier;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = loyaltyTierSchema.partial().parse(await req.json());
    const existing = await findTier(brandId, params.id);
    const tier = await prisma.loyaltyTier.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.minPoints !== undefined ? { minPoints: data.minPoints } : {}),
        ...(data.multiplier !== undefined ? { multiplier: data.multiplier } : {}),
        ...(data.perks !== undefined ? { perks: data.perks || null } : {}),
      },
    });
    return ok({ tier });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await findTier(brandId, params.id);
    await prisma.loyaltyTier.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
