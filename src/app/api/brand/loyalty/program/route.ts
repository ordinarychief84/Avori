import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { loyaltyProgramSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { audit } from '@/lib/audit';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const program = await prisma.loyaltyProgram.upsert({
      where: { brandId },
      update: {},
      create: { brandId },
      include: { tiers: { orderBy: { minPoints: 'asc' } } },
    });
    return ok({ program });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = loyaltyProgramSchema.parse(await req.json());
    const program = await prisma.loyaltyProgram.upsert({
      where: { brandId },
      update: data,
      create: { brandId, ...data },
      include: { tiers: { orderBy: { minPoints: 'asc' } } },
    });
    await audit({ brandId, userId, action: 'loyalty.program.update', entity: 'loyaltyProgram', entityId: program.id, meta: data });
    return ok({ program });
  } catch (e) {
    return fail(e);
  }
}
