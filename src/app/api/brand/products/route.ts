import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { productSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const products = await prisma.product.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ products });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = productSchema.parse(await req.json());
    const product = await prisma.product.create({
      data: {
        brandId,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
        productUrl: data.productUrl,
        sku: data.sku || null,
        status: data.status,
        tryOnEnabled: data.tryOnEnabled ?? false,
        tryOnCategory: data.tryOnCategory ?? 'NONE',
        tryOnTint: data.tryOnTint ?? null,
      },
    });
    return ok({ product }, 201);
  } catch (e) {
    return fail(e);
  }
}
