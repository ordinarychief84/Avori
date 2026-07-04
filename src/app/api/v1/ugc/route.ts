import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';

// Curated UGC gallery for headless builds. Defaults to published items;
// pass ?status=PENDING|HIDDEN to inspect the moderation queue, and
// ?productId=... to narrow to one product's wall.
export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status');
    const status =
      statusParam === 'PENDING' || statusParam === 'HIDDEN' ? statusParam : 'APPROVED';
    const productId = url.searchParams.get('productId');

    const items = await prisma.ugcItem.findMany({
      where: {
        brandId,
        status,
        ...(productId ? { productIds: { has: productId } } : {}),
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const productIds = [...new Set(items.flatMap((i) => i.productIds))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, brandId, status: 'ACTIVE' },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return ok({
      items: items.map((i) => ({
        id: i.id,
        source: i.source,
        status: i.status,
        mediaUrl: i.mediaUrl,
        mediaType: i.mediaType,
        thumbnailUrl: i.thumbnailUrl,
        caption: i.caption,
        creditName: i.creditName,
        products: i.productIds
          .map((id) => byId.get(id))
          .filter((p) => p !== undefined)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            imageUrl: p.imageUrl,
            productUrl: p.productUrl,
          })),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
