import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

const patchSchema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const giftCard = await prisma.giftCard.findFirst({
      where: { id: params.id, brandId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!giftCard) throw new HttpError(404, 'Gift card not found');
    return ok({ giftCard });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = patchSchema.parse(await req.json());
    const existing = await prisma.giftCard.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Gift card not found');
    const giftCard = await prisma.giftCard.update({
      where: { id: existing.id },
      data: { status: data.status },
    });
    return ok({ giftCard });
  } catch (e) {
    return fail(e);
  }
}
