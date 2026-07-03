import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import { fmtMoney, fmtDate, customerName } from '@/lib/format';

const statusTone = (s: string) =>
  s === 'PAID' || s === 'FULFILLED' ? 'success' : s === 'CANCELLED' || s === 'REFUNDED' ? 'danger' : 'neutral';

export default async function OrdersPage() {
  const { brandId } = await pageBrandSession();
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [orders, agg30] = await Promise.all([
    prisma.order.findMany({
      where: { brandId },
      orderBy: { placedAt: 'desc' },
      take: 100,
      include: { customer: true, items: { select: { quantity: true } } },
    }),
    prisma.order.aggregate({
      where: { brandId, placedAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders"
        description="Orders flow in from Shopify, the REST API, or manual entry, and power loyalty, referrals and review requests."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue (30d)" value={fmtMoney(agg30._sum.total ?? 0)} />
        <Stat label="Orders (30d)" value={agg30._count} />
        <Stat label="Avg order value" value={fmtMoney(agg30._avg.total ?? 0)} />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Connect Shopify in Settings → Integrations, or send orders to POST /api/v1/orders with an API key."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-fg hover:text-accent">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {o.customer ? customerName(o.customer) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {o.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="px-5 py-3.5 text-fg">{fmtMoney(o.total, o.currency)}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={statusTone(o.status)}>{o.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone="neutral">{o.source}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{fmtDate(o.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
