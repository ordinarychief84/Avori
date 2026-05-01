import Link from 'next/link';
import { Plus, Package, ExternalLink } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import RowDelete from '@/components/RowDelete';

export default async function ProductsPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const products = await prisma.product.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products"
        description="The catalog you can tag inside videos."
        actions={
          <Link href="/dashboard/products/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add product</Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add the products you want to feature inside your videos."
          action={
            <Link href="/dashboard/products/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add your first product</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-md object-cover ring-1 ring-border"
                      />
                      <div>
                        <div className="font-medium text-fg">{p.name}</div>
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
                        >
                          {new URL(p.productUrl).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-2xs text-fg-muted">{p.sku ?? '—'}</td>
                  <td className="px-5 py-4 text-fg">${Number(p.price).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/products/${p.id}`}>
                        <Button size="sm" variant="secondary">
                          Edit
                        </Button>
                      </Link>
                      <RowDelete
                        endpoint={`/api/brand/products/${p.id}`}
                        confirm={`Delete ${p.name}?`}
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
