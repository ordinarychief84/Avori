import Link from 'next/link';
import { Users } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import { Input } from '@/components/ui/Input';
import { fmtMoney, fmtDate, customerName } from '@/lib/format';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { brandId } = await pageBrandSession();
  const q = searchParams.q?.trim();

  const [customers, total, withOrders, marketing] = await Promise.all([
    prisma.customer.findMany({
      where: {
        brandId,
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { loyaltyMember: { select: { points: true } } },
    }),
    prisma.customer.count({ where: { brandId } }),
    prisma.customer.count({ where: { brandId, ordersCount: { gte: 1 } } }),
    prisma.customer.count({ where: { brandId, acceptsMarketing: true } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers"
        description="The unified customer database every module shares."
        actions={
          <EntityDialog
            title="Add customer"
            endpoint="/api/brand/customers"
            triggerLabel="Add customer"
            fields={[
              { name: 'email', label: 'Email', type: 'text', required: true, placeholder: 'jane@example.com' },
              { name: 'firstName', label: 'First name', type: 'text' },
              { name: 'lastName', label: 'Last name', type: 'text' },
              { name: 'phone', label: 'Phone', type: 'text' },
              { name: 'birthday', label: 'Birthday', type: 'date', hint: 'Powers birthday loyalty rewards' },
              { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'vip, wholesale' },
              { name: 'acceptsMarketing', label: 'Marketing', type: 'toggle', placeholder: 'Accepts marketing emails' },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Customers" value={total} />
        <Stat label="With orders" value={withOrders} sub={total ? `${Math.round((withOrders / total) * 100)}% of customers` : undefined} />
        <Stat label="Marketing opt-in" value={marketing} />
      </div>

      <form className="max-w-sm">
        <Input name="q" defaultValue={q ?? ''} placeholder="Search by name or email…" />
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? 'No customers match' : 'No customers yet'}
          description={
            q
              ? 'Try a different search.'
              : 'Customers appear automatically from orders, reviews, quizzes and referrals — or add one manually.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total spent</th>
                <th className="px-5 py-3">Points</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Since</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/customers/${c.id}`} className="group">
                      <div className="font-medium text-fg group-hover:text-accent">
                        {customerName(c)}
                      </div>
                      <div className="text-xs text-fg-muted">{c.email}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-fg">{c.ordersCount}</td>
                  <td className="px-5 py-3.5 text-fg">{fmtMoney(c.totalSpent)}</td>
                  <td className="px-5 py-3.5 text-fg-muted">{c.loyaltyMember?.points ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone="neutral">{c.source}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
