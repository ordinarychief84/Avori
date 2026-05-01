import Link from 'next/link';
import { ArrowUpRight, Eye, MousePointerClick, Sparkles, Package, Film, BarChart3 } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/AppShell';

export default async function DashboardOverview() {
  const { brandId } = await pageBrandSession();

  const [productCount, activeProductCount, videoCount, activeVideoCount, brand, eventCounts] =
    await Promise.all([
      prisma.product.count({ where: { brandId } }),
      prisma.product.count({ where: { brandId, status: 'ACTIVE' } }),
      prisma.video.count({ where: { brandId } }),
      prisma.video.count({ where: { brandId, status: 'ACTIVE', disabled: false } }),
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { brandId },
        _count: { _all: true },
      }),
    ]);

  const totals = {
    impressions: 0,
    views: 0,
    tagClicks: 0,
    ctaClicks: 0,
  };
  for (const c of eventCounts) {
    if (c.type === 'IMPRESSION') totals.impressions = c._count._all;
    if (c.type === 'VIEW') totals.views = c._count._all;
    if (c.type === 'TAG_CLICK') totals.tagClicks = c._count._all;
    if (c.type === 'CTA_CLICK') totals.ctaClicks = c._count._all;
  }
  const ctr = totals.views > 0 ? (totals.ctaClicks / totals.views) * 100 : 0;

  const showOnboarding = videoCount === 0 || productCount === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={brand?.name ?? 'Your brand'}
        description={
          <span className="inline-flex items-center gap-2 text-fg-muted">
            Brand ID
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-2xs text-fg-muted">
              {brandId}
            </code>
          </span>
        }
        actions={
          <>
            <Link href="/dashboard/videos/upload">
              <Button leftIcon={<Film className="h-4 w-4" />}>Upload video</Button>
            </Link>
            <Link href="/dashboard/embed">
              <Button variant="outline">Get embed code</Button>
            </Link>
          </>
        }
      />

      {showOnboarding && <OnboardingCard productCount={productCount} videoCount={videoCount} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Impressions" value={totals.impressions} icon={Eye} />
        <Stat label="Video views" value={totals.views} icon={Sparkles} />
        <Stat label="CTA clicks" value={totals.ctaClicks} icon={MousePointerClick} />
        <Stat label="CTR" value={`${ctr.toFixed(1)}%`} icon={BarChart3} hint="CTA / View" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ResourceCard
          title="Products"
          icon={Package}
          total={productCount}
          activeLabel={`${activeProductCount} active`}
          href="/dashboard/products"
          ctaLabel="Manage products"
        />
        <ResourceCard
          title="Videos"
          icon={Film}
          total={videoCount}
          activeLabel={`${activeVideoCount} active`}
          href="/dashboard/videos"
          ctaLabel="Manage videos"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase tracking-[0.2em] text-fg-subtle">{label}</span>
          <Icon className="h-4 w-4 text-fg-subtle" />
        </div>
        <div className="mt-3 text-3xl font-semibold tracking-tight text-fg">{value}</div>
        {hint && <div className="mt-1 text-xs text-fg-subtle">{hint}</div>}
      </CardBody>
    </Card>
  );
}

function ResourceCard({
  title,
  icon: Icon,
  total,
  activeLabel,
  href,
  ctaLabel,
}: {
  title: string;
  icon: React.ElementType;
  total: number;
  activeLabel: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-accent-subtle text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-0.5 text-xs text-fg-muted">
              {total} total · {activeLabel}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {ctaLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardBody>
    </Card>
  );
}

function OnboardingCard({
  productCount,
  videoCount,
}: {
  productCount: number;
  videoCount: number;
}) {
  const steps = [
    {
      title: 'Add your first product',
      done: productCount > 0,
      href: '/dashboard/products/new',
    },
    {
      title: 'Upload a vertical video',
      done: videoCount > 0,
      href: '/dashboard/videos/upload',
    },
    {
      title: 'Tag products inside the video',
      done: false,
      href: '/dashboard/videos',
    },
    {
      title: 'Copy the embed snippet',
      done: false,
      href: '/dashboard/embed',
    },
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Badge tone="accent">
              <Sparkles className="h-3 w-3" />
              Get started
            </Badge>
            <CardTitle className="mt-2">Ship your first shoppable video</CardTitle>
            <p className="mt-1 text-sm text-fg-muted">
              Four short steps. ~10 minutes total.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        {steps.map((s, i) => (
          <Link
            key={s.title}
            href={s.href}
            className="group flex items-center gap-4 rounded-md border border-border bg-bg/40 px-4 py-3 transition-colors hover:border-border-strong"
          >
            <div
              className={
                'grid h-7 w-7 place-items-center rounded-full text-2xs font-mono ' +
                (s.done ? 'bg-success/20 text-success' : 'bg-surface-2 text-fg-muted')
              }
            >
              {s.done ? '✓' : i + 1}
            </div>
            <span
              className={
                'flex-1 text-sm ' + (s.done ? 'text-fg-muted line-through' : 'text-fg')
              }
            >
              {s.title}
            </span>
            <ArrowUpRight className="h-4 w-4 text-fg-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
