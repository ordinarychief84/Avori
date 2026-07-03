import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Plug, Boxes, CreditCard } from 'lucide-react';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  SectionHeading,
  Faq,
  CtaBand,
} from '@/components/marketing/SiteChrome';
import { helpArticles, helpCategories, productFaq } from '@/content/site';

export const metadata: Metadata = {
  title: 'Help Center | Avori',
  description: 'Setup guides, module how-tos and answers for the Avori platform.',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Getting started': BookOpen,
  Integrations: Plug,
  Modules: Boxes,
  'Billing & account': CreditCard,
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Help Center"
          title={
            <>
              How can we <span className="text-gradient-brand">help?</span>
            </>
          }
          sub="Guides for every module and connector. Can’t find it? Contact us, a human answers."
        />

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {helpCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] ?? BookOpen;
              const articles = helpArticles.filter((a) => a.category === cat);
              return (
                <div key={cat} className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-accent" />
                    <h2 className="font-semibold text-fg">{cat}</h2>
                  </div>
                  <ul className="mt-4 divide-y divide-border">
                    {articles.map((a) => (
                      <li key={a.slug}>
                        <Link
                          href={`/help/${a.slug}`}
                          className="group flex items-center justify-between gap-3 py-3"
                        >
                          <span>
                            <span className="block text-sm font-medium text-fg group-hover:text-accent">
                              {a.title}
                            </span>
                            <span className="block text-xs text-fg-muted">{a.summary}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="Product FAQ" title="Common questions about the platform" />
            <div className="mt-10">
              <Faq items={productFaq} />
            </div>
            <p className="mt-6 text-center text-sm text-fg-muted">
              Billing questions live in the{' '}
              <Link href="/pricing#faq" className="font-semibold text-accent hover:text-accent-hover">
                pricing FAQ
              </Link>
              .
            </p>
          </div>
        </section>

        <CtaBand title="Still stuck?" sub="Send us a message, support is a topic on the contact form." />
      </main>
      <MarketingFooter />
    </div>
  );
}
