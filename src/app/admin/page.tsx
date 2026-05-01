import { Building2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import ToggleDisabled from '@/components/ToggleDisabled';

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { videos: true, products: true, users: true } } },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Brands" description={`${brands.length} brand${brands.length === 1 ? '' : 's'} on Avori.`} />

      {brands.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No brands yet"
          description="Brands will appear here as they sign up."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-wide text-fg-subtle">
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3 text-right">Users</th>
                <th className="px-5 py-3 text-right">Videos</th>
                <th className="px-5 py-3 text-right">Products</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-medium text-fg">{b.name}</div>
                    <div className="font-mono text-2xs text-fg-subtle">{b.slug}</div>
                  </td>
                  <td className="px-5 py-4 text-fg-muted">{b.domain ?? '—'}</td>
                  <td className="px-5 py-4 text-right text-fg-muted">{b._count.users}</td>
                  <td className="px-5 py-4 text-right text-fg-muted">{b._count.videos}</td>
                  <td className="px-5 py-4 text-right text-fg-muted">{b._count.products}</td>
                  <td className="px-5 py-4">
                    <Badge tone={b.disabled ? 'danger' : 'success'}>
                      {b.disabled ? 'disabled' : 'active'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ToggleDisabled
                      endpoint={`/api/admin/brands/${b.id}`}
                      disabled={b.disabled}
                      label={b.disabled ? 'Enable' : 'Disable'}
                    />
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
