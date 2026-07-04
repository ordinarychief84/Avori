import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import MarketingNav from '@/components/marketing/MarketingNav';
import { Button } from '@/components/ui/Button';

// Shared chrome for every marketing page (landing, pricing, about, customers,
// help, docs, brand, contact).

export function MarketingHeader() {
  return <MarketingNav />;
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-2xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-fg-muted">{sub}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="grid-radial absolute inset-x-0 top-0 h-full" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-subtle px-3 py-1 text-2xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </div>
        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {sub && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{sub}</p>}
      </div>
    </section>
  );
}

export function Faq({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-xl border border-border bg-surface shadow-soft">
      {items.map((f) => (
        <details key={f.q} className="group px-6 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="text-lg leading-none text-fg-subtle transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="band-midnight">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
        {sub && <p className="mx-auto mt-4 max-w-xl text-lg text-stone-300">{sub}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started free
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 text-white hover:border-white/50 hover:bg-white/10"
            >
              Talk to us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'All solutions', href: '/solutions' },
        { label: 'Integrations', href: '/#integrations' },
        { label: 'Security', href: '/#security' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Developer Hub', href: '/docs' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Customers', href: '/customers' },
      ],
    },
  ];
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <Logo size="md" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            One platform. Every growth tool. The commerce experience layer for modern ecommerce
            brands.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              {col.heading}
            </div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-fg-subtle">
          <span>© {new Date().getFullYear()} Avori. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-fg">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-fg">
              Terms
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
