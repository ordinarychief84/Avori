import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';

// Shoppable social gallery feed.
export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const posts = await prisma.socialPost.findMany({
      where: { brandId, visible: true },
      orderBy: [{ sort: 'asc' }, { postedAt: 'desc' }],
      take: 60,
    });
    const productIds = [...new Set(posts.flatMap((p) => p.productIds))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return ok({
      posts: posts.map((p) => ({
        id: p.id,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        thumbnailUrl: p.thumbnailUrl,
        caption: p.caption,
        permalink: p.permalink,
        products: p.productIds
          .map((id) => byId.get(id))
          .filter((prod) => prod !== undefined)
          .map((prod) => ({
            id: prod.id,
            name: prod.name,
            price: Number(prod.price),
            imageUrl: prod.imageUrl,
            productUrl: prod.productUrl,
          })),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
