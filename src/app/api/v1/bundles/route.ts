import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

// Active bundles, optionally filtered to ones featuring a given product.
export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const productId = new URL(req.url).searchParams.get('productId');

    const bundles = await prisma.bundle.findMany({
      where: {
        brandId,
        status: 'ACTIVE',
        ...(productId ? { items: { some: { productId } } } : {}),
      },
      include: { items: { include: { product: true } } },
    });

    for (const b of bundles) {
      await prisma.bundle.update({
        where: { id: b.id },
        data: { impressions: { increment: 1 } },
      });
      await track({ brandId, type: 'BUNDLE_IMPRESSION', refType: 'bundle', refId: b.id });
    }

    return ok({
      bundles: bundles.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        discountType: b.discountType,
        discountValue: Number(b.discountValue),
        config: b.config,
        items: b.items.map((i) => ({
          role: i.role,
          quantity: i.quantity,
          product: {
            id: i.product.id,
            name: i.product.name,
            price: Number(i.product.price),
            imageUrl: i.product.imageUrl,
            productUrl: i.product.productUrl,
          },
        })),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
