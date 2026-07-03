import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';

const schema = z.object({
  code: z.string().min(1).max(60),
  subtotal: z.number().nonnegative().optional(),
});

// One endpoint validates every kind of code the platform can issue:
// discount campaigns, loyalty reward redemptions, and gift cards.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const { code, subtotal } = schema.parse(await req.json());
    const now = new Date();

    const campaign = await prisma.discountCampaign.findUnique({
      where: { brandId_code: { brandId, code: code.toUpperCase() } },
    });
    if (campaign) {
      const active =
        campaign.status === 'ACTIVE' &&
        (!campaign.startsAt || campaign.startsAt <= now) &&
        (!campaign.endsAt || campaign.endsAt >= now) &&
        (campaign.usageLimit === null || campaign.usageCount < campaign.usageLimit) &&
        (campaign.minSubtotal === null ||
          subtotal === undefined ||
          subtotal >= Number(campaign.minSubtotal));
      return ok({
        valid: active,
        kind: 'discount',
        type: campaign.type,
        value: Number(campaign.value),
        ...(active ? {} : { reason: 'Code is not currently active or requirements not met' }),
      });
    }

    const redemption = await prisma.rewardRedemption.findUnique({
      where: { brandId_code: { brandId, code: code.toUpperCase() } },
      include: { reward: true },
    });
    if (redemption) {
      const usable = redemption.usedAt === null;
      const type =
        redemption.reward.type === 'DISCOUNT_FIXED'
          ? 'FIXED'
          : redemption.reward.type === 'DISCOUNT_PERCENT'
            ? 'PERCENT'
            : redemption.reward.type;
      return ok({
        valid: usable,
        kind: 'reward',
        type,
        value: Number(redemption.reward.value),
        ...(usable ? {} : { reason: 'This reward code has already been used' }),
      });
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { brandId_code: { brandId, code: code.toUpperCase() } },
    });
    if (giftCard) {
      const usable =
        giftCard.status === 'ACTIVE' &&
        Number(giftCard.balance) > 0 &&
        (!giftCard.expiresAt || giftCard.expiresAt >= now);
      return ok({
        valid: usable,
        kind: 'giftcard',
        balance: Number(giftCard.balance),
        currency: giftCard.currency,
        ...(usable ? {} : { reason: 'Gift card is empty, disabled or expired' }),
      });
    }

    return ok({ valid: false, kind: 'unknown', reason: 'Code not found' });
  } catch (e) {
    return fail(e);
  }
}
