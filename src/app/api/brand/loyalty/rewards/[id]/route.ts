import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { rewardSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = rewardSchema.partial().parse(await req.json());
    const existing = await prisma.reward.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Reward not found');
    const reward = await prisma.reward.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.pointsCost !== undefined ? { pointsCost: data.pointsCost } : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.productId !== undefined ? { productId: data.productId || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return ok({ reward });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.reward.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Reward not found');
    await prisma.reward.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
