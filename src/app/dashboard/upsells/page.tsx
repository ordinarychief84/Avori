import { TrendingUp } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';
import { fmtMoney } from '@/lib/format';

const PLACEMENTS: Record<string, string> = {
  PRODUCT_PAGE: 'Product page',
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  POST_PURCHASE: 'Post-purchase',
};

export default async function UpsellsPage() {
  const { brandId } = await pageBrandSession();
  const [offers, products] = await Promise.all([
    prisma.upsellOffer.findMany({ where: { brandId }, orderBy: { priority: 'desc' } }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const totals = offers.reduce(
    (acc, o) => ({
      impressions: acc.impressions + o.impressions,
      clicks: acc.clicks + o.clicks,
      conversions: acc.conversions + o.conversions,
      revenue: acc.revenue + Number(o.revenue),
    }),
    { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  );

  const upsellFields: FieldSpec[] = [
    { name: 'name', label: 'Offer name', type: 'text', required: true },
    {
      name: 'placement',
      label: 'Placement',
      type: 'select',
      options: Object.entries(PLACEMENTS).map(([value, label]) => ({ value, label })),
    },
    { name: 'headline', label: 'Headline', type: 'text', placeholder: 'Complete your routine' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'triggerProductIds', label: 'Show for products (empty = all)', type: 'multiselect', options: productOptions },
    { name: 'offerProductIds', label: 'Products to offer', type: 'multiselect', options: productOptions },
    { name: 'discountPct', label: 'Discount on offered products (%)', type: 'number', min: 0, max: 100 },
    { name: 'priority', label: 'Priority (higher shows first)', type: 'number' },
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
        title="Upsells & Cross-sells"
        description="Targeted offers on product pages, cart, checkout and post-purchase, with full funnel attribution."
        actions={
          <EntityDialog title="New offer" endpoint="/api/brand/upsells" triggerLabel="New offer" wide fields={upsellFields} />
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Impressions" value={totals.impressions} />
        <Stat label="Clicks" value={totals.clicks} />
        <Stat label="Conversions" value={totals.conversions} />
        <Stat label="Attributed revenue" value={fmtMoney(totals.revenue)} />
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No upsell offers yet"
          description="The storefront pulls offers from GET /api/v1/upsells and attributes conversions when orders carry upsellOfferId."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Offer</th>
                <th className="px-5 py-3">Placement</th>
                <th className="px-5 py-3">Funnel</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-fg">{o.name}</div>
                    {o.headline && <div className="text-xs text-fg-muted">{o.headline}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{PLACEMENTS[o.placement]}</td>
                  <td className="px-5 py-3.5 text-xs text-fg-muted">
                    {o.impressions} views · {o.clicks} clicks · {o.conversions} orders
                  </td>
                  <td className="px-5 py-3.5 text-fg">{fmtMoney(o.revenue)}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={o.status === 'ACTIVE' ? 'success' : 'neutral'}>{o.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title="Edit offer"
                        endpoint={`/api/brand/upsells/${o.id}`}
                        method="PATCH"
                        triggerLabel="Edit"
                        triggerVariant="secondary"
                        triggerSize="sm"
                        triggerIcon="none"
                        wide
                        initial={{
                          name: o.name,
                          placement: o.placement,
                          headline: o.headline ?? '',
                          description: o.description ?? '',
                          triggerProductIds: o.triggerProductIds,
                          offerProductIds: o.offerProductIds,
                          discountPct: o.discountPct ?? '',
                          priority: o.priority,
                          status: o.status,
                        }}
                        fields={upsellFields}
                      />
                      <RowDelete endpoint={`/api/brand/upsells/${o.id}`} confirm={`Delete ${o.name}?`} />
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
