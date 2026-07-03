import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Shoppable social gallery for the storefront widget.
export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`social:${ip}`, 600);
    if (!allowed) return fail(new Error('Rate limited'));

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return ok({ posts: [] });

    const posts = await prisma.socialPost.findMany({
      where: { brandId: brand.id, visible: true },
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

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
