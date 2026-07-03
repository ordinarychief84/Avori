import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { giftCardCreateSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { genGiftCardCode } from '@/lib/codes';
import { audit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = giftCardCreateSchema.parse(await req.json());
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { currency: true } });

    // Retry on the (brandId, code) unique constraint, collisions are rare.
    let giftCard = null;
    for (let i = 0; i < 3 && !giftCard; i++) {
      try {
        giftCard = await prisma.giftCard.create({
          data: {
            brandId,
            code: genGiftCardCode(),
            initialValue: data.initialValue,
            balance: data.initialValue,
            currency: brand?.currency ?? 'USD',
            recipientEmail: data.recipientEmail || null,
            note: data.note || null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          },
        });
      } catch {
        continue;
      }
    }
    if (!giftCard) throw new Error('Could not allocate gift card code');

    await audit({
      brandId,
      userId,
      action: 'giftcard.create',
      entity: 'giftCard',
      entityId: giftCard.id,
      meta: { value: data.initialValue },
    });
    return ok({ giftCard }, 201);
  } catch (e) {
    return fail(e);
  }
}
