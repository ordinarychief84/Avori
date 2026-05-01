import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// The widget runs on a CUSTOMER site, not on Avori's origin. Relative paths
// (e.g. /uploads/images/...) returned by the storage layer would resolve to
// the customer's domain, breaking video/image loads. Absolutize before
// sending. The base origin is preferentially NEXT_PUBLIC_APP_URL (so it
// works behind reverse proxies), falling back to the request URL's origin.
function absolutize(req: NextRequest, value: string | null): string | null {
  if (!value) return value;
  if (/^https?:\/\//.test(value)) return value;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
}

export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`videos:${ip}`, 600);
    if (!allowed) return fail(new Error('Rate limited'));

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return ok({ brand: null, videos: [] });

    const videos = await prisma.video.findMany({
      where: { brandId: params.brandId, status: 'ACTIVE', disabled: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tags: {
          where: { product: { status: 'ACTIVE' } },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                productUrl: true,
                tryOnEnabled: true,
                tryOnCategory: true,
                tryOnTint: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    const sanitized = videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      videoUrl: absolutize(req, v.videoUrl),
      thumbnailUrl: absolutize(req, v.thumbnailUrl),
      durationSec: v.durationSec,
      tags: v.tags.map((t) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        startTime: t.startTime,
        endTime: t.endTime,
        product: {
          id: t.product.id,
          name: t.product.name,
          price: Number(t.product.price),
          imageUrl: absolutize(req, t.product.imageUrl),
          productUrl: t.product.productUrl,
          tryOn:
            t.product.tryOnEnabled && t.product.tryOnCategory !== 'NONE'
              ? {
                  category: t.product.tryOnCategory,
                  tint: t.product.tryOnTint ?? '#C44569',
                }
              : null,
        },
      })),
    }));

    return ok({
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
      videos: sanitized,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
