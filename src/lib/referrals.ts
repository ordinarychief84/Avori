import type { ReferralKind } from '@prisma/client';
import { prisma } from './prisma';
import { genReferralCode } from './codes';
import { ensureMember, addPoints, getProgram } from './loyalty';
import { addCredit } from './credit';
import { track } from './events';

export async function ensureReferral(
  brandId: string,
  customerId: string,
  kind: ReferralKind = 'CUSTOMER'
) {
  const existing = await prisma.referral.findFirst({ where: { brandId, customerId } });
  if (existing) {
    if (existing.kind !== kind) {
      return prisma.referral.update({ where: { id: existing.id }, data: { kind } });
    }
    return existing;
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  // Retry on the (brandId, code) unique constraint, collisions are rare.
  for (let i = 0; i < 3; i++) {
    try {
      return await prisma.referral.create({
        data: { brandId, customerId, kind, code: genReferralCode(customer?.firstName) },
      });
    } catch {
      continue;
    }
  }
  throw new Error('Could not allocate referral code');
}

export async function recordReferralClick(brandId: string, code: string, ip?: string) {
  const referral = await prisma.referral.findUnique({
    where: { brandId_code: { brandId, code } },
  });
  if (!referral) return null;
  await prisma.$transaction([
    prisma.referral.update({ where: { id: referral.id }, data: { clicks: { increment: 1 } } }),
    prisma.referralEvent.create({
      data: { brandId, referralId: referral.id, type: 'CLICK', ip: ip ?? null },
    }),
  ]);
  await track({ brandId, type: 'REFERRAL_CLICK', refType: 'referral', refId: referral.id, ip });
  return referral;
}

// Called by the order pipeline when a referral code rides along with an
// order. Applies fraud protection before paying out the referrer reward:
// self-referrals and repeat conversions from the same IP get flagged and
// recorded, but never rewarded.
export async function recordReferralConversion(params: {
  brandId: string;
  code: string;
  orderId: string;
  orderTotal: number;
  refereeEmail: string;
  ip?: string;
}): Promise<void> {
  const { brandId, code, orderId, orderTotal, refereeEmail, ip } = params;
  const referral = await prisma.referral.findUnique({
    where: { brandId_code: { brandId, code } },
    include: { customer: { select: { email: true } } },
  });
  if (!referral) return;

  let flagReason: string | null = null;
  if (referral.customer.email.toLowerCase() === refereeEmail.toLowerCase()) {
    flagReason = 'SELF_REFERRAL';
  } else if (ip) {
    const sameIp = await prisma.referralEvent.findFirst({
      where: { referralId: referral.id, type: 'CONVERSION', ip },
    });
    if (sameIp) flagReason = 'REPEAT_IP';
  }

  await prisma.referralEvent.create({
    data: {
      brandId,
      referralId: referral.id,
      type: 'CONVERSION',
      refereeEmail,
      orderId,
      ip: ip ?? null,
      flagged: flagReason !== null,
      flagReason,
    },
  });
  if (flagReason) return;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { conversions: { increment: 1 }, revenue: { increment: orderTotal } },
  });

  // Pay the referrer per program config: points and/or store credit.
  const rp = await prisma.referralProgram.findUnique({ where: { brandId } });
  if (!rp?.enabled) return;

  if (rp.referrerPoints > 0) {
    const loyalty = await getProgram(brandId);
    if (loyalty?.enabled) {
      const member = await ensureMember(brandId, referral.customerId);
      await addPoints({
        brandId,
        memberId: member.id,
        type: 'REFERRAL',
        points: rp.referrerPoints,
        reason: `Referral order by ${refereeEmail}`,
        orderId,
      });
    }
  }
  if (Number(rp.referrerCredit) > 0) {
    await addCredit({
      brandId,
      customerId: referral.customerId,
      type: 'ISSUE',
      amount: Number(rp.referrerCredit),
      reason: `Referral reward, order by ${refereeEmail}`,
      orderId,
    });
  }
  await prisma.referralEvent.create({
    data: { brandId, referralId: referral.id, type: 'REWARD', refereeEmail, orderId },
  });
}
