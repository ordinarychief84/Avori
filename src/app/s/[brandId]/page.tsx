import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { aiEnabled } from '@/lib/ai';
import { Logo } from '@/components/Logo';
import ShadeAnalyzer from '@/components/ShadeAnalyzer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { brandId: string };
}): Promise<Metadata> {
  const brand = await prisma.brand.findUnique({
    where: { id: params.brandId },
    select: { name: true },
  });
  return {
    title: brand ? `Find your shade | ${brand.name}` : 'Find your shade | Avori',
    robots: { index: false },
  };
}

// Hosted shade analyzer: the shareable "find your shade" experience.
export default async function HostedShadePage({ params }: { params: { brandId: string } }) {
  const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
  if (!brand || brand.disabled) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-surface/70">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-center px-6">
          <span className="text-sm font-bold tracking-[0.14em] text-fg">
            {brand.name.toUpperCase()}
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Find your <span className="text-gradient-brand">perfect shade</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-fg-muted">
            One selfie. AI reads your skin tone, undertone and coloring, then matches products
            made for you.
          </p>
        </div>
        <ShadeAnalyzer
          aiEnabled={aiEnabled()}
          brandId={brand.id}
          analyzeEndpoint={`/api/public/brand/${brand.id}/shade/analyze`}
          claimEndpoint={`/api/public/brand/${brand.id}/shade/claim`}
        />
      </main>
      <footer className="border-t border-border py-4">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-1.5 text-2xs text-fg-subtle transition-colors hover:text-fg"
        >
          Powered by <Logo size="sm" />
        </Link>
      </footer>
    </div>
  );
}
