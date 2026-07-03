import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { referralProgramSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const program = await prisma.referralProgram.upsert({
      where: { brandId },
      update: {},
      create: { brandId },
    });
    return ok({ program });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = referralProgramSchema.parse(await req.json());
    const program = await prisma.referralProgram.upsert({
      where: { brandId },
      update: data,
      create: { brandId, ...data },
    });
    return ok({ program });
  } catch (e) {
    return fail(e);
  }
}
