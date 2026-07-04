import type { Metadata } from 'next';
import { Check, X } from 'lucide-react';
import { Logo, LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  SectionHeading,
} from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'Design Guide | Avori',
  description: 'Avori brand guidelines: logo, color palette, typography, components and voice.',
};

const COLORS = [
  ['Ink', '#0D0D0D', 'Primary text'],
  ['Navy', '#01095B', 'Dark bands, footers'],
  ['Brand Magenta', '#AF00AF', 'Primary actions, accents'],
  ['Bright Magenta', '#F224F2', 'Gradients, highlights, CTAs'],
  ['Pink Tint', '#FDEEFF', 'Pills, hover rows'],
  ['White', '#FFFFFF', 'Page canvas and cards'],
  ['Gray', '#4A4A4A', 'Secondary text'],
  ['Hairline', '#E3E3E3', 'Borders, dividers'],
  ['Success', '#15803D', 'Positive states'],
  ['Warning', '#D97706', 'Caution states'],
  ['Error', '#DC2626', 'Destructive states'],
];

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Design Guide"
          title={
            <>
              The Avori
              <br />
              <span className="text-gradient-brand">brand system</span>
            </>
          }
          sub="How Avori looks, sounds and behaves across every surface."
        />

        {/* Logo */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading eyebrow="Logo" title="Mark & wordmark" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-surface shadow-soft">
              <Logo size="lg" />
            </div>
            <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-surface shadow-soft">
              <LogoMark className="h-14 w-14 text-fg" />
            </div>
            <div className="band-midnight flex h-40 items-center justify-center rounded-xl">
              <Logo size="lg" className="[&_span]:text-white [&_svg]:text-white" />
            </div>
            <div className="flex h-40 items-center justify-center rounded-xl bg-accent">
              <LogoMark className="h-14 w-14 text-white" />
            </div>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {[
              [true, 'Use clear space of at least the mark’s width around the logo'],
              [true, 'Use the icon alone for app icons and favicons'],
              [false, 'Do not change the bar colors or gradient direction'],
              [false, 'Do not stretch, rotate, or set on low-contrast backgrounds'],
            ].map(([okRule, text]) => (
              <div
                key={text as string}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-3.5 text-sm shadow-soft"
              >
                {okRule ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                )}
                <span className="text-fg">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Color */}
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="Color" title="Palette" />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {COLORS.map(([name, hex, use]) => (
                <div key={hex} className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                  <div className="h-20 w-full border-b border-border" style={{ backgroundColor: hex }} />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-fg">{name}</div>
                    <div className="font-mono text-2xs text-fg-muted">{hex}</div>
                    <div className="mt-1 text-2xs text-fg-subtle">{use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading eyebrow="Typography" title="Inter, everywhere" />
          <div className="mx-auto mt-10 max-w-3xl space-y-4 rounded-xl border border-border bg-surface p-8 shadow-soft">
            <div className="text-5xl font-bold tracking-tight">Aa · Bold headlines</div>
            <div className="text-2xl font-semibold tracking-tight text-fg">
              SemiBold section titles
            </div>
            <div className="text-base text-fg">Regular body copy for reading comfort.</div>
            <div className="text-sm text-fg-muted">Muted secondary text for support lines.</div>
            <div className="font-mono text-sm text-fg">JetBrains Mono for code: avk_key_</div>
            <p className="border-t border-border pt-4 text-sm leading-relaxed text-fg-muted">
              Clean, modern and highly readable typography that reflects clarity and confidence.
              Headlines are tight (-1.5% letter-spacing); labels use wide uppercase tracking.
            </p>
          </div>
        </section>

        {/* Components */}
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="Components" title="Buttons & elements" />
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-surface p-8 shadow-soft">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Badge tone="accent">accent</Badge>
              <Badge tone="success">success</Badge>
              <Badge tone="warning">warning</Badge>
              <Badge tone="neutral">neutral</Badge>
            </div>
          </div>
        </section>

        {/* Voice */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading eyebrow="Tone of voice" title="Confident, smart, supportive" />
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-lg leading-relaxed text-fg">
              “We simplify ecommerce growth so you can focus on what matters.”
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {['Helpful', 'Smart', 'Reliable', 'Modern', 'Clear'].map((t) => (
                <span key={t} className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
