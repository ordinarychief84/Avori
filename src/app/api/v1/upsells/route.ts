import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

// GET: offers to show at a placement (optionally for a trigger product).
export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const url = new URL(req.url);
    const placementParam = url.searchParams.get('placement') ?? 'PRODUCT_PAGE';
    const placement = ['PRODUCT_PAGE', 'CART', 'CHECKOUT', 'POST_PURCHASE'].includes(placementParam)
      ? (placementParam as 'PRODUCT_PAGE' | 'CART' | 'CHECKOUT' | 'POST_PURCHASE')
      : 'PRODUCT_PAGE';
    const productId = url.searchParams.get('productId');

    const offers = await prisma.upsellOffer.findMany({
      where: { brandId, status: 'ACTIVE', placement },
      orderBy: { priority: 'desc' },
    });
    const matching = offers.filter(
      (o) =>
        o.triggerProductIds.length === 0 ||
        (productId ? o.triggerProductIds.includes(productId) : false)
    );

    const productIds = [...new Set(matching.flatMap((o) => o.offerProductIds))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, brandId, status: 'ACTIVE' },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // Count an impression per matched offer.
    for (const o of matching) {
      await prisma.upsellOffer.update({
        where: { id: o.id },
        data: { impressions: { increment: 1 } },
      });
      await track({ brandId, type: 'UPSELL_IMPRESSION', refType: 'upsell', refId: o.id, productId: productId ?? undefined });
    }

    return ok({
      offers: matching.map((o) => ({
        id: o.id,
        headline: o.headline ?? o.name,
        description: o.description,
        discountPct: o.discountPct,
        products: o.offerProductIds
          .map((id) => productById.get(id))
          .filter((p) => p !== undefined)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            imageUrl: p.imageUrl,
            productUrl: p.productUrl,
          })),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

const eventSchema = z.object({
  offerId: z.string().min(1),
  event: z.enum(['click']),
});

// POST: attribution events from the storefront. Conversions are attributed
// automatically when the order arrives with `upsellOfferId`.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = eventSchema.parse(await req.json());
    await prisma.upsellOffer.updateMany({
      where: { id: data.offerId, brandId },
      data: { clicks: { increment: 1 } },
    });
    await track({ brandId, type: 'UPSELL_CLICK', refType: 'upsell', refId: data.offerId });
    return ok({ tracked: true });
  } catch (e) {
    return fail(e);
  }
}
