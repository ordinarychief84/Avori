import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DeleteButton from '@/components/DeleteButton';

export default async function ProductsPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const products = await prisma.product.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link href="/dashboard/products/new" className="btn-primary">
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-zinc-600">
          No products yet. <Link className="text-brand-600 hover:underline" href="/dashboard/products/new">Add your first.</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-500 hover:underline"
                        >
                          {p.productUrl}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === 'ACTIVE'
                          ? 'badge bg-green-100 text-green-700'
                          : 'badge bg-zinc-100 text-zinc-600'
                      }
                    >
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/products/${p.id}`} className="btn-secondary">
                        Edit
                      </Link>
                      <DeleteButton endpoint={`/api/brand/products/${p.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
