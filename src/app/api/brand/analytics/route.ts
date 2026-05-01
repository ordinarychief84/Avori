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

    const topVideosRaw = await prisma.analyticsEvent.groupBy({
      by: ['videoId'],
      where: { brandId, videoId: { not: null }, type: 'VIEW' },
      _count: { _all: true },
      orderBy: { _count: { videoId: 'desc' } },
      take: 5,
    });

    const topVideos = await Promise.all(
      topVideosRaw.map(async (row) => {
        const video = await prisma.video.findUnique({ where: { id: row.videoId! } });
        const ctaClicks = await prisma.analyticsEvent.count({
          where: { brandId, videoId: row.videoId!, type: 'CTA_CLICK' },
        });
        const views = row._count._all;
        return {
          videoId: row.videoId!,
          title: video?.title ?? 'Deleted video',
          views,
          ctaClicks,
          ctr: views > 0 ? +(ctaClicks / views).toFixed(4) : 0,
        };
      })
    );

    const topProductsRaw = await prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { brandId, productId: { not: null }, type: 'CTA_CLICK' },
      _count: { _all: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topProductsRaw.map(async (row) => {
        const product = await prisma.product.findUnique({ where: { id: row.productId! } });
        const tagClicks = await prisma.analyticsEvent.count({
          where: { brandId, productId: row.productId!, type: 'TAG_CLICK' },
        });
        return {
          productId: row.productId!,
          name: product?.name ?? 'Deleted product',
          ctaClicks: row._count._all,
          tagClicks,
          // Conversion from tag click to CTA click (NOT a view-based CTR).
          tagToCta: tagClicks > 0 ? +(row._count._all / tagClicks).toFixed(4) : 0,
        };
      })
    );

    return ok({ totals, topVideos, topProducts });
  } catch (e) {
    return fail(e);
  }
}
