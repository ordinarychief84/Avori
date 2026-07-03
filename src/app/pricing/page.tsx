import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  SectionHeading,
  Faq,
  CtaBand,
} from '@/components/marketing/SiteChrome';
import { plans, pricingFaq } from '@/content/site';

export const metadata: Metadata = {
  title: 'Pricing — Avori',
  description:
    'Simple plans for the whole platform: reviews, video, AI shade analysis, loyalty, referrals, bundles and more. Free during early access.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Pricing"
          title={
            <>
              One subscription.
              <br />
              <span className="text-gradient-teal">Every module included.</span>
            </>
          }
          sub="Stop paying per app. Every Avori plan includes the entire platform — plans scale with order volume, not with how many tools you dare to turn on."
        />

        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mx-auto mb-10 flex max-w-2xl items-center gap-3 rounded-xl border border-accent/25 bg-accent-subtle p-4 text-sm text-fg">
            <Sparkles className="h-5 w-5 shrink-0 text-accent" />
            <span>
              <span className="font-semibold">Early access:</span> every workspace gets the full
              platform free today. Plans below apply when billing launches — with 30 days notice.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-surface p-7 shadow-soft ${
                  p.highlight ? 'border-accent shadow-glow' : 'border-border'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  {p.name}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-fg">{p.price}</span>
                  <span className="text-sm text-fg-muted">{p.cadence}</span>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{p.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.name === 'Scale' ? '/contact' : '/signup'} className="mt-7">
                  <Button
                    className="w-full"
                    variant={p.highlight ? 'primary' : 'secondary'}
                    size="lg"
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-fg-subtle">
            All plans include tenant isolation, HMAC-signed webhooks, audit logging and the
            embeddable widget SDK. Annual billing (2 months free) arrives with billing launch.
          </p>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-border bg-surface/40 py-16">
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

        <CtaBand
          title="Start free. Grow when you do."
          sub="Launch the whole platform today — pick a plan only when billing begins."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
