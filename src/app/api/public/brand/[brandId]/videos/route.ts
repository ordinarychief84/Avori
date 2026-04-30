import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

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
              select: { id: true, name: true, price: true, imageUrl: true, productUrl: true },
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
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl,
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
          imageUrl: t.product.imageUrl,
          productUrl: t.product.productUrl,
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
