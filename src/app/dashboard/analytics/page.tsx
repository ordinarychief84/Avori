import { Sparkles } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiEnabled } from '@/lib/ai';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import RowAction from '@/components/RowAction';
import { fmtMoney, fmtDate } from '@/lib/format';

export default async function AnalyticsPage() {
  const { brandId } = await pageBrandSession();
  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [
    orders30,
    ordersAll,
    customerCount,
    repeatCustomers,
    avgLifetime,
    reviewAgg,
    loyaltyIssued,
    loyaltyRedeemed,
    referralTotals,
    quizzes,
    upsells,
    videoEvents,
    topItems,
    insights,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { brandId, placedAt: { gte: since30 }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.order.aggregate({
      where: { brandId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.customer.count({ where: { brandId } }),
    prisma.customer.count({ where: { brandId, ordersCount: { gte: 2 } } }),
    prisma.customer.aggregate({ where: { brandId, ordersCount: { gte: 1 } }, _avg: { totalSpent: true } }),
    prisma.review.aggregate({ where: { brandId, status: 'APPROVED' }, _count: true, _avg: { rating: true } }),
    prisma.pointsTransaction.aggregate({ where: { brandId, points: { gt: 0 } }, _sum: { points: true } }),
    prisma.pointsTransaction.aggregate({ where: { brandId, points: { lt: 0 } }, _sum: { points: true } }),
    prisma.referral.aggregate({ where: { brandId }, _sum: { clicks: true, conversions: true, revenue: true } }),
    prisma.quiz.aggregate({ where: { brandId }, _sum: { views: true, completions: true } }),
    prisma.upsellOffer.aggregate({
      where: { brandId },
      _sum: { impressions: true, clicks: true, conversions: true, revenue: true },
    }),
    prisma.analyticsEvent.groupBy({ by: ['type'], where: { brandId }, _count: { _all: true } }),
    prisma.orderItem.groupBy({
      by: ['name'],
      where: { order: { brandId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    }),
    prisma.aiInsight.findMany({ where: { brandId }, orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({
      where: { brandId, placedAt: { gte: since30 }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      select: { total: true, placedAt: true },
    }),
  ]);

  // Daily revenue bars, last 30 days.
  const days: { label: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    days.push({ label: d.toISOString().slice(0, 10), total: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.label, i]));
  for (const o of recentOrders) {
    const key = o.placedAt.toISOString().slice(0, 10);
    const idx = dayIndex.get(key);
    if (idx !== undefined) days[idx].total += Number(o.total);
  }
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  const events = Object.fromEntries(videoEvents.map((e) => [e.type, e._count._all])) as Record<string, number>;
  const videoViews = events.VIEW ?? 0;
  const videoCta = events.CTA_CLICK ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="One analytics engine across revenue, retention, and every module."
        actions={
          aiEnabled() ? (
            <RowAction
              endpoint="/api/brand/insights"
              method="POST"
              label="Generate AI insights"
              variant="primary"
              size="md"
              successMessage="Insights refreshed"
            />
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (30d)" value={fmtMoney(orders30._sum.total ?? 0)} sub={`${fmtMoney(ordersAll._sum.total ?? 0)} all time`} />
        <Stat label="Orders (30d)" value={orders30._count} sub={`${ordersAll._count} all time`} />
        <Stat label="Avg order value" value={fmtMoney(orders30._avg.total ?? 0)} />
        <Stat
          label="Repeat purchase rate"
          value={customerCount > 0 ? `${Math.round((repeatCustomers / customerCount) * 100)}%` : '—'}
          sub={`CLV ${fmtMoney(avgLifetime._avg.totalSpent ?? 0)} avg`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily revenue, last 30 days</CardTitle>
        </CardHeader>
        <CardBody>
          {orders30._count === 0 ? (
            <p className="text-sm text-fg-muted">No orders in the last 30 days.</p>
          ) : (
            <div className="flex h-40 items-end gap-[3px]">
              {days.map((d) => (
                <div key={d.label} className="group relative flex-1">
                  <div
                    className="w-full rounded-sm bg-accent/70 transition-colors group-hover:bg-accent"
                    style={{ height: `${Math.max((d.total / maxDay) * 152, d.total > 0 ? 6 : 2)}px` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-fg px-2 py-1 text-2xs text-bg group-hover:block">
                    {fmtDate(d.label)} · {fmtMoney(d.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {insights.length > 0 && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> AI insights
            </CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-2">
            {insights.map((i) => (
              <div key={i.id} className="rounded-md border border-border bg-surface-2/40 p-4">
                <div className="text-2xs uppercase tracking-[0.15em] text-accent">{i.kind}</div>
                <div className="mt-1 text-sm font-medium text-fg">{i.title}</div>
                <p className="mt-1 text-sm text-fg-muted">{i.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Reviews"
          value={reviewAgg._count}
          sub={reviewAgg._avg.rating !== null ? `${reviewAgg._avg.rating.toFixed(2)} avg rating` : undefined}
        />
        <Stat
          label="Loyalty points"
          value={loyaltyIssued._sum.points ?? 0}
          sub={`${Math.abs(loyaltyRedeemed._sum.points ?? 0)} redeemed`}
        />
        <Stat
          label="Referral revenue"
          value={fmtMoney(referralTotals._sum.revenue ?? 0)}
          sub={`${referralTotals._sum.conversions ?? 0} conversions from ${referralTotals._sum.clicks ?? 0} clicks`}
        />
        <Stat
          label="Quiz completions"
          value={quizzes._sum.completions ?? 0}
          sub={`${quizzes._sum.views ?? 0} views`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Video views"
          value={videoViews}
          sub={videoViews > 0 ? `${((videoCta / videoViews) * 100).toFixed(1)}% CTA rate` : undefined}
        />
        <Stat label="Video CTA clicks" value={videoCta} />
        <Stat
          label="Upsell revenue"
          value={fmtMoney(upsells._sum.revenue ?? 0)}
          sub={`${upsells._sum.conversions ?? 0} conversions`}
        />
        <Stat
          label="Upsell funnel"
          value={`${upsells._sum.impressions ?? 0} → ${upsells._sum.clicks ?? 0}`}
          sub="impressions → clicks"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top-selling products</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {topItems.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">No sales yet.</p>
          ) : (
            <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <tbody>
                {topItems.map((t, i) => (
                  <tr key={t.name} className="border-t border-border/60">
                    <td className="w-10 px-5 py-3 text-fg-subtle">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-fg">{t.name}</td>
                    <td className="px-5 py-3 text-right text-fg-muted">{t._sum.quantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
