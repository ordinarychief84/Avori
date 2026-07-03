import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  SectionHeading,
  CtaBand,
} from '@/components/marketing/SiteChrome';
import { caseStudies, useCases } from '@/content/site';

export const metadata: Metadata = {
  title: 'Customers | Avori',
  description:
    'How modern brands use Avori: case studies and use cases across reviews, shoppable video, AI shade matching, loyalty and more.',
};

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Customers"
          title={
            <>
              Brands growing on
              <br />
              <span className="text-gradient-brand">one platform</span>
            </>
          }
          sub="From clean cosmetics to headless DTC, how teams use Avori to convert, retain and personalize."
        />

        {/* Case studies */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {caseStudies.map((c) => (
              <article
                key={c.slug}
                className="flex flex-col rounded-2xl border border-border bg-surface p-7 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold tracking-[0.18em] text-fg">{c.logoText}</span>
                  <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-2xs font-semibold text-accent">
                    {c.industry}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-fg">{c.headline}</h2>
                <div className="mt-2 flex items-center gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
                  “{c.quote}”
                </blockquote>
                <div className="mt-3 text-sm">
                  <span className="font-semibold text-fg">{c.person}</span>
                  <span className="text-fg-muted">, {c.role}, {c.brand}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-lg font-bold text-accent">{m.value}</div>
                      <div className="mt-0.5 text-2xs leading-snug text-fg-muted">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.modules.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-border bg-surface-2/50 px-2 py-0.5 text-2xs font-medium text-fg-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-center text-2xs text-fg-subtle">
            Illustrative stories composed for the Avori demo, your brand could be the first real one here.
          </p>
        </section>

        {/* Use cases */}
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              eyebrow="Use cases"
              title="Start with the goal, not the tool"
              sub="Every Avori module maps to a growth outcome. Pick the outcome, the platform brings the right tools."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((u) => (
                <div key={u.goal} className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-soft">
                  <h3 className="font-semibold text-fg">{u.goal}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{u.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {u.modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaBand
          title="Write the next story here"
          sub="Launch Avori on your store today, and tell us what you grow."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
