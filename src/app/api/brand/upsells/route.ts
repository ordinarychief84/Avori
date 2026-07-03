import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { upsellSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = upsellSchema.parse(await req.json());
    const upsell = await prisma.upsellOffer.create({
      data: {
        brandId,
        name: data.name,
        placement: data.placement ?? 'PRODUCT_PAGE',
        status: data.status ?? 'DRAFT',
        triggerProductIds: data.triggerProductIds ?? [],
        offerProductIds: data.offerProductIds ?? [],
        headline: data.headline || null,
        description: data.description || null,
        discountPct: data.discountPct ?? null,
        priority: data.priority ?? 0,
      },
    });
    return ok({ upsell }, 201);
  } catch (e) {
    return fail(e);
  }
}
