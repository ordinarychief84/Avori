import { Check, Instagram, Play, Sparkles, Star } from 'lucide-react';

// CSS-composed product mock per solution, theme-aware and crisp at any scale.
// Each mock stays truthful to the real UI it represents.

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`hover-pop overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="flex items-center gap-0.5 text-warning">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-current" />
      ))}
    </span>
  );
}

function ReviewsVisual() {
  return (
    <Panel>
      <div className="space-y-3">
        {[
          { name: 'Maya A.', body: 'Shade match was perfect, the gloss looks amazing.', verified: true },
          { name: 'Jordan P.', body: 'Video review attached, texture is exactly as shown.', verified: true },
        ].map((r) => (
          <div key={r.name} className="rounded-lg border border-border bg-surface-2/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-fg">
                {r.name}
                {r.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-accent-subtle px-1.5 py-0.5 text-2xs font-semibold text-accent">
                    <Check className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>
              <Stars />
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">{r.body}</p>
          </div>
        ))}
        <div className="rounded-lg border border-accent/25 bg-accent-subtle p-3">
          <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-accent">
            <Sparkles className="h-3 w-3" /> AI summary
          </div>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            Customers love the long-lasting glow; a few wish shipping were faster.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function UgcVisual() {
  const tints = [
    'from-accent/30 to-accent-bright/40',
    'from-warning/30 to-accent/20',
    'from-accent-bright/30 to-accent/40',
    'from-accent/20 to-warning/30',
    'from-accent-bright/40 to-accent/30',
    'from-accent/40 to-accent-bright/20',
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {tints.map((g, i) => (
        <div key={g} className={`hover-pop relative aspect-square overflow-hidden rounded-xl border border-border bg-gradient-to-br ${g}`}>
          {i % 2 === 0 && (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-fg/70 px-2 py-0.5 text-2xs font-semibold text-bg">Shop</span>
          )}
          {i === 4 && (
            <span className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1 text-2xs font-medium text-fg shadow-card">
              Shared by Amara O.
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoVisual() {
  return (
    <div className="mx-auto w-64">
      <div className="hover-pop relative overflow-hidden rounded-2xl border border-border bg-fg shadow-card" style={{ aspectRatio: '9/16' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-fg to-fg" />
        <span className="absolute left-1/3 top-1/3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-accent-bright/90 shadow-glow" />
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-surface p-2.5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 shrink-0 rounded-md bg-gradient-to-br from-warning/50 to-accent/40" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-fg">Golden Hour Gloss</div>
              <div className="text-2xs text-fg-muted">$19.00</div>
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-2xs font-bold text-white">Shop</span>
          </div>
        </div>
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
    </div>
  );
}

function SocialVisual() {
  return (
    <Panel>
      <div className="flex items-center gap-2 text-xs font-semibold text-fg">
        <Instagram className="h-4 w-4 text-accent" /> @yourbrand · shoppable feed
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {['from-accent/35 to-warning/25', 'from-accent-bright/35 to-accent/25', 'from-warning/30 to-accent-bright/25'].map((g, i) => (
          <div key={g} className={`relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br ${g}`}>
            {i === 1 && <span className="absolute bottom-1 left-1 rounded-full bg-fg/70 px-1.5 py-0.5 text-2xs font-semibold text-bg">2 products</span>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ShadeVisual() {
  return (
    <Panel>
      <div className="flex gap-4">
        <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-warning/40 via-warning/20 to-accent-subtle">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-accent-bright shadow-glow" />
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-fg/70 px-2 py-0.5 text-2xs font-semibold text-bg">analyzing…</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {['Warm undertone', 'Tan depth', 'Autumn'].map((c) => (
              <span key={c} className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent">{c}</span>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-2.5">
            <div className="text-2xs font-bold uppercase tracking-wide text-fg-subtle">Top match</div>
            <div className="mt-1 text-xs font-semibold text-fg">Silk Foundation · Shade 07 Amber</div>
            <span className="mt-1.5 inline-block rounded-md bg-accent px-2.5 py-1 text-2xs font-bold text-white">Shop now</span>
          </div>
          <div className="text-2xs text-fg-subtle">Not ready? We&rsquo;ll email your matches.</div>
        </div>
      </div>
    </Panel>
  );
}

function QuizVisual() {
  return (
    <Panel>
      <div className="text-2xs font-semibold text-fg-subtle">Question 2 of 3</div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-2/3 rounded-full bg-accent" />
      </div>
      <div className="mt-3 text-sm font-semibold text-fg">How would you describe your skin?</div>
      <div className="mt-2 space-y-1.5">
        {['Dry and tight by midday', 'Oily in the T-zone', 'Balanced most days'].map((o, i) => (
          <div key={o} className={`rounded-lg border px-3 py-2 text-xs ${i === 1 ? 'border-accent bg-accent-subtle font-semibold text-accent' : 'border-border text-fg-muted'}`}>
            {o}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-accent/25 bg-accent-subtle p-2.5 text-2xs text-fg-muted">
        <span className="font-bold text-accent">Result preview:</span> Balancing Gel Cleanser, 94% match
      </div>
    </Panel>
  );
}

function SurveysVisual() {
  return (
    <Panel>
      <div className="text-sm font-semibold text-fg">How likely are you to recommend us?</div>
      <div className="mt-2.5 flex gap-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className={`flex h-6 w-6 items-center justify-center rounded text-2xs font-semibold ${i === 9 ? 'bg-accent text-white' : 'bg-surface-2 text-fg-muted'}`}>
            {i}
          </span>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-accent/25 bg-accent-subtle p-3">
        <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-accent">
          <Sparkles className="h-3 w-3" /> AI summary · 214 responses
        </div>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">
          Promoters cite fast shade matching; detractors want more refill options.
        </p>
      </div>
    </Panel>
  );
}

function LoyaltyVisual() {
  return (
    <Panel>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Points balance</div>
          <div className="text-3xl font-bold tracking-tight text-accent">2,480</div>
        </div>
        <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-2xs font-bold text-accent">Gold tier</span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-2xs text-fg-subtle"><span>Gold</span><span>520 pts to Platinum</span></div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-accent to-accent-bright" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-fg-muted">
        <div className="flex justify-between"><span>Order #1208</span><span className="font-semibold text-accent">+190 pts</span></div>
        <div className="flex justify-between"><span>Photo review bonus</span><span className="font-semibold text-accent">+50 pts</span></div>
        <div className="flex justify-between"><span>Birthday gift</span><span className="font-semibold text-accent">+100 pts</span></div>
      </div>
    </Panel>
  );
}

function CashbackVisual() {
  return (
    <Panel>
      <div className="rounded-lg border border-border bg-surface-2/40 p-3">
        <div className="flex justify-between text-xs"><span className="font-semibold text-fg">Order #1214 · paid</span><span className="text-fg-muted">$86.00</span></div>
        <div className="mt-1.5 flex justify-between rounded-md bg-accent-subtle px-2 py-1.5 text-xs">
          <span className="font-semibold text-accent">5% cashback (Gold tier)</span>
          <span className="font-bold text-accent">+$4.30 credit</span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-fg-muted">
        <div className="flex justify-between"><span>Store credit balance</span><span className="font-bold text-fg">$23.80</span></div>
        <div className="flex justify-between"><span>Earned this quarter</span><span>$41.10</span></div>
        <div className="flex justify-between"><span>Spent back in store</span><span>$17.30</span></div>
      </div>
    </Panel>
  );
}

function StoreCreditVisual() {
  return (
    <Panel>
      <div className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Store credit wallet</div>
      <div className="mt-1 text-3xl font-bold tracking-tight text-fg">$48.50</div>
      <div className="mt-3 space-y-1.5 text-xs">
        {[
          ['Refund → credit · order #1189', '+$32.00'],
          ['Cashback · order #1204', '+$4.50'],
          ['Referral reward', '+$12.00'],
          ['Spent at checkout', '−$18.00'],
        ].map(([label, amt]) => (
          <div key={label} className="flex justify-between rounded-md border border-border bg-surface-2/30 px-2.5 py-1.5">
            <span className="text-fg-muted">{label}</span>
            <span className={`font-semibold ${amt.startsWith('+') ? 'text-accent' : 'text-fg'}`}>{amt}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function GiftCardsVisual() {
  return (
    <div className="space-y-3">
      <div className="hover-pop overflow-hidden rounded-xl border border-border shadow-card">
        <div className="band-midnight p-5">
          <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-bright">Avori gift card</div>
          <div className="mt-2 font-mono text-lg font-bold tracking-widest text-white">GIFT-9F2K-AM04</div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-2xs text-stone-300">For: maya@example.com</span>
            <span className="text-2xl font-bold text-white">$50</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-3 text-xs text-fg-muted shadow-soft">
        Balance check: <span className="font-semibold text-accent">$31.50 remaining</span> · redeemed twice
      </div>
    </div>
  );
}

function ReferralsVisual() {
  return (
    <Panel>
      <div className="rounded-lg border border-border bg-surface-2/40 p-2.5 font-mono text-xs text-fg">
        avori.shop/r/<span className="font-bold text-accent">maya-k</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-border p-2.5">
          <div className="text-2xs text-fg-subtle">Advocate earns</div>
          <div className="text-sm font-bold text-accent">$10 credit</div>
        </div>
        <div className="rounded-lg border border-border p-2.5">
          <div className="text-2xs text-fg-subtle">Friend gets</div>
          <div className="text-sm font-bold text-accent">15% off</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
        <span>38 clicks · 9 conversions</span>
        <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent">fraud checks on</span>
      </div>
    </Panel>
  );
}

function BundlesVisual() {
  return (
    <Panel>
      <div className="text-2xs font-bold uppercase tracking-wide text-fg-subtle">Frequently bought together</div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="h-14 w-14 rounded-lg bg-gradient-to-br from-accent/35 to-warning/30" />
        <span className="text-lg font-bold text-fg-subtle">+</span>
        <span className="h-14 w-14 rounded-lg bg-gradient-to-br from-accent-bright/35 to-accent/25" />
        <div className="ml-auto text-right">
          <div className="text-2xs text-fg-subtle line-through">$47.00</div>
          <div className="text-lg font-bold text-accent">$39.00</div>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-accent px-3 py-2 text-center text-xs font-bold text-white">Add both to cart</div>
      <div className="mt-2 text-center text-2xs text-fg-subtle">Also available: Buy X Get Y · mix &amp; match · quantity breaks</div>
    </Panel>
  );
}

function UpsellsVisual() {
  return (
    <Panel>
      <div className="text-2xs font-bold uppercase tracking-wide text-fg-subtle">Your cart · $52.00</div>
      <div className="mt-2 space-y-1.5 text-xs text-fg-muted">
        <div className="flex justify-between"><span>Silk Foundation</span><span>$33.00</span></div>
        <div className="flex justify-between"><span>Golden Hour Gloss</span><span>$19.00</span></div>
      </div>
      <div className="mt-3 rounded-lg border border-accent/30 bg-accent-subtle p-3">
        <div className="text-2xs font-bold uppercase tracking-wide text-accent">Complete the look</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-fg">Setting Mist · 20% off in cart</span>
          <span className="rounded-md bg-accent px-2.5 py-1 text-2xs font-bold text-white">Add · $12.80</span>
        </div>
      </div>
      <div className="mt-2 text-center text-2xs text-fg-subtle">Placements: product page · cart · checkout · post-purchase</div>
    </Panel>
  );
}

function FreeGiftsVisual() {
  return (
    <Panel>
      <div className="flex justify-between text-xs"><span className="font-semibold text-fg">Cart total</span><span className="text-fg-muted">$64 of $75</span></div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-accent to-accent-bright" />
      </div>
      <div className="mt-2 text-xs text-fg-muted">
        You&rsquo;re <span className="font-bold text-accent">$11 away</span> from a free Mini Gloss Duo
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 p-2.5">
        <span className="h-10 w-10 rounded-md bg-gradient-to-br from-accent-bright/40 to-accent/30" />
        <div className="text-xs">
          <div className="font-semibold text-fg">Mini Gloss Duo</div>
          <div className="text-fg-subtle"><span className="line-through">$14.00</span> · free over $75</div>
        </div>
      </div>
    </Panel>
  );
}

function DiscountsVisual() {
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <span className="rounded-lg border-2 border-dashed border-accent bg-accent-subtle px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-accent">GLOW20</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-success"><Check className="h-3.5 w-3.5" /> valid</span>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-fg-muted">
        <div className="flex justify-between"><span>Value</span><span className="font-semibold text-fg">20% off</span></div>
        <div className="flex justify-between"><span>Window</span><span>Jul 1 – Jul 14</span></div>
        <div className="flex justify-between"><span>Usage</span><span>184 / 500 cap</span></div>
        <div className="flex justify-between"><span>Platforms</span><span>Shopify · Woo · headless</span></div>
      </div>
    </Panel>
  );
}

function AnalyticsVisual() {
  const bars = [34, 52, 41, 68, 59, 82, 74];
  return (
    <Panel>
      <div className="flex items-baseline justify-between">
        <div className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Attributed revenue · 7 days</div>
        <div className="text-lg font-bold text-accent">$12,480</div>
      </div>
      <div className="mt-3 flex h-24 items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-accent to-accent-bright" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Video 38%', 'Quiz 24%', 'Upsell 21%', 'Referral 17%'].map((c) => (
          <span key={c} className="rounded-full bg-accent-subtle px-2 py-0.5 text-2xs font-semibold text-accent">{c}</span>
        ))}
      </div>
    </Panel>
  );
}

function AssistantVisual() {
  return (
    <Panel>
      <div className="space-y-2.5">
        <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-accent px-3 py-2 text-xs text-white">
          What changed in reviews this week?
        </div>
        <div className="max-w-[90%] rounded-xl rounded-bl-sm border border-border bg-surface-2/50 px-3 py-2 text-xs leading-relaxed text-fg">
          Rating held at 4.7 across 41 new reviews. Texture praise is up, and three customers
          flagged slow shipping to the West Coast: worth a look at the carrier.
        </div>
        <div className="flex items-center gap-1.5 text-2xs font-semibold text-accent">
          <Sparkles className="h-3 w-3" /> Grounded in your live store data
        </div>
      </div>
    </Panel>
  );
}

const VISUALS: Record<string, () => React.ReactNode> = {
  reviews: ReviewsVisual,
  'ugc-gallery': UgcVisual,
  'shoppable-video': VideoVisual,
  'social-feed': SocialVisual,
  'shade-analyzer': ShadeVisual,
  quizzes: QuizVisual,
  surveys: SurveysVisual,
  loyalty: LoyaltyVisual,
  cashback: CashbackVisual,
  'store-credit': StoreCreditVisual,
  'gift-cards': GiftCardsVisual,
  referrals: ReferralsVisual,
  bundles: BundlesVisual,
  upsells: UpsellsVisual,
  'free-gifts': FreeGiftsVisual,
  discounts: DiscountsVisual,
  analytics: AnalyticsVisual,
  'ai-assistant': AssistantVisual,
};

export default function SolutionVisual({ slug }: { slug: string }) {
  const Visual = VISUALS[slug];
  if (!Visual) return null;
  return <Visual />;
}
