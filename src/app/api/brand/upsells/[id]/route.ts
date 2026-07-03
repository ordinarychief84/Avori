import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { upsellSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = upsellSchema.partial().parse(await req.json());
    const existing = await prisma.upsellOffer.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Upsell offer not found');
    const upsell = await prisma.upsellOffer.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.placement !== undefined ? { placement: data.placement } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.triggerProductIds !== undefined ? { triggerProductIds: data.triggerProductIds } : {}),
        ...(data.offerProductIds !== undefined ? { offerProductIds: data.offerProductIds } : {}),
        ...(data.headline !== undefined ? { headline: data.headline || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.discountPct !== undefined ? { discountPct: data.discountPct } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
      },
    });
    return ok({ upsell });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.upsellOffer.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Upsell offer not found');
    await prisma.upsellOffer.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
