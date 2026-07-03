import { CreditCard } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowAction from '@/components/RowAction';
import CopyField from '@/components/CopyField';
import { fmtMoney, fmtDate } from '@/lib/format';

export default async function GiftCardsPage() {
  const { brandId } = await pageBrandSession();
  const [cards, agg] = await Promise.all([
    prisma.giftCard.findMany({ where: { brandId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.giftCard.aggregate({
      where: { brandId, status: 'ACTIVE' },
      _sum: { balance: true, initialValue: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gift Cards & Store Credit"
        description="Issue gift cards customers redeem at checkout via the discounts API. Store credit lives on each customer's page."
        actions={
          <EntityDialog
            title="Issue gift card"
            endpoint="/api/brand/giftcards"
            triggerLabel="Issue gift card"
            fields={[
              { name: 'initialValue', label: 'Value ($)', type: 'number', required: true, step: '0.01' },
              { name: 'recipientEmail', label: 'Recipient email', type: 'text', placeholder: 'Optional' },
              { name: 'note', label: 'Note', type: 'text', placeholder: 'Happy birthday!' },
              { name: 'expiresAt', label: 'Expires', type: 'date' },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active cards" value={agg._count} />
        <Stat label="Outstanding balance" value={fmtMoney(agg._sum.balance ?? 0)} />
        <Stat label="Issued value" value={fmtMoney(agg._sum.initialValue ?? 0)} />
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No gift cards yet"
          description="Issue a card here, or programmatically via the REST API. Cards validate through POST /api/v1/discounts/validate."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <CopyField value={c.code} />
                  </td>
                  <td className="px-5 py-3.5 text-fg">
                    {fmtMoney(c.balance, c.currency)}
                    <span className="text-xs text-fg-subtle"> / {fmtMoney(c.initialValue, c.currency)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{c.recipientEmail ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{fmtDate(c.expiresAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <RowAction
                        endpoint={`/api/brand/giftcards/${c.id}`}
                        body={{ status: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }}
                        label={c.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        variant={c.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
