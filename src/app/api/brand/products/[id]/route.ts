import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { productPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function ownProduct(brandId: string, id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.brandId !== brandId) throw new HttpError(404, 'Not found');
  return product;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const product = await ownProduct(brandId, params.id);
    return ok({ product });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownProduct(brandId, params.id);
    const data = productPatchSchema.parse(await req.json());
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        sku: data.sku === '' ? null : data.sku,
      },
    });
    return ok({ product });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownProduct(brandId, params.id);
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
