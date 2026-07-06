import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/SiteChrome';
import { helpArticles } from '@/content/site';

export function generateStaticParams() {
  return helpArticles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = helpArticles.find((a) => a.slug === params.slug);
  return { title: article ? `${article.title} | Avori Help` : 'Help | Avori' };
}

export default function HelpArticlePage({ params }: { params: { slug: string } }) {
  const article = helpArticles.find((a) => a.slug === params.slug);
  if (!article) notFound();

  const related = helpArticles.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  );

  return (
    <div className="dark-canvas min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Help Center
        </Link>
        <div className="mt-6">
          <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-accent">
            {article.category}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{article.title}</h1>
          <p className="mt-2 text-fg-muted">{article.summary}</p>
        </div>
        <ol className="mt-8 space-y-5">
          {article.body.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-sm font-bold text-accent">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-fg">{step}</p>
            </li>
          ))}
        </ol>
        {related.length > 0 && (
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              Related in {article.category}
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link href={`/help/${a.slug}`} className="text-sm font-medium text-accent hover:text-accent-hover">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
