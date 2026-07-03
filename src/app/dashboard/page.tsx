import Link from 'next/link';
import {
  ArrowUpRight,
  Star,
  ShoppingCart,
  Users,
  Crown,
  ListChecks,
  Film,
  Share2,
  Sparkles,
} from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import { fmtMoney, fmtDate, customerName } from '@/lib/format';

export default async function DashboardOverview() {
  const { brandId } = await pageBrandSession();
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [
    brand,
    orderAgg,
    customerCount,
    repeatCustomers,
    pendingReviews,
    approvedReviews,
    loyaltyMembers,
    activeQuizzes,
    activeVideos,
    referralConversions,
    recentOrders,
    recentReviews,
    hasApiKey,
    integration,
  ] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.order.aggregate({
      where: { brandId, placedAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.customer.count({ where: { brandId } }),
    prisma.customer.count({ where: { brandId, ordersCount: { gte: 2 } } }),
    prisma.review.count({ where: { brandId, status: 'PENDING' } }),
    prisma.review.count({ where: { brandId, status: 'APPROVED' } }),
    prisma.loyaltyMember.count({ where: { brandId } }),
    prisma.quiz.count({ where: { brandId, status: 'ACTIVE' } }),
    prisma.video.count({ where: { brandId, status: 'ACTIVE', disabled: false } }),
    prisma.referral.aggregate({ where: { brandId }, _sum: { conversions: true } }),
    prisma.order.findMany({
      where: { brandId },
      orderBy: { placedAt: 'desc' },
      take: 6,
      include: { customer: true },
    }),
    prisma.review.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { product: { select: { name: true } } },
    }),
    prisma.apiKey.count({ where: { brandId, revokedAt: null } }),
    prisma.integration.findFirst({ where: { brandId, provider: 'SHOPIFY' } }),
  ]);

  const needsSetup = orderAgg._count === 0 && hasApiKey === 0 && integration?.status !== 'CONNECTED';

  const modules = [
    { href: '/dashboard/reviews', icon: Star, label: 'Reviews', value: `${approvedReviews} live`, alert: pendingReviews > 0 ? `${pendingReviews} pending` : null },
    { href: '/dashboard/loyalty', icon: Crown, label: 'Loyalty', value: `${loyaltyMembers} members`, alert: null },
    { href: '/dashboard/referrals', icon: Share2, label: 'Referrals', value: `${referralConversions._sum.conversions ?? 0} conversions`, alert: null },
    { href: '/dashboard/quizzes', icon: ListChecks, label: 'Quizzes', value: `${activeQuizzes} live`, alert: null },
    { href: '/dashboard/videos', icon: Film, label: 'Videos', value: `${activeVideos} live`, alert: null },
    { href: '/dashboard/assistant', icon: Sparkles, label: 'AI Assistant', value: 'Ask anything', alert: null },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={brand?.name ?? 'Your store'}
        description="Your commerce experience, unified — every module below shares one customer database."
      />

      {needsSetup && (
        <Card className="border-accent/30 bg-accent-subtle/40">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="font-medium text-fg">Connect your store to go live.</span>{' '}
              <span className="text-fg-muted">
                Link Shopify or create an API key so orders start flowing into Avori.
              </span>
            </div>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              Open settings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (30d)" value={fmtMoney(orderAgg._sum.total ?? 0)} />
        <Stat label="Orders (30d)" value={orderAgg._count} sub={`${fmtMoney(orderAgg._avg.total ?? 0)} avg order`} />
        <Stat
          label="Customers"
          value={customerCount}
          sub={customerCount > 0 ? `${Math.round((repeatCustomers / customerCount) * 100)}% repeat buyers` : undefined}
        />
        <Stat label="Reviews to moderate" value={pendingReviews} sub={`${approvedReviews} published`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link key={m.href} href={m.href}>
            <Card className="transition-colors hover:border-accent/40">
              <CardBody className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-subtle">
                  <m.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg">{m.label}</div>
                  <div className="text-xs text-fg-muted">{m.value}</div>
                </div>
                {m.alert && <Badge tone="warning">{m.alert}</Badge>}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/dashboard/orders" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentOrders.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">
                No orders yet — they arrive from Shopify or POST /api/v1/orders.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border/60">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-fg hover:text-accent">
                          {o.orderNumber}
                        </Link>
                        <div className="text-xs text-fg-muted">
                          {o.customer ? customerName(o.customer) : '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-fg">{fmtMoney(o.total, o.currency)}</td>
                      <td className="px-5 py-3 text-right text-xs text-fg-muted">{fmtDate(o.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Latest reviews</CardTitle>
            <Link href="/dashboard/reviews" className="text-sm text-accent hover:underline">
              Moderate
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentReviews.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">No reviews yet.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentReviews.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-warning">{'★'.repeat(r.rating)}</span>
                      <Badge tone={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
                        {r.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-fg">{r.title || r.body}</p>
                    <div className="mt-0.5 text-xs text-fg-muted">
                      {r.authorName} · {r.product.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
