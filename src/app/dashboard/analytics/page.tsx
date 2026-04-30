import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AnalyticsPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;

  const counts = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: { brandId },
    _count: { _all: true },
  });
  const totals = { impressions: 0, views: 0, tagClicks: 0, ctaClicks: 0 };
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
        title: video?.title ?? 'Deleted video',
        views,
        ctaClicks,
        ctr: views > 0 ? ((ctaClicks / views) * 100).toFixed(1) : '0.0',
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
        name: product?.name ?? 'Deleted product',
        ctaClicks: row._count._all,
        tagClicks,
      };
    })
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Impressions" value={totals.impressions} />
        <Stat label="Video views" value={totals.views} />
        <Stat label="Tag clicks" value={totals.tagClicks} />
        <Stat label="CTA clicks" value={totals.ctaClicks} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Top videos</h2>
          {topVideos.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No data yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th>Title</th>
                  <th>Views</th>
                  <th>CTA</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.map((v, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="py-2">{v.title}</td>
                    <td>{v.views}</td>
                    <td>{v.ctaClicks}</td>
                    <td>{v.ctr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Top products</h2>
          {topProducts.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No data yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th>Product</th>
                  <th>Tag clicks</th>
                  <th>CTA clicks</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="py-2">{p.name}</td>
                    <td>{p.tagClicks}</td>
                    <td>{p.ctaClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
