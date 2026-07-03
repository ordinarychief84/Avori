import Link from 'next/link';
import { Palette } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiEnabled } from '@/lib/ai';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import { fmtDateTime } from '@/lib/format';

export default async function ShadePage() {
  const { brandId } = await pageBrandSession();
  const [profiles, matchableProducts, totalProfiles] = await Promise.all([
    prisma.shadeProfile.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { customer: { select: { email: true } } },
    }),
    prisma.product.count({
      where: { brandId, OR: [{ shadeTones: { isEmpty: false } }, { undertones: { isEmpty: false } }] },
    }),
    prisma.shadeProfile.count({ where: { brandId } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shade Studio"
        description="AI analyzes a customer photo — skin tone, undertone, lip tone, hair and eye color — and recommends matching products."
      />

      {!aiEnabled() && (
        <Card className="border-warning/40 bg-warning/5">
          <CardBody className="text-sm text-fg-muted">
            <span className="font-medium text-fg">AI is not configured.</span> Add{' '}
            <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to <code className="font-mono text-xs">.env</code>{' '}
            to enable shade analysis. The endpoint (<code className="font-mono text-xs">POST /api/v1/shade/analyze</code>)
            returns a clear error until then.
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Analyses run" value={totalProfiles} />
        <Stat
          label="Shade-matched products"
          value={matchableProducts}
          sub="Products with tones set in their edit form"
        />
        <Stat label="Vertical" value="Beauty-first" sub="Extensible to fashion, hair and more" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-fg-muted">
          <p>
            1 — Tag products with the skin tones and undertones they suit (edit any product and set{' '}
            <span className="text-fg">Shade tones</span> / <span className="text-fg">Undertones</span>).
          </p>
          <p>
            2 — Your storefront sends a customer photo to{' '}
            <code className="font-mono text-xs">POST /api/v1/shade/analyze</code> with an API key.
          </p>
          <p>
            3 — Claude vision returns the color profile; Avori matches it against your catalog and stores the
            profile on the customer record for future personalization. Pair with{' '}
            <Link href="/dashboard/products" className="text-accent hover:underline">
              AI try-on
            </Link>{' '}
            for a full virtual beauty counter.
          </p>
        </CardBody>
      </Card>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No shade analyses yet"
          description="Analyses appear here as customers use the shade finder on your storefront."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Skin tone</th>
                <th className="px-5 py-3">Undertone</th>
                <th className="px-5 py-3">Season</th>
                <th className="px-5 py-3">Matches</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 text-fg">{p.customer?.email ?? p.email ?? 'Anonymous'}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone="accent">{p.skinTone ?? '—'}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{p.undertone ?? '—'}</td>
                  <td className="px-5 py-3.5 text-fg-muted">{p.season ?? '—'}</td>
                  <td className="px-5 py-3.5 text-fg-muted">{p.recommendedProductIds.length}</td>
                  <td className="px-5 py-3.5 text-xs text-fg-muted">{fmtDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
