import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { rewardSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = rewardSchema.parse(await req.json());
    const reward = await prisma.reward.create({
      data: {
        brandId,
        name: data.name,
        type: data.type,
        pointsCost: data.pointsCost,
        value: data.value ?? 0,
        productId: data.productId || null,
        active: data.active ?? true,
      },
    });
    return ok({ reward }, 201);
  } catch (e) {
    return fail(e);
  }
}
