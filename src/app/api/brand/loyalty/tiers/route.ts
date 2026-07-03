import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { loyaltyTierSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = loyaltyTierSchema.parse(await req.json());
    const program = await prisma.loyaltyProgram.upsert({
      where: { brandId },
      update: {},
      create: { brandId },
    });
    const tier = await prisma.loyaltyTier.create({
      data: {
        programId: program.id,
        name: data.name,
        minPoints: data.minPoints,
        multiplier: data.multiplier,
        perks: data.perks || null,
      },
    });
    return ok({ tier }, 201);
  } catch (e) {
    return fail(e);
  }
}
