import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardOverview() {
  const session = await auth();
  const brandId = session!.user.brandId!;

  const [productCount, videoCount, activeVideoCount, brand] = await Promise.all([
    prisma.product.count({ where: { brandId } }),
    prisma.video.count({ where: { brandId } }),
    prisma.video.count({ where: { brandId, status: 'ACTIVE', disabled: false } }),
    prisma.brand.findUnique({ where: { id: brandId } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{brand?.name}</h1>
        <p className="text-sm text-zinc-600">
          Brand ID <code className="rounded bg-zinc-100 px-1.5 py-0.5">{brandId}</code>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Products" value={productCount} href="/dashboard/products" />
        <Stat label="Videos" value={videoCount} href="/dashboard/videos" />
        <Stat label="Live videos" value={activeVideoCount} href="/dashboard/videos" />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">Get started</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
          <li>
            <Link className="text-brand-600 hover:underline" href="/dashboard/products">
              Add products
            </Link>{' '}
            you want to feature.
          </li>
          <li>
            <Link className="text-brand-600 hover:underline" href="/dashboard/videos/upload">
              Upload a vertical video
            </Link>{' '}
            and set it active.
          </li>
          <li>Open the video and tag products by clicking on the player.</li>
          <li>
            Copy the embed snippet from{' '}
            <Link className="text-brand-600 hover:underline" href="/dashboard/embed">
              Embed
            </Link>{' '}
            and paste it on your site.
          </li>
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card block p-5 transition hover:border-zinc-300">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </Link>
  );
}
