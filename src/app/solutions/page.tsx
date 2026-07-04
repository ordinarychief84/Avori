import type { Metadata } from 'next';
import Link from 'next/link';
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
import { MarketingHeader, MarketingFooter, CtaBand, PageHero } from '@/components/marketing/SiteChrome';
import { solutions } from '@/content/solutions';

export const metadata: Metadata = {
  title: 'Solutions | Avori',
  description:
    'Eighteen growth modules, one platform: reviews, UGC, shoppable video, quizzes, loyalty, bundles, upsells, analytics and more.',
};

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

const CATEGORY_ORDER = [
  'Customer trust',
  'AI personalization',
  'Average order value',
  'Retention',
  'Intelligence',
] as const;

export default function SolutionsIndexPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Solutions"
          title={
            <>
              Every growth tool, <span className="text-gradient-brand">one platform</span>
            </>
          }
          sub="Each module is engineered as a standalone feature and shares one customer database with the rest. Pick a starting point."
        />
        <section className="mx-auto max-w-7xl space-y-14 px-6 py-16">
          {CATEGORY_ORDER.map((cat) => {
            const items = solutions.filter((s) => s.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-2xs font-semibold uppercase tracking-[0.2em] text-accent">{cat}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => {
                    const Icon = ICONS[s.slug] ?? Star;
                    return (
                      <Link
                        key={s.slug}
                        href={`/solutions/${s.slug}`}
                        className="hover-pop group rounded-xl border border-border bg-surface p-6 shadow-soft"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle">
                          <Icon className="h-4.5 w-4.5 text-accent" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 font-semibold text-fg group-hover:text-accent">
                          {s.name}
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">{s.sub}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
        <CtaBand
          title="Ready to see it on your store?"
          sub="Set up your workspace, connect your platform, and launch your first module today."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
