import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { bundleSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = bundleSchema.partial().parse(await req.json());
    const existing = await prisma.bundle.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Bundle not found');

    const bundle = await prisma.$transaction(async (tx) => {
      if (data.items !== undefined) {
        // Items are replaced wholesale — the builder sends the full list.
        await tx.bundleItem.deleteMany({ where: { bundleId: existing.id } });
        await tx.bundleItem.createMany({
          data: data.items.map((i) => ({
            bundleId: existing.id,
            productId: i.productId,
            role: i.role ?? 'ANY',
            quantity: i.quantity ?? 1,
          })),
        });
      }
      return tx.bundle.update({
        where: { id: existing.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
          ...(data.discountValue !== undefined ? { discountValue: data.discountValue } : {}),
          ...(data.config !== undefined ? { config: data.config ?? undefined } : {}),
        },
        include: { items: { include: { product: true } } },
      });
    });
    return ok({ bundle });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.bundle.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Bundle not found');
    await prisma.bundle.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
