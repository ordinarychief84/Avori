import { Fragment } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Check, Minus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  MarketingHeader,
  MarketingFooter,
  SectionHeading,
  Faq,
} from '@/components/marketing/SiteChrome';
import PricingTiers from '@/components/marketing/PricingTiers';
import { plans, planComparison, pricingFaq } from '@/content/site';

export const metadata: Metadata = {
  title: 'Pricing | Avori',
  description:
    'Simple plans for the whole platform: reviews, video, AI shade analysis, loyalty, referrals, bundles and more. Free during early access.',
};

const COLUMNS = ['Starter', 'Growth', 'Scale', 'Enterprise'] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-accent" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-fg-subtle/60" />;
  return <span className="text-xs font-medium text-fg">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="dark-canvas min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        {/* Rise-style headline */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-radial absolute inset-x-0 top-0 h-full" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:py-20">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your Time to <span className="text-gradient-brand">Grow</span> is Now
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Every plan includes the entire platform. Pricing scales with your order volume, not
              with how many tools you turn on.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mx-auto mb-10 flex max-w-2xl items-center gap-3 rounded-xl border border-accent/25 bg-accent-subtle p-4 text-sm text-fg">
            <Sparkles className="h-5 w-5 shrink-0 text-accent" />
            <span>
              <span className="font-semibold">Early access:</span> every workspace gets the full
              platform free today. Plans below apply when billing launches, with 30 days notice.
            </span>
          </div>

          <PricingTiers plans={plans} />

          {/* Enterprise, Rise-style wide card */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6 band-midnight rounded-2xl border border-border p-8 text-white shadow-card">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Building2 className="h-6 w-6 text-accent-bright" />
              </span>
              <div>
                <div className="text-lg font-bold tracking-tight">Enterprise</div>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-300">
                  Limitless orders and shade analyses, white labeling, custom data retention, a
                  dedicated account manager and onboarding for your whole team.
                </p>
              </div>
            </div>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:border-white/50 hover:bg-white/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature comparison matrix */}
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Compare plans" title="Everything, side by side" />
            <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3.5 text-2xs font-semibold uppercase tracking-[0.15em] text-fg-subtle">
                      Features
                    </th>
                    {COLUMNS.map((c) => (
                      <th
                        key={c}
                        className={
                          c === 'Growth'
                            ? 'bg-accent-subtle px-4 py-3.5 text-center text-2xs font-bold uppercase tracking-[0.15em] text-accent'
                            : 'px-4 py-3.5 text-center text-2xs font-semibold uppercase tracking-[0.15em] text-fg-muted'
                        }
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planComparison.map((group) => (
                    <Fragment key={group.category}>
                      <tr className="border-b border-border bg-surface-2/50">
                        <td
                          colSpan={5}
                          className="px-5 py-2.5 text-2xs font-bold uppercase tracking-[0.15em] text-fg"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.feature} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-3 text-fg-muted">{row.feature}</td>
                          {row.values.map((v, i) => (
                            <td
                              key={i}
                              className={
                                COLUMNS[i] === 'Growth'
                                  ? 'bg-accent-subtle/50 px-4 py-3 text-center'
                                  : 'px-4 py-3 text-center'
                              }
                            >
                              <Cell value={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="Pricing FAQ" title="Questions about plans & billing" />
            <div className="mt-10">
              <Faq items={pricingFaq} />
            </div>
            <p className="mt-6 text-center text-sm text-fg-muted">
              Product questions? See the{' '}
              <Link href="/help#faq" className="font-semibold text-accent hover:text-accent-hover">
                product FAQ
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="font-semibold text-accent hover:text-accent-hover">
                contact us
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Rise-style closing CTA */}
        <section className="band-midnight">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your customer experience?
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact">
                <Button size="lg">Request a Demo</Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-white hover:border-white/50 hover:bg-white/10"
                >
                  Start Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
