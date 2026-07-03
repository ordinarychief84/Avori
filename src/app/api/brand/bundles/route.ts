import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { bundleSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = bundleSchema.parse(await req.json());
    const bundle = await prisma.bundle.create({
      data: {
        brandId,
        name: data.name,
        type: data.type,
        status: data.status ?? 'DRAFT',
        discountType: data.discountType ?? 'PERCENT',
        discountValue: data.discountValue ?? 0,
        config: data.config ?? undefined,
        items: data.items
          ? {
              create: data.items.map((i) => ({
                productId: i.productId,
                role: i.role ?? 'ANY',
                quantity: i.quantity ?? 1,
              })),
            }
          : undefined,
      },
      include: { items: { include: { product: true } } },
    });
    return ok({ bundle }, 201);
  } catch (e) {
    return fail(e);
  }
}
