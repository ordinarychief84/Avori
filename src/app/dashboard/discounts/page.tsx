import { Percent } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';
import CopyField from '@/components/CopyField';
import { fmtMoney, fmtDate } from '@/lib/format';

const discountFields: FieldSpec[] = [
  { name: 'name', label: 'Campaign name', type: 'text', required: true, placeholder: 'Summer sale' },
  { name: 'code', label: 'Code', type: 'text', placeholder: 'SUMMER20 — leave empty for automatic discounts', hint: 'Automatic discounts apply by cart rules instead of a code' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'PERCENT', label: 'Percentage off' },
      { value: 'FIXED', label: 'Fixed amount off' },
    ],
  },
  { name: 'value', label: 'Value', type: 'number', required: true, step: '0.01' },
  { name: 'minSubtotal', label: 'Minimum subtotal ($)', type: 'number', step: '0.01' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PAUSED', label: 'Paused' },
      { value: 'ENDED', label: 'Ended' },
    ],
  },
  { name: 'startsAt', label: 'Starts', type: 'date' },
  { name: 'endsAt', label: 'Ends', type: 'date', hint: 'Set both dates for scheduled promotions and flash sales' },
  { name: 'usageLimit', label: 'Total usage limit', type: 'number' },
];

export default async function DiscountsPage() {
  const { brandId } = await pageBrandSession();
  const discounts = await prisma.discountCampaign.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discount Campaigns"
        description="Coupon codes, automatic discounts, scheduled promotions and flash sales — validated by the storefront through one API."
        actions={
          <EntityDialog
            title="New discount"
            endpoint="/api/brand/discounts"
            triggerLabel="New discount"
            fields={discountFields}
          />
        }
      />

      {discounts.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No discount campaigns yet"
          description="Create codes here, then validate them at checkout with POST /api/v1/discounts/validate."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Window</th>
                <th className="px-5 py-3">Used</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-fg">{d.name}</td>
                  <td className="px-5 py-3.5">
                    {d.code ? <CopyField value={d.code} /> : <Badge tone="accent">automatic</Badge>}
                  </td>
                  <td className="px-5 py-3.5 text-fg">
                    {d.type === 'PERCENT' ? `${Number(d.value)}%` : fmtMoney(d.value)}
                    {d.minSubtotal !== null && (
                      <span className="text-xs text-fg-subtle"> · min {fmtMoney(d.minSubtotal)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-fg-muted">
                    {d.startsAt || d.endsAt ? `${fmtDate(d.startsAt)} → ${fmtDate(d.endsAt)}` : 'Always'}
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {d.usageCount}
                    {d.usageLimit !== null && ` / ${d.usageLimit}`}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={d.status === 'ACTIVE' ? 'success' : d.status === 'DRAFT' ? 'neutral' : 'warning'}>
                      {d.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title="Edit discount"
                        endpoint={`/api/brand/discounts/${d.id}`}
                        method="PATCH"
                        triggerLabel="Edit"
                        triggerVariant="secondary"
                        triggerSize="sm"
                        triggerIcon="none"
                        initial={{
                          name: d.name,
                          code: d.code ?? '',
                          type: d.type,
                          value: Number(d.value),
                          minSubtotal: d.minSubtotal !== null ? Number(d.minSubtotal) : '',
                          status: d.status,
                          startsAt: d.startsAt?.toISOString() ?? '',
                          endsAt: d.endsAt?.toISOString() ?? '',
                          usageLimit: d.usageLimit ?? '',
                        }}
                        fields={discountFields}
                      />
                      <RowDelete endpoint={`/api/brand/discounts/${d.id}`} confirm={`Delete ${d.name}?`} />
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
