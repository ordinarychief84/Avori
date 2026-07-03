import { Boxes } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';

const TYPE_LABELS: Record<string, string> = {
  FBT: 'Frequently bought together',
  BXGY: 'Buy X get Y',
  MIX_MATCH: 'Mix & match',
  VOLUME: 'Quantity discount',
};

export default async function BundlesPage() {
  const { brandId } = await pageBrandSession();
  const [bundles, products] = await Promise.all([
    prisma.bundle.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  const bundleFields: FieldSpec[] = [
    { name: 'name', label: 'Bundle name', type: 'text', required: true, placeholder: 'Skincare starter set' },
    {
      name: 'type',
      label: 'Bundle type',
      type: 'select',
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'discountType',
      label: 'Discount type',
      type: 'select',
      options: [
        { value: 'PERCENT', label: 'Percentage off' },
        { value: 'FIXED', label: 'Fixed amount off' },
      ],
    },
    { name: 'discountValue', label: 'Discount value', type: 'number', step: '0.01' },
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
        title="Bundles"
        description="Frequently-bought-together, BXGY, mix & match, and volume discounts served to the storefront."
        actions={
          <EntityDialog
            title="New bundle"
            description="Pick the products after creating — or include them right away."
            endpoint="/api/brand/bundles"
            triggerLabel="New bundle"
            wide
            fields={[
              ...bundleFields,
              { name: 'items', label: 'Products in bundle', type: 'multiselect', options: productOptions, hint: 'Selected products make up the bundle' },
            ]}
          />
        }
      />

      {bundles.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No bundles yet"
          description="Bundles increase average order value. The storefront fetches them from GET /api/v1/bundles."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Bundle</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Products</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Impressions</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-fg">{b.name}</td>
                  <td className="px-5 py-3.5 text-fg-muted">{TYPE_LABELS[b.type]}</td>
                  <td className="px-5 py-3.5 text-xs text-fg-muted">
                    {b.items.map((i) => i.product.name).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-fg">
                    {b.discountType === 'PERCENT' ? `${Number(b.discountValue)}%` : `$${Number(b.discountValue)}`}
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{b.impressions}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={b.status === 'ACTIVE' ? 'success' : 'neutral'}>{b.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title="Edit bundle"
                        endpoint={`/api/brand/bundles/${b.id}`}
                        method="PATCH"
                        triggerLabel="Edit"
                        triggerVariant="secondary"
                        triggerSize="sm"
                        triggerIcon="none"
                        wide
                        initial={{
                          name: b.name,
                          type: b.type,
                          discountType: b.discountType,
                          discountValue: Number(b.discountValue),
                          status: b.status,
                          items: b.items.map((i) => i.productId),
                        }}
                        fields={[
                          ...bundleFields,
                          { name: 'items', label: 'Products in bundle', type: 'multiselect', options: productOptions },
                        ]}
                      />
                      <RowDelete endpoint={`/api/brand/bundles/${b.id}`} confirm={`Delete ${b.name}?`} />
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
