import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/AppShell';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { brand: { select: { id: true, name: true } } },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Products" description={`Latest ${products.length} across all brands.`} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-wide text-fg-subtle">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    />
                    <span className="text-fg">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-fg-muted">{p.brand.name}</td>
                <td className="px-5 py-3 text-right text-fg">${Number(p.price).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <Badge tone={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {p.status.toLowerCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
