'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Item = { label: string; href: string; hint?: string };

const SOLUTIONS: Item[] = [
  { label: 'Reviews', href: '/solutions/reviews' },
  { label: 'UGC Gallery', href: '/solutions/ugc-gallery' },
  { label: 'Shoppable Video', href: '/solutions/shoppable-video' },
  { label: 'Social Feed', href: '/solutions/social-feed' },
  { label: 'AI Shade Analyzer', href: '/solutions/shade-analyzer' },
  { label: 'Quizzes', href: '/solutions/quizzes' },
  { label: 'Surveys', href: '/solutions/surveys' },
  { label: 'Loyalty Program', href: '/solutions/loyalty' },
  { label: 'Cashback', href: '/solutions/cashback' },
  { label: 'Store Credit', href: '/solutions/store-credit' },
  { label: 'Gift Cards', href: '/solutions/gift-cards' },
  { label: 'Referrals', href: '/solutions/referrals' },
  { label: 'Bundles', href: '/solutions/bundles' },
  { label: 'Upsells', href: '/solutions/upsells' },
  { label: 'Free Gifts', href: '/solutions/free-gifts' },
  { label: 'Discounts', href: '/solutions/discounts' },
  { label: 'Analytics', href: '/solutions/analytics' },
  { label: 'AI Assistant', href: '/solutions/ai-assistant' },
];

const RESOURCES: Item[] = [
  { label: 'Help Center', href: '/help' },
  { label: 'Developer Hub', href: '/docs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function Dropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
}: {
  label: string;
  items: Item[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onToggle} onMouseLeave={onClose}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 py-2 text-sm transition-colors',
          open ? 'text-fg' : 'text-fg-muted hover:text-fg'
        )}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 rounded-xl border border-border bg-surface p-2 shadow-card',
            items.length > 8 ? 'grid w-[26rem] grid-cols-2 gap-x-1' : 'w-60'
          )}
        >
          {items.map((i) => (
            <Link
              key={i.label}
              href={i.href}
              onClick={onClose}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-accent-subtle hover:text-accent"
            >
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Rise-style marketing navigation: solution and resource dropdowns in the
// center, pricing plus a demo CTA on the right.
export default function MarketingNav() {
  const [openMenu, setOpenMenu] = useState<'solutions' | 'resources' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div ref={navRef} className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label="Avori home" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <Dropdown
            label="Solutions"
            items={SOLUTIONS}
            open={openMenu === 'solutions'}
            onToggle={() => setOpenMenu('solutions')}
            onClose={() => setOpenMenu(null)}
          />
          <Link href="/customers" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Case Studies
          </Link>
          <Dropdown
            label="Resources"
            items={RESOURCES}
            open={openMenu === 'resources'}
            onToggle={() => setOpenMenu('resources')}
            onClose={() => setOpenMenu(null)}
          />
          <Link href="/#integrations" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Integrations
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/pricing" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Pricing
          </Link>
          <Link href="/login" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Log in
          </Link>
          <Link href="/contact">
            <Button size="sm">Request a Demo</Button>
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="rounded-md p-2 hover:bg-surface-2 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface px-6 py-4 lg:hidden">
          <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Solutions
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4">
            {SOLUTIONS.map((i) => (
              <Link
                key={i.label}
                href={i.href}
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-sm text-fg"
              >
                {i.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            More
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4">
            {[
              { label: 'Case Studies', href: '/customers' },
              ...RESOURCES,
              { label: 'Integrations', href: '/#integrations' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'Log in', href: '/login' },
            ].map((i) => (
              <Link
                key={i.label}
                href={i.href}
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-sm text-fg"
              >
                {i.label}
              </Link>
            ))}
          </div>
          <Link href="/contact" onClick={() => setMobileOpen(false)} className="mt-4 block">
            <Button className="w-full">Request a Demo</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
