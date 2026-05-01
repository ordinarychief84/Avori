import { Eye, MousePointerClick, Sparkles, BarChart3 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';

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

  const hasData = totals.impressions + totals.views + totals.tagClicks + totals.ctaClicks > 0;
  const ctr = totals.views > 0 ? (totals.ctaClicks / totals.views) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Impressions, views, and conversion across every embedded widget."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Impressions" value={totals.impressions} icon={Eye} />
        <Stat label="Video views" value={totals.views} icon={Sparkles} />
        <Stat label="Tag clicks" value={totals.tagClicks} icon={MousePointerClick} />
        <Stat
          label="CTA clicks"
          value={totals.ctaClicks}
          icon={BarChart3}
          hint={`${ctr.toFixed(1)}% CTR`}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Once your widget loads on a customer-facing page, impressions and views will start streaming in here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top videos</CardTitle>
            </CardHeader>
            <CardBody>
              {topVideos.length === 0 ? (
                <p className="text-sm text-fg-muted">No view data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-fg-subtle">
                      <th className="py-2 font-normal">Title</th>
                      <th className="py-2 font-normal text-right">Views</th>
                      <th className="py-2 font-normal text-right">CTA</th>
                      <th className="py-2 font-normal text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map((v, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 text-fg">{v.title}</td>
                        <td className="py-2.5 text-right text-fg-muted">{v.views}</td>
                        <td className="py-2.5 text-right text-fg-muted">{v.ctaClicks}</td>
                        <td className="py-2.5 text-right font-mono text-2xs text-accent">
                          {v.ctr}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top products</CardTitle>
            </CardHeader>
            <CardBody>
              {topProducts.length === 0 ? (
                <p className="text-sm text-fg-muted">No conversion data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-fg-subtle">
                      <th className="py-2 font-normal">Product</th>
                      <th className="py-2 font-normal text-right">Tag clicks</th>
                      <th className="py-2 font-normal text-right">CTA clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 text-fg">{p.name}</td>
                        <td className="py-2.5 text-right text-fg-muted">{p.tagClicks}</td>
                        <td className="py-2.5 text-right text-fg-muted">{p.ctaClicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase tracking-[0.2em] text-fg-subtle">{label}</span>
          <Icon className="h-4 w-4 text-fg-subtle" />
        </div>
        <div className="mt-3 text-3xl font-semibold tracking-tight text-fg">{value}</div>
        {hint && <div className="mt-1 text-xs text-fg-subtle">{hint}</div>}
      </CardBody>
    </Card>
  );
}
