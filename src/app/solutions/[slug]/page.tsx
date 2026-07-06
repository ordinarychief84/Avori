import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Camera,
  ClipboardList,
  Coins,
  CreditCard,
  Crown,
  Film,
  Gift,
  Instagram,
  ListChecks,
  Percent,
  ScanFace,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketingHeader, MarketingFooter, CtaBand, SectionHeading } from '@/components/marketing/SiteChrome';
import SolutionVisual from '@/components/marketing/SolutionVisuals';
import { solutions, getSolution, relatedSolutions } from '@/content/solutions';

const ICONS: Record<string, React.ElementType> = {
  reviews: Star,
  'ugc-gallery': Camera,
  'shoppable-video': Film,
  'social-feed': Instagram,
  'shade-analyzer': ScanFace,
  quizzes: ListChecks,
  surveys: ClipboardList,
  loyalty: Crown,
  cashback: Coins,
  'store-credit': Wallet,
  'gift-cards': CreditCard,
  referrals: Share2,
  bundles: Boxes,
  upsells: TrendingUp,
  'free-gifts': Gift,
  discounts: Percent,
  analytics: BarChart3,
  'ai-assistant': Sparkles,
};

const PLATFORMS = ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Headless & custom'];

export function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getSolution(params.slug);
  if (!s) return {};
  return {
    title: `${s.name} | Avori Solutions`,
    description: s.sub,
  };
}

export default function SolutionPage({ params }: { params: { slug: string } }) {
  const s = getSolution(params.slug);
  if (!s) notFound();
  const Icon = ICONS[s.slug] ?? Star;
  const related = relatedSolutions(s.slug);

  return (
    <div className="dark-canvas min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        {/* Hero: copy left, live-style mock right */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-radial absolute inset-x-0 top-0 h-full" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-subtle px-3 py-1 text-2xs font-semibold uppercase tracking-[0.18em] text-accent">
                <Icon className="h-3.5 w-3.5" />
                {s.category} · {s.name}
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
                {s.headline}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">{s.sub}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Start free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary">
                    See pricing
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-2xs font-medium text-fg-muted"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <SolutionVisual slug={s.slug} />
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="What you get"
            title={`${s.name}, engineered end to end`}
            sub="Every capability below ships today, on every platform Avori connects to."
          />
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
            {s.features.map((f) => (
              <div key={f.title} className="hover-pop rounded-xl border border-border bg-surface p-6 shadow-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle">
                  <Icon className="h-4.5 w-4.5 text-accent" />
                </div>
                <h3 className="mt-3 font-semibold text-fg">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-surface/40 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="How it works" title="Live in three steps" />
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
              {s.steps.map((step, i) => (
                <div key={step.title} className="hover-pop relative rounded-xl border border-border bg-surface p-6 shadow-soft">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.copy}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-surface-2/70 p-5 shadow-card">
              <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent-bright">
                For developers
              </div>
              <p className="mt-2 break-words font-mono text-xs leading-relaxed text-stone-200">{s.apiNote}</p>
              <Link
                href="/docs"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-bright hover:text-white"
              >
                Open the developer hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Related solutions */}
        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-20">
            <SectionHeading
              eyebrow={s.category}
              title="Works even better together"
              sub="Modules share one customer database, so each one makes the others smarter."
            />
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => {
                const RIcon = ICONS[r.slug] ?? Star;
                return (
                  <Link
                    key={r.slug}
                    href={`/solutions/${r.slug}`}
                    className="hover-pop group rounded-xl border border-border bg-surface p-5 shadow-soft"
                  >
                    <RIcon className="h-5 w-5 text-accent" />
                    <div className="mt-3 font-semibold text-fg group-hover:text-accent">{r.name}</div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-muted">{r.sub}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <CtaBand title={s.cta} sub="Set up your workspace, connect your store, and launch this module today." />
      </main>
      <MarketingFooter />
    </div>
  );
}
