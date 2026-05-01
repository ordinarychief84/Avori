import Link from 'next/link';
import {
  ArrowRight,
  MousePointerClick,
  CodeXml,
  LineChart,
  Sparkles,
  Play,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <div className="relative">
      <SiteHeader />

      <main>
        <Hero />
        <LogosStrip />
        <Features />
        <HowItWorks />
        <DemoBlock />
        <CTA />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="Avori home">
          <Logo size="md" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-fg-muted md:flex">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#how-it-works" className="hover:text-fg">How it works</a>
          <a href="#demo" className="hover:text-fg">Demo</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-fg-muted hover:text-fg hidden sm:inline-block">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-radial opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="accent" className="mx-auto mb-6">
            <Sparkles className="h-3 w-3" /> New · Vertical feed mode
          </Badge>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl">
            Shoppable video for any storefront.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-fg-muted">
            Upload short vertical videos, tag products inside each frame, and drop one snippet onto
            your site. Floating bubble, inline player, or full TikTok-style feed — your choice.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start free
              </Button>
            </Link>
            <a href="#demo">
              <Button size="lg" variant="outline" leftIcon={<Play className="h-4 w-4" />}>
                Watch the demo
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-fg-subtle">
            Free to try · No credit card · One-line embed
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-x-12 -inset-y-8 rounded-[2rem] bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-border bg-surface/60 p-2 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { mode: 'Inline', desc: 'Drops into any content section' },
            { mode: 'Floating', desc: 'Bottom-right bubble, click to expand', highlight: true },
            { mode: 'Feed', desc: 'Full-screen vertical scroll' },
          ].map((m) => (
            <div
              key={m.mode}
              className={
                'relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-2 ' +
                (m.highlight ? 'ring-1 ring-accent/40 shadow-glow' : 'border border-border')
              }
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-bg to-bg" />
              <div className="absolute left-3 top-3">
                <Badge tone={m.highlight ? 'accent' : 'neutral'}>{m.mode}</Badge>
              </div>
              <div className="absolute inset-x-3 bottom-3 text-xs text-fg-muted">{m.desc}</div>
              <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-glow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogosStrip() {
  const names = ['ICED', 'NORA', 'SOLAR', 'MARTOK', 'BREAD', 'PETRA'];
  return (
    <section className="border-y border-border/60 bg-surface/30 py-10">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-fg-subtle">
        Built for D2C brands shipping today
      </p>
      <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 opacity-70">
        {names.map((n) => (
          <span
            key={n}
            className="font-mono text-sm tracking-[0.3em] text-fg-muted"
          >
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: MousePointerClick,
      title: 'Tag products in seconds',
      body: 'Click anywhere on a video to drop a hotspot. Set when it appears, when it leaves. Drag to reposition.',
    },
    {
      icon: CodeXml,
      title: 'One-line embed',
      body: 'Paste a single script tag and a div. Done. Inline, floating bubble, or vertical feed.',
    },
    {
      icon: LineChart,
      title: 'Real conversion analytics',
      body: 'Impressions, views, tag clicks, CTA clicks. Per video, per product, per domain.',
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to make video shoppable.
        </h2>
        <p className="mt-3 text-fg-muted">
          From upload to attribution. No design work. No engineering team.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong"
          >
            <div className="grid h-10 w-10 place-items-center rounded-md bg-accent-subtle text-accent">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ['01', 'Upload a vertical video', 'Drag and drop. We handle the rest. MP4, WebM, MOV.'],
    ['02', 'Tag your products', 'Click on the player to drop a hotspot. Choose the product. Set the time window.'],
    ['03', 'Paste the embed', 'One script tag, one div. Choose inline, floating, or feed mode.'],
    ['04', 'Watch conversions', 'Real-time analytics break down views, clicks, and CTA conversion per product.'],
  ];
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-surface/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            From raw clip to shoppable in four steps.
          </h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, b]) => (
            <div key={n} className="bg-bg p-6">
              <div className="font-mono text-xs text-accent">{n}</div>
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoBlock() {
  return (
    <section id="demo" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Badge tone="accent" className="mb-4">Live demo</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Try the embed code yourself.
          </h2>
          <p className="mt-4 text-fg-muted">
            This is the exact snippet brands paste on their site. Copy, paste, ship.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface p-5 text-xs leading-relaxed text-fg">
{`<script src="https://avori.app/widget.js" async></script>
<div
  class="shop-video-widget"
  data-brand-id="YOUR_BRAND_ID"
  data-mode="floating"
></div>`}
          </pre>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-fg-subtle">
            <Badge tone="neutral">data-mode="inline"</Badge>
            <Badge tone="neutral">data-mode="floating"</Badge>
            <Badge tone="neutral">data-mode="feed"</Badge>
            <Badge tone="neutral">data-theme="auto | light | dark"</Badge>
          </div>
        </div>
        <div className="relative aspect-[9/16] max-w-sm justify-self-center overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-bg to-bg" />
          <div className="absolute left-1/2 top-[35%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-glow" />
          <div className="absolute left-[30%] top-[60%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-glow opacity-70" />
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-bg/80 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-accent/30" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-fg">Iced Latte Lip Balm</div>
                <div className="text-xs text-fg-muted">$18.00</div>
              </div>
              <div className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white">Shop</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Ship shoppable video in an afternoon.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-fg-muted">
          Free during the beta. Real analytics. No platform lock-in. Cancel any time.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Create your brand
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-fg-subtle md:flex-row">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span>© {new Date().getFullYear()} Avori. All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <Link href="/login" className="hover:text-fg">Log in</Link>
          <Link href="/signup" className="hover:text-fg">Sign up</Link>
          <a href="https://github.com/ordinarychief84/Avori" className="hover:text-fg" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
