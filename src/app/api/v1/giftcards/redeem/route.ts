import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { giftCardRedeemSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

// Deduct an amount from a gift card at checkout. Ledgered + atomic.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = giftCardRedeemSchema.parse(await req.json());

    const giftCard = await prisma.giftCard.findUnique({
      where: { brandId_code: { brandId, code: data.code.toUpperCase() } },
    });
    if (!giftCard || giftCard.status !== 'ACTIVE') throw new HttpError(404, 'Gift card not found');
    if (giftCard.expiresAt && giftCard.expiresAt < new Date())
      throw new HttpError(400, 'Gift card has expired');

    const applied = Math.min(Number(giftCard.balance), data.amount);
    if (applied <= 0) throw new HttpError(400, 'Gift card has no balance');

    const [updated] = await prisma.$transaction([
      prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { balance: { decrement: applied } },
      }),
      prisma.giftCardTransaction.create({
        data: { giftCardId: giftCard.id, amount: -applied, orderId: data.orderId ?? null },
      }),
    ]);
    return ok({ applied, remainingBalance: Number(updated.balance) });
  } catch (e) {
    return fail(e);
  }
}
