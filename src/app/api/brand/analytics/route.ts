import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    const { brandId } = await requireBrand();

    const counts = await prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { brandId },
      _count: { _all: true },
    });

    const totals = {
      impressions: 0,
      views: 0,
      tagClicks: 0,
      ctaClicks: 0,
    };
    for (const c of counts) {
      if (c.type === 'IMPRESSION') totals.impressions = c._count._all;
      if (c.type === 'VIEW') totals.views = c._count._all;
      if (c.type === 'TAG_CLICK') totals.tagClicks = c._count._all;
      if (c.type === 'CTA_CLICK') totals.ctaClicks = c._count._all;
    }

    // Top videos by VIEW count.
    const topVideosRaw = await prisma.analyticsEvent.groupBy({
      by: ['videoId'],
      where: { brandId, videoId: { not: null }, type: 'VIEW' },
      _count: { _all: true },
      orderBy: { _count: { videoId: 'desc' } },
      take: 5,
    });

    // Batch the per-row video and CTA-click lookups so this stays at 2 queries
    // total instead of 2N. Earlier version did findUnique + count inside a
    // Promise.all map, which is the textbook N+1.
    const videoIds = topVideosRaw.map((r) => r.videoId!).filter(Boolean);
    const [videosById, ctaCountsByVideo] =
      videoIds.length === 0
        ? [new Map<string, { title: string }>(), new Map<string, number>()]
        : await Promise.all([
            prisma.video
              .findMany({
                where: { id: { in: videoIds } },
                select: { id: true, title: true },
              })
              .then(
                (rows) => new Map(rows.map((v) => [v.id, { title: v.title }]))
              ),
            prisma.analyticsEvent
              .groupBy({
                by: ['videoId'],
                where: { brandId, videoId: { in: videoIds }, type: 'CTA_CLICK' },
                _count: { _all: true },
              })
              .then((rows) => new Map(rows.map((r) => [r.videoId!, r._count._all]))),
          ]);

    const topVideos = topVideosRaw.map((row) => {
      const id = row.videoId!;
      const views = row._count._all;
      const ctaClicks = ctaCountsByVideo.get(id) ?? 0;
      return {
        videoId: id,
        title: videosById.get(id)?.title ?? 'Deleted video',
        views,
        ctaClicks,
        ctr: views > 0 ? +(ctaClicks / views).toFixed(4) : 0,
      };
    });

    // Top products by CTA_CLICK count, with the same N+1 fix.
    const topProductsRaw = await prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { brandId, productId: { not: null }, type: 'CTA_CLICK' },
      _count: { _all: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    });

    const productIds = topProductsRaw.map((r) => r.productId!).filter(Boolean);
    const [productsById, tagCountsByProduct] =
      productIds.length === 0
        ? [new Map<string, { name: string }>(), new Map<string, number>()]
        : await Promise.all([
            prisma.product
              .findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true },
              })
              .then(
                (rows) => new Map(rows.map((p) => [p.id, { name: p.name }]))
              ),
            prisma.analyticsEvent
              .groupBy({
                by: ['productId'],
                where: { brandId, productId: { in: productIds }, type: 'TAG_CLICK' },
                _count: { _all: true },
              })
              .then((rows) => new Map(rows.map((r) => [r.productId!, r._count._all]))),
          ]);

    const topProducts = topProductsRaw.map((row) => {
      const id = row.productId!;
      const ctaClicks = row._count._all;
      const tagClicks = tagCountsByProduct.get(id) ?? 0;
      return {
        productId: id,
        name: productsById.get(id)?.name ?? 'Deleted product',
        ctaClicks,
        tagClicks,
        // Conversion from tag click to CTA click (NOT a view-based CTR).
        tagToCta: tagClicks > 0 ? +(ctaClicks / tagClicks).toFixed(4) : 0,
      };
    });

    return ok({ totals, topVideos, topProducts });
  } catch (e) {
    return fail(e);
  }
}
