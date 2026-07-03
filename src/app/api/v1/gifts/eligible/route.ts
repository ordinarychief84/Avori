import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

const schema = z.object({
  subtotal: z.number().nonnegative(),
  productIds: z.array(z.string()).max(200).optional(),
});

// Which free-gift campaigns does this cart unlock?
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const { subtotal, productIds = [] } = schema.parse(await req.json());
    const now = new Date();

    const campaigns = await prisma.giftCampaign.findMany({
      where: { brandId, status: 'ACTIVE' },
    });
    const unlocked = campaigns.filter((c) => {
      if (c.startsAt && c.startsAt > now) return false;
      if (c.endsAt && c.endsAt < now) return false;
      if (c.trigger === 'CART_VALUE') {
        return c.thresholdAmount !== null && subtotal >= Number(c.thresholdAmount);
      }
      return c.triggerProductId !== null && productIds.includes(c.triggerProductId);
    });

    const giftProductIds = [...new Set(unlocked.flatMap((c) => c.giftProductIds))];
    const products = await prisma.product.findMany({
      where: { id: { in: giftProductIds }, brandId, status: 'ACTIVE' },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const c of unlocked) {
      await prisma.giftCampaign.update({
        where: { id: c.id },
        data: { unlockedCount: { increment: 1 } },
      });
      await track({ brandId, type: 'GIFT_UNLOCKED', refType: 'gift', refId: c.id, meta: { subtotal } });
    }

    return ok({
      gifts: unlocked.map((c) => ({
        campaignId: c.id,
        name: c.name,
        chooseGift: c.chooseGift,
        products: c.giftProductIds
          .map((id) => byId.get(id))
          .filter((p) => p !== undefined)
          .map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl })),
      })),
      // Progress hint for "spend X more to unlock" UI.
      nextThreshold: campaigns
        .filter(
          (c) =>
            c.trigger === 'CART_VALUE' &&
            c.thresholdAmount !== null &&
            subtotal < Number(c.thresholdAmount)
        )
        .map((c) => ({ campaignId: c.id, name: c.name, threshold: Number(c.thresholdAmount), remaining: Number(c.thresholdAmount) - subtotal }))
        .sort((a, b) => a.remaining - b.remaining)[0] ?? null,
    });
  } catch (e) {
    return fail(e);
  }
}
