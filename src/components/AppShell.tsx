'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
  Film,
  BarChart3,
  Code2,
  Building2,
  Users,
  ShoppingCart,
  Star,
  Instagram,
  ListChecks,
  ClipboardList,
  Palette,
  Crown,
  Share2,
  CreditCard,
  Gift,
  Percent,
  Boxes,
  TrendingUp,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/cn';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = { heading: string | null; items: NavItem[] };

const BRAND_NAV: NavGroup[] = [
  {
    heading: null,
    items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    heading: 'Commerce',
    items: [
      { href: '/dashboard/customers', label: 'Customers', icon: Users },
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/dashboard/products', label: 'Products', icon: Package },
    ],
  },
  {
    heading: 'Engage',
    items: [
      { href: '/dashboard/videos', label: 'Videos', icon: Film },
      { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
      { href: '/dashboard/social', label: 'Social Feed', icon: Instagram },
      { href: '/dashboard/quizzes', label: 'Quizzes', icon: ListChecks },
      { href: '/dashboard/surveys', label: 'Surveys', icon: ClipboardList },
      { href: '/dashboard/shade', label: 'Shade Studio', icon: Palette },
    ],
  },
  {
    heading: 'Grow',
    items: [
      { href: '/dashboard/loyalty', label: 'Loyalty', icon: Crown },
      { href: '/dashboard/referrals', label: 'Referrals', icon: Share2 },
      { href: '/dashboard/giftcards', label: 'Gift Cards', icon: CreditCard },
      { href: '/dashboard/discounts', label: 'Discounts', icon: Percent },
      { href: '/dashboard/bundles', label: 'Bundles', icon: Boxes },
      { href: '/dashboard/gifts', label: 'Free Gifts', icon: Gift },
      { href: '/dashboard/upsells', label: 'Upsells', icon: TrendingUp },
    ],
  },
  {
    heading: 'Intelligence',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
  {
    heading: 'Setup',
    items: [
      { href: '/dashboard/embed', label: 'Embed & SDK', icon: Code2 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    heading: null,
    items: [
      { href: '/admin', label: 'Brands', icon: Building2 },
      { href: '/admin/videos', label: 'Videos', icon: Film },
      { href: '/admin/products', label: 'Products', icon: Package },
    ],
  },
];

export function AppShell({
  brandName,
  email,
  role,
  signOutAction,
  children,
}: {
  brandName: string;
  email: string;
  role: 'BRAND' | 'ADMIN';
  signOutAction: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = role === 'ADMIN' ? ADMIN_NAV : BRAND_NAV;
  const home = role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar
        nav={nav}
        home={home}
        brandName={brandName}
        email={email}
        role={role}
        signOutAction={signOutAction}
        className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen"
      />

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur lg:hidden">
        <Link href={home}>
          <Logo size="sm" />
        </Link>
        <button
          aria-label="Toggle navigation"
          className="rounded-md p-2 hover:bg-surface"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            nav={nav}
            home={home}
            brandName={brandName}
            email={email}
            role={role}
            signOutAction={signOutAction}
            className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface"
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      )}

      <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

function Sidebar({
  nav,
  home,
  brandName,
  email,
  role,
  signOutAction,
  className,
  onNavigate,
  onClose,
}: {
  nav: NavGroup[];
  home: string;
  brandName: string;
  email: string;
  role: 'BRAND' | 'ADMIN';
  signOutAction: () => void | Promise<void>;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className={cn('flex h-full flex-col border-r border-border bg-bg', className)}>
      <div className="flex items-center justify-between px-5 py-5">
        <Link href={home} aria-label="Avori home" onClick={onNavigate}>
          <Logo size="md" />
        </Link>
        {onClose && (
          <button
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 pb-2 text-2xs uppercase tracking-[0.2em] text-fg-subtle">
        {role === 'ADMIN' ? 'Admin' : 'Workspace'}
      </div>
      <div className="px-3">
        <div className="rounded-md border border-border bg-surface px-3 py-2">
          <div className="text-sm font-semibold text-fg">{brandName}</div>
          <div className="truncate text-xs text-fg-subtle">{email}</div>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {nav.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.heading && (
              <div className="px-3 pb-1 pt-1 text-2xs uppercase tracking-[0.18em] text-fg-subtle">
                {group.heading}
              </div>
            )}
            {group.items.map((n) => {
              const active =
                pathname === n.href ||
                (n.href !== '/dashboard' && pathname?.startsWith(n.href + '/'));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-accent-subtle text-fg ring-1 ring-accent/30'
                      : 'text-fg-muted hover:bg-surface hover:text-fg'
                  )}
                >
                  <n.icon className={cn('h-4 w-4', active ? 'text-accent' : '')} />
                  <span className="flex-1">{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <form action={signOutAction} className="border-t border-border px-3 py-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <LogOut className="h-4 w-4" />
          Sign out
          <ChevronDown className="ml-auto h-3.5 w-3.5 -rotate-90 opacity-60" />
        </button>
      </form>
    </aside>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
