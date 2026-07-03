import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  Code2,
  CreditCard,
  Crown,
  Film,
  Gift,
  Instagram,
  KeyRound,
  ListChecks,
  Lock,
  Percent,
  Play,
  ScanFace,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Webhook,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header />
      <main>
        <Hero />
        <LogoStrip />
        <StatsBand />
        <Platform />
        <Integrations />
        <Developers />
        <SecurityBand />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- header */

function Header() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label="Avori home" className="shrink-0">
          <Logo size="md" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-fg-muted md:flex">
          <a href="#platform" className="transition-colors hover:text-fg">
            Platform
          </a>
          <a href="#integrations" className="transition-colors hover:text-fg">
            Integrations
          </a>
          <a href="#developers" className="transition-colors hover:text-fg">
            Developers
          </a>
          <a href="#security" className="transition-colors hover:text-fg">
            Security
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Get started free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-radial absolute inset-x-0 top-0 h-[520px]" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-subtle px-3 py-1 text-2xs font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3 w-3" />
            Commerce Experience OS
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
            One platform.
            <br />
            <span className="text-gradient-teal">Every growth tool.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
            Reviews, shoppable video, AI shade matching, quizzes, loyalty, referrals, bundles and
            upsells — unified on one dashboard, one customer database and one AI layer. Without the
            chaos of multiple apps.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" leftIcon={<Play className="h-4 w-4" />}>
                See the live demo
              </Button>
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
            {['No code required', 'Works with any store', 'Every module included'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Hero visual: dashboard in a browser frame + floating proof cards */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-2/60 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 rounded-md bg-surface px-2 py-0.5 font-mono text-2xs text-fg-subtle">
                app.avori.com/dashboard
              </span>
            </div>
            <DashboardMock />
          </div>

          <div className="absolute -left-6 top-10 hidden w-48 rounded-lg border border-border bg-surface p-3 shadow-card sm:block">
            <div className="flex items-center gap-1 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-1.5 text-xs leading-snug text-fg">
              “Shade match was scary accurate.”
            </p>
            <div className="mt-1.5 flex items-center gap-1 text-2xs text-fg-subtle">
              <BadgeCheck className="h-3 w-3 text-accent" /> Verified buyer
            </div>
          </div>

          <div className="absolute -right-4 -top-5 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-card sm:flex">
            <Crown className="h-3.5 w-3.5 text-accent" />
            <span className="text-2xs font-semibold text-fg">+240 pts earned</span>
          </div>

          <div className="absolute -bottom-5 right-8 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-card sm:flex">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-2xs font-semibold text-fg">AOV +41% with bundles</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- logo strip */

function LogoStrip() {
  const brands = ['ROXA BEAUTY', 'LUMIÈRE', 'GLOWLAB', 'MARÉ SKIN', 'HAZEL & CO', 'TONO'];
  return (
    <section className="border-y border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-center text-2xs uppercase tracking-[0.22em] text-fg-subtle">
          Powering the customer experience for modern brands
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((b) => (
            <span
              key={b}
              className="font-semibold tracking-[0.14em] text-fg-subtle transition-colors hover:text-fg-muted"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- stats band */

function StatsBand() {
  const stats = [
    { value: '+28%', label: 'conversion on pages with reviews & UGC' },
    { value: '+41%', label: 'average order value with bundles & upsells' },
    { value: '3.4×', label: 'repeat purchase rate with loyalty & referrals' },
    { value: '1 line', label: 'of code to embed any widget on any site' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-6 text-center shadow-soft"
          >
            <div className="text-3xl font-bold tracking-tight text-accent">{s.value}</div>
            <div className="mt-2 text-sm leading-snug text-fg-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-2xs text-fg-subtle">
        Illustrative benchmarks from beauty-commerce deployments of comparable tooling.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- platform */

function SectionHeading({
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

function FeatureRow({
  eyebrow,
  icon: Icon,
  title,
  copy,
  bullets,
  visual,
  reverse = false,
}: {
  eyebrow: string;
  icon: React.ElementType;
  title: string;
  copy: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        reverse ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">{copy}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-fg">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {b}
            </li>
          ))}
        </ul>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Explore in the demo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="relative">{visual}</div>
    </div>
  );
}

/* CSS-composed product mocks — theme-aware and crisp at any scale. */

function DashboardMock() {
  const bars = [38, 52, 44, 66, 58, 74, 62, 82, 70, 90, 84, 96];
  return (
    <div className="grid grid-cols-[104px_1fr] text-left">
      <div className="space-y-1 border-r border-border bg-surface-2/50 p-3">
        {['Overview', 'Customers', 'Reviews', 'Videos', 'Loyalty', 'Analytics'].map((n, i) => (
          <div
            key={n}
            className={`rounded px-2 py-1 text-2xs ${
              i === 0 ? 'bg-accent-subtle font-semibold text-accent' : 'text-fg-muted'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Revenue', '$128,560', '+18.6%'],
            ['Orders', '1,842', '+12.4%'],
            ['AOV', '$69.78', '+8.2%'],
            ['Conversion', '3.45%', '+1.1%'],
          ].map(([l, v, d]) => (
            <div key={l} className="rounded-lg border border-border bg-surface p-2.5 shadow-soft">
              <div className="text-2xs text-fg-subtle">{l}</div>
              <div className="mt-0.5 text-sm font-bold text-fg">{v}</div>
              <div className="text-2xs font-medium text-success">{d}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xs font-semibold text-fg">Revenue overview</span>
            <span className="text-2xs text-fg-subtle">Last 12 weeks</span>
          </div>
          <div className="flex h-20 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-accent to-accent-bright"
                style={{ height: `${h}%`, opacity: 0.55 + (i / bars.length) * 0.45 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsMock() {
  const rows = [
    { name: 'Maya A.', title: 'Shade match was perfect', body: 'The analyzer nailed my undertone — gloss looks amazing.', verified: true },
    { name: 'Skye O.', title: 'Instant favourite', body: 'Silky, lasts all day, and the try-on preview was spot on.', verified: true },
    { name: 'Cleo N.', title: 'Good, shipping slow', body: 'Product 10/10. Delivery took a week longer than expected.', verified: false },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-4 py-2.5">
        <span className="text-xs font-semibold text-fg">Moderation queue</span>
        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-2xs font-semibold text-warning">
          3 pending
        </span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="flex items-start gap-3 p-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/hero-beauty.jpg"
              alt=""
              className="h-10 w-10 rounded object-cover ring-1 ring-border"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                {r.verified && (
                  <span className="flex items-center gap-0.5 text-2xs text-accent">
                    <BadgeCheck className="h-3 w-3" /> verified
                  </span>
                )}
              </div>
              <div className="mt-0.5 truncate text-xs font-semibold text-fg">{r.title}</div>
              <div className="truncate text-2xs text-fg-muted">
                {r.body} — {r.name}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <span className="rounded-md bg-accent px-2 py-1 text-2xs font-semibold text-white">
                Approve
              </span>
              <span className="rounded-md border border-border px-2 py-1 text-2xs text-fg-muted">
                Reject
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMock() {
  const modules = [
    ['Videos', '4.2%', 'CTR'],
    ['Reviews', '4.8★', 'avg rating'],
    ['Quiz', '61%', 'completion'],
    ['Loyalty', '38%', 'enrolled'],
    ['Referrals', '112', 'conversions'],
    ['Upsells', '+$8.40', 'per order'],
  ];
  const bars = [30, 45, 38, 58, 50, 68, 62, 78, 72, 88];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-4 py-2.5">
        <span className="text-xs font-semibold text-fg">Unified analytics</span>
        <span className="flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent">
          <Sparkles className="h-3 w-3" /> 5 AI insights ready
        </span>
      </div>
      <div className="p-4">
        <div className="flex h-24 items-end gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-accent to-accent-bright"
              style={{ height: `${h}%`, opacity: 0.55 + (i / bars.length) * 0.45 }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {modules.map(([m, v, l]) => (
            <div key={m} className="rounded-lg border border-border bg-surface-2/40 p-2 text-center">
              <div className="text-2xs text-fg-subtle">{m}</div>
              <div className="text-sm font-bold text-fg">{v}</div>
              <div className="text-2xs text-fg-muted">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Platform() {
  return (
    <section id="platform" className="scroll-mt-20 border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl space-y-24 px-6">
        <div>
          <SectionHeading
            eyebrow="The platform"
            title="Every module. One customer database."
            sub="Each tool below usually costs its own subscription. In Avori they ship together, share every customer record, and feed one analytics and AI engine."
          />
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: Star, label: 'Reviews & UGC' },
              { icon: Film, label: 'Shoppable Video' },
              { icon: ScanFace, label: 'AI Shade Match' },
              { icon: ListChecks, label: 'Quizzes' },
              { icon: BarChart3, label: 'Surveys & NPS' },
              { icon: Crown, label: 'Loyalty' },
              { icon: Share2, label: 'Referrals' },
              { icon: CreditCard, label: 'Gift Cards' },
              { icon: Boxes, label: 'Bundles' },
              { icon: TrendingUp, label: 'Upsells' },
              { icon: Gift, label: 'Free Gifts' },
              { icon: Percent, label: 'Discounts' },
              { icon: Instagram, label: 'Social Feed' },
              { icon: Users, label: 'Customers 360°' },
              { icon: Sparkles, label: 'AI Assistant' },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-fg shadow-soft"
              >
                <m.icon className="h-4 w-4 shrink-0 text-accent" />
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <FeatureRow
          eyebrow="Reviews & UGC"
          icon={Star}
          title="Turn customer voices into conversion"
          copy="Collect text, photo and video reviews on autopilot with post-purchase requests. Moderate in one queue, reply publicly, and let AI summarize hundreds of reviews into one shopper-ready paragraph."
          bullets={[
            'Verified-purchase badges matched against real orders',
            'Q&A with published answers on your product pages',
            'AI review summaries powered by Claude',
            'Auto-publish thresholds and one-click moderation',
          ]}
          visual={
            <div className="relative">
              <ReviewsMock />
              <div className="absolute -bottom-6 -left-4 w-56 rounded-lg border border-border bg-surface p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-2xs font-semibold text-accent">
                    AI summary
                  </span>
                </div>
                <p className="mt-1.5 text-2xs leading-snug text-fg-muted">
                  Customers love the long-lasting glow; a few wish shipping were faster.
                </p>
              </div>
            </div>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Shoppable video"
          icon={Film}
          title="TikTok-style video that sells on your site"
          copy="Upload short vertical videos, tag products frame by frame, and embed inline, floating or feed players anywhere with one line of code. Every impression, view and tap is tracked to revenue."
          bullets={[
            'Inline, floating bubble and full-feed players',
            'In-frame product tags with instant add-to-cart links',
            'AI try-on for lipstick, gloss, blush and more',
            'Impression → view → click → order attribution',
          ]}
          visual={
            <div className="mx-auto flex max-w-[260px] justify-center">
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-fg/90 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/ugc-gloss.jpg"
                  alt="Shoppable UGC video"
                  className="block w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg/85 shadow-card">
                    <Play className="ml-0.5 h-5 w-5 text-fg" />
                  </span>
                </div>
                <span className="absolute left-[38%] top-[55%] block h-4 w-4 rounded-full border-2 border-white bg-accent-bright shadow-glow" />
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-lg bg-bg/90 p-2 shadow-soft">
                  <span className="h-8 w-8 rounded bg-accent-subtle" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-2xs font-semibold text-fg">Golden Hour Gloss</div>
                    <div className="text-2xs text-fg-muted">$19.00 · Tap to shop</div>
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <FeatureRow
          eyebrow="AI personalization"
          icon={ScanFace}
          title="A selfie becomes a personal shade consultation"
          copy="Customers snap a selfie; Claude vision reads skin tone, undertone, lip tone, hair and eye color, then Avori matches products tagged for that profile. Pair it with quiz funnels for guided selling that captures leads."
          bullets={[
            'Skin tone, undertone, lip, hair, eye and color-season analysis',
            'Recommendations from your own tagged catalog',
            'Quiz builder with conditional logic and lead capture',
            'Profiles saved to the customer record for future campaigns',
          ]}
          visual={
            <div className="grid grid-cols-2 gap-4">
              {[
                { src: '/marketing/shade-portrait-1.jpg', chips: ['tan · warm', 'autumn'] },
                { src: '/marketing/shade-portrait-2.jpg', chips: ['deep · neutral', 'winter'] },
              ].map((p) => (
                <div
                  key={p.src}
                  className="overflow-hidden rounded-xl border border-border bg-surface shadow-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt="AI shade analysis portrait"
                    className="block aspect-[3/4] w-full object-cover"
                  />
                  <div className="flex flex-wrap gap-1.5 p-2.5">
                    {p.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold capitalize text-accent"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Retention suite"
          icon={Crown}
          title="Points, tiers, referrals and store credit that bring them back"
          copy="Launch a loyalty program with earn rates, VIP tiers and birthday bonuses in minutes. Reward referrers automatically — with fraud checks — and issue gift cards and store credit your checkout can validate through one API."
          bullets={[
            'Earn rules, VIP multipliers, signup / review / birthday bonuses',
            'Referral links with self-referral and repeat-IP fraud protection',
            'Gift cards and wallet credit with full transaction ledgers',
            'Rewards redeem into codes your cart validates via API',
          ]}
          visual={
            <div className="mx-auto max-w-sm space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fg">Maya’s wallet</span>
                  <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-accent">
                    Gold tier
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold text-fg">
                  1,240 <span className="text-base font-medium text-fg-muted">beans</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-accent-bright" />
                </div>
                <div className="mt-1.5 text-2xs text-fg-subtle">
                  760 beans to Platinum · 1.5× multiplier active
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
                <Share2 className="h-5 w-5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-fg">MAYA-4XKP</div>
                  <div className="text-2xs text-fg-muted">3 friends converted · $18 credit earned</div>
                </div>
                <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-2xs font-semibold text-success">
                  Fraud-checked
                </span>
              </div>
            </div>
          }
        />

        <FeatureRow
          eyebrow="Revenue boosters"
          icon={TrendingUp}
          title="Bundles, upsells, gifts and discounts — coordinated, not chaotic"
          copy="Frequently-bought-together, Buy X Get Y, mix & match and volume tiers. Placement-targeted upsells across product, cart, checkout and post-purchase. Gift thresholds that nudge carts higher. All measured in one place."
          bullets={[
            'Four bundle types with per-item roles and tiered pricing',
            'Upsell offers by placement with impression → conversion tracking',
            'Free-gift campaigns with “spend $18 more” progress hints',
            'Codes, schedules and usage limits on every discount',
          ]}
          visual={
            <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
                Frequently bought together
              </div>
              <div className="mt-3 space-y-2.5">
                {[
                  ['Golden Hour Gloss', '$19.00'],
                  ['Velvet Matte Lipstick', '$24.00'],
                  ['Hydra Prep Balm', '$16.00'],
                ].map(([name, price]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded bg-accent-subtle" />
                    <span className="flex-1 text-sm text-fg">{name}</span>
                    <span className="text-sm text-fg-muted">{price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div>
                  <span className="text-sm text-fg-subtle line-through">$59.00</span>{' '}
                  <span className="text-lg font-bold text-fg">$47.20</span>
                  <span className="ml-2 rounded bg-success/10 px-1.5 py-0.5 text-2xs font-bold text-success">
                    SAVE 20%
                  </span>
                </div>
                <span className="rounded-md bg-accent px-3 py-1.5 text-2xs font-semibold text-white shadow-glow">
                  Add all 3
                </span>
              </div>
            </div>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Intelligence"
          icon={Sparkles}
          title="Analytics and an AI analyst that already knows your store"
          copy="Revenue, AOV, repeat rate and module performance on one board — no stitching spreadsheets. Generate AI insights from 90 days of data, or just ask the assistant what to launch next."
          bullets={[
            'Unified funnel: impressions → engagement → orders → revenue',
            'Per-module boards for videos, reviews, quizzes, loyalty and more',
            'One-click AI insight reports with concrete recommendations',
            'Chat assistant grounded in your live store data',
          ]}
          visual={<AnalyticsMock />}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ integrations */

function Integrations() {
  const platforms = [
    { name: 'Shopify', desc: 'OAuth app + webhooks', icon: ShoppingCart, status: 'Native connector' },
    { name: 'WooCommerce', desc: 'REST keys + webhooks', icon: Zap, status: 'Native connector' },
    { name: 'BigCommerce', desc: 'Via REST API', icon: Boxes, status: 'API-ready' },
    { name: 'Magento / Adobe', desc: 'Via REST API', icon: Boxes, status: 'API-ready' },
    { name: 'Custom storefronts', desc: 'REST API + JS SDK', icon: Code2, status: 'First-class' },
  ];
  return (
    <section id="integrations" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Integrations"
          title="Works where you sell"
          sub="Connectors sync products, customers and orders. Everything else — widgets, APIs, webhooks — works on any website, headless or hosted."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-surface p-5 shadow-soft">
              <p.icon className="h-6 w-6 text-accent" />
              <div className="mt-3 font-semibold text-fg">{p.name}</div>
              <div className="mt-0.5 text-xs text-fg-muted">{p.desc}</div>
              <span className="mt-3 inline-block rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent">
                {p.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-fg p-5 shadow-card">
            <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent-bright">
              Embed a widget — one line
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-stone-200">
              {`<script src="https://app.avori.com/widget.js" async></script>
<div class="shop-video-widget"
     data-brand-id="YOUR_BRAND_ID"
     data-mode="floating"></div>`}
            </pre>
          </div>
          <div className="rounded-xl border border-border bg-fg p-5 shadow-card">
            <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent-bright">
              Push an order — one request
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-stone-200">
              {`curl -X POST https://app.avori.com/api/v1/orders \\
  -H "Authorization: Bearer avk_..." \\
  -d '{ "email": "maya@example.com",
        "items": [{ "sku": "GLOSS-01",
          "name": "Golden Hour Gloss",
          "quantity": 1, "price": 19 }] }'`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- developers */

function Developers() {
  const cards = [
    {
      icon: KeyRound,
      title: 'REST API',
      copy: 'Versioned /api/v1 with bearer API keys, cursor pagination and consistent errors. Products, customers, orders, reviews, loyalty, quizzes, shade analysis and more.',
    },
    {
      icon: Webhook,
      title: 'Webhooks — both directions',
      copy: 'Receive HMAC-signed events (order.created, review.approved…) with automatic retries and delivery logs. Inbound receivers verify Shopify and WooCommerce signatures.',
    },
    {
      icon: Code2,
      title: 'Embeddable SDK',
      copy: 'A ~16KB dependency-free widget bundle plus CORS-open JSON endpoints for reviews, quizzes, social feeds and videos. Style it or build fully headless.',
    },
  ];
  return (
    <section id="developers" className="scroll-mt-20 border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Developers"
          title="API-first, integration-friendly"
          sub="Everything the dashboard does, the API does. Build on Avori the way you'd build on Stripe."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-surface p-6 shadow-soft">
              <c.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold text-fg">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- security */

function SecurityBand() {
  const items = [
    { icon: ShieldCheck, label: 'Tenant isolation on every query' },
    { icon: KeyRound, label: 'API keys stored as SHA-256 hashes' },
    { icon: Webhook, label: 'HMAC-signed webhooks with replay-safe retries' },
    { icon: Lock, label: 'Role-based access: Owner, Manager, Staff' },
    { icon: BarChart3, label: 'Full audit log of every sensitive action' },
    { icon: Zap, label: 'Per-IP rate limiting on public endpoints' },
  ];
  return (
    <section id="security" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Security"
          title="Enterprise-grade guardrails, startup-grade speed"
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div
              key={i.label}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-soft"
            >
              <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-sm text-fg">{i.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ testimonials */

function Testimonials() {
  const quotes = [
    {
      quote:
        'We replaced four subscriptions the first week. The loyalty and reviews finally talk to the same customer record — that alone changed our email game.',
      name: 'Amara O.',
      role: 'Founder, Roxa Beauty',
    },
    {
      quote:
        'The shade analyzer is our best lead magnet ever. People share it like a quiz, and every result lands in the CRM with products attached.',
      name: 'Camille R.',
      role: 'Ecommerce Lead, Lumière',
    },
    {
      quote:
        'One afternoon to integrate on our headless store: an API key, three endpoints, one webhook. Docs read like they were written by people who ship.',
      name: 'Dani M.',
      role: 'CTO, Glowlab',
    },
  ];
  return (
    <section className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Merchants" title="Loved by teams who’ve had enough of app sprawl" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-soft"
            >
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-fg">
                “{q.quote}”
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3">
                <div className="text-sm font-semibold text-fg">{q.name}</div>
                <div className="text-xs text-fg-muted">{q.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- final CTA */

function FinalCta() {
  return (
    <section className="band-midnight">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to unify your customer experience?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-300">
          Set up your workspace, connect your store, and launch your first module today — reviews,
          video, loyalty or the AI shade analyzer.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started free
            </Button>
          </Link>
          <a href="mailto:hello@avori.com?subject=Avori%20demo">
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 text-white hover:border-white/50 hover:bg-white/10"
            >
              Book a demo
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

function Footer() {
  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'Reviews & UGC', href: '#platform' },
        { label: 'Shoppable Video', href: '#platform' },
        { label: 'AI Shade Analyzer', href: '#platform' },
        { label: 'Loyalty & Referrals', href: '#platform' },
        { label: 'Bundles & Upsells', href: '#platform' },
        { label: 'Analytics & AI', href: '#platform' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'REST API', href: '#developers' },
        { label: 'Webhooks', href: '#developers' },
        { label: 'Widget SDK', href: '#developers' },
        { label: 'Integrations', href: '#integrations' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Log in', href: '/login' },
        { label: 'Create account', href: '/signup' },
        { label: 'Security', href: '#security' },
        { label: 'Contact', href: 'mailto:hello@avori.com' },
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
                  <a
                    href={l.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-fg-subtle">
          <span>© {new Date().getFullYear()} Avori. All rights reserved.</span>
          <span>Built beauty-first. Extensible everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
