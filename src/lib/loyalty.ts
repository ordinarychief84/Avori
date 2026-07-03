import type { LoyaltyMember, LoyaltyProgram, LoyaltyTier, PointsTxType } from '@prisma/client';
import { prisma } from './prisma';
import { HttpError } from './auth';
import { genCode } from './codes';
import { addCredit } from './credit';

export async function getProgram(brandId: string): Promise<(LoyaltyProgram & { tiers: LoyaltyTier[] }) | null> {
  return prisma.loyaltyProgram.findUnique({ where: { brandId }, include: { tiers: { orderBy: { minPoints: 'asc' } } } });
}

export async function ensureMember(brandId: string, customerId: string): Promise<LoyaltyMember> {
  const existing = await prisma.loyaltyMember.findUnique({ where: { customerId } });
  if (existing) return existing;

  const member = await prisma.loyaltyMember.create({ data: { brandId, customerId } });
  const program = await getProgram(brandId);
  if (program?.enabled && program.signupBonus > 0) {
    return addPoints({
      brandId,
      memberId: member.id,
      type: 'SIGNUP',
      points: program.signupBonus,
      reason: 'Welcome bonus',
    });
  }
  return member;
}

function tierFor(tiers: LoyaltyTier[], lifetimePoints: number): LoyaltyTier | null {
  let match: LoyaltyTier | null = null;
  for (const t of tiers) if (lifetimePoints >= t.minPoints) match = t;
  return match;
}

// Single entry point for every points change: writes the ledger row, moves
// the balance, and recomputes the VIP tier from lifetime points.
export async function addPoints(params: {
  brandId: string;
  memberId: string;
  type: PointsTxType;
  points: number; // signed
  reason?: string;
  orderId?: string;
}): Promise<LoyaltyMember> {
  const member = await prisma.loyaltyMember.findUnique({ where: { id: params.memberId } });
  if (!member) throw new HttpError(404, 'Loyalty member not found');
  const balance = member.points + params.points;
  if (balance < 0) throw new HttpError(400, 'Insufficient points balance');
  const lifetime = member.lifetimePoints + Math.max(params.points, 0);

  const program = await getProgram(params.brandId);
  const tier = program ? tierFor(program.tiers, lifetime) : null;

  const [updated] = await prisma.$transaction([
    prisma.loyaltyMember.update({
      where: { id: member.id },
      data: { points: balance, lifetimePoints: lifetime, tierId: tier?.id ?? null },
    }),
    prisma.pointsTransaction.create({
      data: {
        brandId: params.brandId,
        memberId: member.id,
        type: params.type,
        points: params.points,
        reason: params.reason ?? null,
        orderId: params.orderId ?? null,
      },
    }),
  ]);
  return updated;
}

// Earn points for a paid order: total * earnRate * tier multiplier.
export async function earnForOrder(
  brandId: string,
  customerId: string,
  orderTotal: number,
  orderId: string
): Promise<void> {
  const program = await getProgram(brandId);
  if (!program?.enabled || orderTotal <= 0) return;

  const member = await ensureMember(brandId, customerId);
  const tier = member.tierId ? program.tiers.find((t) => t.id === member.tierId) : null;
  const multiplier = tier ? Number(tier.multiplier) : 1;
  const points = Math.floor(orderTotal * Number(program.earnRate) * multiplier);
  if (points <= 0) return;

  await addPoints({ brandId, memberId: member.id, type: 'EARN', points, reason: 'Order', orderId });
}

// Spend points on a reward. Discount rewards return a one-time code the
// storefront validates via /api/v1/discounts/validate; store-credit rewards
// apply immediately to the customer's wallet.
export async function redeemReward(brandId: string, customerId: string, rewardId: string) {
  const reward = await prisma.reward.findFirst({ where: { id: rewardId, brandId, active: true } });
  if (!reward) throw new HttpError(404, 'Reward not found');

  const member = await ensureMember(brandId, customerId);
  if (member.points < reward.pointsCost) throw new HttpError(400, 'Not enough points for this reward');

  await addPoints({
    brandId,
    memberId: member.id,
    type: 'REDEEM',
    points: -reward.pointsCost,
    reason: `Redeemed: ${reward.name}`,
  });

  const isCredit = reward.type === 'STORE_CREDIT';
  const redemption = await prisma.rewardRedemption.create({
    data: {
      brandId,
      rewardId: reward.id,
      memberId: member.id,
      customerId,
      pointsSpent: reward.pointsCost,
      code: genCode('RWD'),
      usedAt: isCredit ? new Date() : null,
    },
  });

  if (isCredit) {
    await addCredit({
      brandId,
      customerId,
      type: 'ISSUE',
      amount: Number(reward.value),
      reason: `Reward: ${reward.name}`,
    });
  }

  return { redemption, reward };
}

// Grant birthday bonuses at most once per calendar year. Invoked by the
// job runner daily.
export async function grantBirthdayBonuses(brandId: string): Promise<number> {
  const program = await getProgram(brandId);
  if (!program?.enabled || program.birthdayBonus <= 0) return 0;

  const now = new Date();
  const members = await prisma.loyaltyMember.findMany({
    where: {
      brandId,
      customer: { birthday: { not: null } },
      OR: [{ birthdayRewardedYear: null }, { birthdayRewardedYear: { lt: now.getFullYear() } }],
    },
    include: { customer: { select: { birthday: true } } },
  });

  let granted = 0;
  for (const m of members) {
    const b = m.customer.birthday!;
    if (b.getMonth() === now.getMonth() && b.getDate() === now.getDate()) {
      await addPoints({
        brandId,
        memberId: m.id,
        type: 'BIRTHDAY',
        points: program.birthdayBonus,
        reason: 'Happy birthday!',
      });
      await prisma.loyaltyMember.update({
        where: { id: m.id },
        data: { birthdayRewardedYear: now.getFullYear() },
      });
      granted++;
    }
  }
  return granted;
}
