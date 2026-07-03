import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { giftCampaignSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = giftCampaignSchema.parse(await req.json());
    const gift = await prisma.giftCampaign.create({
      data: {
        brandId,
        name: data.name,
        status: data.status ?? 'DRAFT',
        trigger: data.trigger ?? 'CART_VALUE',
        thresholdAmount: data.thresholdAmount ?? null,
        triggerProductId: data.triggerProductId ?? null,
        giftProductIds: data.giftProductIds ?? [],
        chooseGift: data.chooseGift ?? false,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
    return ok({ gift }, 201);
  } catch (e) {
    return fail(e);
  }
}
