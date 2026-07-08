'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Plan } from '@/content/site';

// Rise-style tier cards with an annual / monthly billing toggle.
export default function PricingTiers({ plans }: { plans: Plan[] }) {
  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual');

  return (
    <div>
      <div className="mx-auto flex w-fit items-center rounded-full border border-border bg-surface p-1 shadow-soft">
        {(
          [
            ['annual', 'Annual · 2 months free'],
            ['monthly', 'Monthly'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              period === key ? 'bg-accent text-white shadow-glow' : 'text-fg-muted hover:text-fg'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => {
          const price = period === 'annual' ? p.annual : p.monthly;
          return (
            <div
              key={p.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-surface p-7 shadow-soft',
                p.highlight ? 'border-accent shadow-glow' : 'border-border'
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                  Most recommended
                </span>
              )}
              <div className="text-sm font-semibold uppercase tracking-[0.14em] text-fg-muted">
                {p.name}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold tracking-tight text-fg">
                  {price === 0 ? '$0' : `$${price}`}
                </span>
                <span className="text-sm text-fg-muted">
                  {price === 0 ? 'free forever' : '/ month'}
                </span>
              </div>
              <div className="mt-1 text-xs text-fg-subtle">
                {price === 0
                  ? 'No card required'
                  : period === 'annual'
                    ? `billed annually ($${p.annual * 12}/yr) · $${p.monthly} monthly`
                    : 'billed monthly'}
              </div>
              <div className="mt-3 rounded-lg bg-accent-subtle px-3 py-2 text-sm font-semibold text-accent">
                {p.orderCap}
                {p.perExtra && (
                  <span className="block text-2xs font-medium text-fg-muted">{p.perExtra}</span>
                )}
              </div>
              <p className="mt-3 text-sm text-fg-muted">{p.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className="mt-7">
                <Button className="w-full" variant={p.highlight ? 'primary' : 'secondary'} size="lg">
                  {p.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
