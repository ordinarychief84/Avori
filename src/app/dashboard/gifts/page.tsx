import { Gift } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';
import { fmtMoney } from '@/lib/format';

export default async function GiftsPage() {
  const { brandId } = await pageBrandSession();
  const [campaigns, products] = await Promise.all([
    prisma.giftCampaign.findMany({ where: { brandId }, orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const productById = new Map(products.map((p) => [p.id, p.name]));

  const giftFields: FieldSpec[] = [
    { name: 'name', label: 'Campaign name', type: 'text', required: true, placeholder: 'Free gift over $75' },
    {
      name: 'trigger',
      label: 'Trigger',
      type: 'select',
      options: [
        { value: 'CART_VALUE', label: 'Cart value threshold' },
        { value: 'PRODUCT_IN_CART', label: 'Specific product in cart' },
      ],
    },
    { name: 'thresholdAmount', label: 'Cart value threshold ($)', type: 'number', step: '0.01', hint: 'For cart-value campaigns' },
    {
      name: 'triggerProductId',
      label: 'Trigger product',
      type: 'select',
      options: [{ value: '', label: '— none —' }, ...productOptions],
      hint: 'For product-in-cart campaigns',
    },
    { name: 'giftProductIds', label: 'Gift products', type: 'multiselect', options: productOptions },
    { name: 'chooseGift', label: 'Choice', type: 'toggle', placeholder: 'Let the shopper choose their gift' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PAUSED', label: 'Paused' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Free Gifts"
        description="Gift-with-purchase campaigns triggered by cart value or specific products."
        actions={
          <EntityDialog title="New gift campaign" endpoint="/api/brand/gifts" triggerLabel="New campaign" wide fields={giftFields} />
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No gift campaigns yet"
          description="The storefront checks eligibility with POST /api/v1/gifts/eligible and shows spend-more-to-unlock progress."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Trigger</th>
                <th className="px-5 py-3">Gifts</th>
                <th className="px-5 py-3">Unlocked</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-fg">{c.name}</td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {c.trigger === 'CART_VALUE'
                      ? `Cart ≥ ${fmtMoney(c.thresholdAmount ?? 0)}`
                      : `Has ${productById.get(c.triggerProductId ?? '') ?? 'product'}`}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-fg-muted">
                    {c.giftProductIds.map((id) => productById.get(id) ?? id).join(', ') || '—'}
                    {c.chooseGift && c.giftProductIds.length > 1 && (
                      <span className="text-fg-subtle"> (shopper picks)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{c.unlockedCount}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title="Edit gift campaign"
                        endpoint={`/api/brand/gifts/${c.id}`}
                        method="PATCH"
                        triggerLabel="Edit"
                        triggerVariant="secondary"
                        triggerSize="sm"
                        triggerIcon="none"
                        wide
                        initial={{
                          name: c.name,
                          trigger: c.trigger,
                          thresholdAmount: c.thresholdAmount !== null ? Number(c.thresholdAmount) : '',
                          triggerProductId: c.triggerProductId ?? '',
                          giftProductIds: c.giftProductIds,
                          chooseGift: c.chooseGift,
                          status: c.status,
                        }}
                        fields={giftFields}
                      />
                      <RowDelete endpoint={`/api/brand/gifts/${c.id}`} confirm={`Delete ${c.name}?`} />
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
