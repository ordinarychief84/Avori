import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { giftCampaignSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = giftCampaignSchema.partial().parse(await req.json());
    const existing = await prisma.giftCampaign.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Gift campaign not found');
    const gift = await prisma.giftCampaign.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.trigger !== undefined ? { trigger: data.trigger } : {}),
        ...(data.thresholdAmount !== undefined ? { thresholdAmount: data.thresholdAmount } : {}),
        ...(data.triggerProductId !== undefined ? { triggerProductId: data.triggerProductId } : {}),
        ...(data.giftProductIds !== undefined ? { giftProductIds: data.giftProductIds } : {}),
        ...(data.chooseGift !== undefined ? { chooseGift: data.chooseGift } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      },
    });
    return ok({ gift });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.giftCampaign.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Gift campaign not found');
    await prisma.giftCampaign.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
