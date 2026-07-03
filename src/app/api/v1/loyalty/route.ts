import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { getProgram, ensureMember, redeemReward } from '@/lib/loyalty';

// Customer-facing loyalty state: balance, tier, history, redeemable rewards.
export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase();
    if (!email) throw new HttpError(400, 'email query parameter required');

    const program = await getProgram(brandId);
    if (!program?.enabled) throw new HttpError(404, 'Loyalty program is not enabled');

    const customer = await prisma.customer.findUnique({
      where: { brandId_email: { brandId, email } },
    });
    if (!customer) throw new HttpError(404, 'Customer not found');

    const member = await ensureMember(brandId, customer.id);
    const [tier, transactions, rewards, credit] = await Promise.all([
      member.tierId ? prisma.loyaltyTier.findUnique({ where: { id: member.tierId } }) : null,
      prisma.pointsTransaction.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.reward.findMany({ where: { brandId, active: true }, orderBy: { pointsCost: 'asc' } }),
      prisma.creditAccount.findUnique({ where: { customerId: customer.id } }),
    ]);

    return ok({
      program: { pointsName: program.pointsName, earnRate: Number(program.earnRate), redeemRate: program.redeemRate },
      member: { points: member.points, lifetimePoints: member.lifetimePoints, tier: tier?.name ?? null },
      storeCredit: credit ? Number(credit.balance) : 0,
      rewards: rewards.map((r) => ({ id: r.id, name: r.name, type: r.type, pointsCost: r.pointsCost, value: Number(r.value) })),
      history: transactions,
    });
  } catch (e) {
    return fail(e);
  }
}

const redeemSchema = z.object({ email: z.string().email(), rewardId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = redeemSchema.parse(await req.json());
    const customer = await prisma.customer.findUnique({
      where: { brandId_email: { brandId, email: data.email.toLowerCase() } },
    });
    if (!customer) throw new HttpError(404, 'Customer not found');
    const { redemption, reward } = await redeemReward(brandId, customer.id, data.rewardId);
    return ok(
      {
        redemption: {
          code: redemption.code,
          reward: reward.name,
          type: reward.type,
          value: Number(reward.value),
          pointsSpent: redemption.pointsSpent,
        },
      },
      201
    );
  } catch (e) {
    return fail(e);
  }
}
