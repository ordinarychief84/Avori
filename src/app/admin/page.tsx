import { prisma } from '@/lib/prisma';
import ToggleDisabled from '@/components/ToggleDisabled';

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { videos: true, products: true, users: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Videos</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-zinc-500">{b.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{b.domain ?? '—'}</td>
                <td className="px-4 py-3">{b._count.users}</td>
                <td className="px-4 py-3">{b._count.videos}</td>
                <td className="px-4 py-3">{b._count.products}</td>
                <td className="px-4 py-3">
                  {b.disabled ? (
                    <span className="badge bg-red-100 text-red-700">disabled</span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
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
      </div>
    </div>
  );
}
