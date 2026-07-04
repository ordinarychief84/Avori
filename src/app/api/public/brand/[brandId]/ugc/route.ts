import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// The gallery renders on a CUSTOMER site, so relative /uploads paths must be
// absolutized against Avori's origin (same rule as the videos feed).
function absolutize(req: NextRequest, value: string | null): string | null {
  if (!value) return value;
  if (/^https?:\/\//.test(value)) return value;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
}

export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`ugc:${ip}`, 600);
    if (!allowed) return fail(new Error('Rate limited'));

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return ok({ brand: null, items: [] });

    // Optional product targeting: ?productId=... narrows to items tagged with
    // that product; untagged items are global and always included.
    const productId = new URL(req.url).searchParams.get('productId');
    const items = await prisma.ugcItem.findMany({
      where: {
        brandId: params.brandId,
        status: 'APPROVED',
        ...(productId
          ? { OR: [{ productIds: { isEmpty: true } }, { productIds: { has: productId } }] }
          : {}),
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      take: 60,
    });

    const productIds = [...new Set(items.flatMap((i) => i.productIds))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, brandId: params.brandId, status: 'ACTIVE' },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return ok({
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
      items: items.map((i) => ({
        id: i.id,
        mediaUrl: absolutize(req, i.mediaUrl),
        mediaType: i.mediaType,
        thumbnailUrl: absolutize(req, i.thumbnailUrl),
        caption: i.caption,
        creditName: i.creditName,
        products: i.productIds
          .map((id) => byId.get(id))
          .filter((p) => p !== undefined)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            imageUrl: absolutize(req, p.imageUrl),
            productUrl: p.productUrl,
          })),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
