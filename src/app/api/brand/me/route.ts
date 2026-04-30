import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { brandPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    return ok({ brand });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = brandPatchSchema.parse(await req.json());
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...data,
        domain: data.domain === '' ? null : data.domain,
      },
    });
    return ok({ brand });
  } catch (e) {
    return fail(e);
  }
}
