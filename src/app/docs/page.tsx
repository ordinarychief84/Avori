import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, Webhook, Code2, Zap, ShieldCheck, Plug } from 'lucide-react';
import {
  MarketingHeader,
  MarketingFooter,
  PageHero,
  CtaBand,
} from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'Developer Hub | Avori',
  description:
    'Everything to build on Avori: REST API, authentication, webhooks in both directions, and the embeddable widget SDK.',
};

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-fg p-4 font-mono text-xs leading-relaxed text-stone-200">
      {children}
    </pre>
  );
}

function DocSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}

const NAV = [
  ['quickstart', 'Quickstart'],
  ['auth', 'Authentication'],
  ['rest', 'REST API'],
  ['webhooks', 'Webhooks'],
  ['widget', 'Widget SDK'],
  ['limits', 'Errors & limits'],
] as const;

const ENDPOINTS: Array<[string, string, string]> = [
  ['GET', '/api/v1/products', 'Active catalog with review stats + AI summaries'],
  ['GET · POST', '/api/v1/customers', 'Look up by email · upsert customers'],
  ['POST', '/api/v1/orders', 'Ingest an order, triggers loyalty, referrals, review requests, analytics, destinations'],
  ['GET · POST', '/api/v1/reviews', 'Approved reviews by product · submit a review'],
  ['GET · POST', '/api/v1/loyalty', 'Balance, tier, history & rewards by email · redeem a reward'],
  ['POST', '/api/v1/discounts/validate', 'Validate any code: discount, reward or gift card'],
  ['POST', '/api/v1/giftcards/redeem', 'Deduct a gift-card balance at checkout'],
  ['POST', '/api/v1/referrals/track', 'Record a referral-link click'],
  ['GET · POST', '/api/v1/quizzes/{slug}', 'Fetch an active quiz · submit answers, get recommendations'],
  ['POST', '/api/v1/surveys/{id}/respond', 'Submit a survey / NPS response'],
  ['GET · POST', '/api/v1/upsells', 'Offers for a placement · track clicks'],
  ['GET', '/api/v1/bundles', 'Active bundles, optionally by product'],
  ['POST', '/api/v1/gifts/eligible', 'Which free-gift campaigns a cart unlocks'],
  ['POST', '/api/v1/shade/analyze', 'AI shade analysis: base64 selfie → color profile + matches'],
  ['GET', '/api/v1/social', 'Shoppable social feed'],
  ['POST', '/api/v1/events', 'Generic analytics event ingestion'],
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Developer Hub"
          title={
            <>
              Build on Avori like you’d
              <br />
              <span className="text-gradient-brand">build on Stripe.</span>
            </>
          }
          sub="Everything the dashboard does, the API does. Bearer keys, predictable JSON, cursor pagination, signed webhooks, and a widget when you don’t want to build UI."
        />

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[200px_1fr]">
          <nav className="top-24 hidden self-start lg:sticky lg:block">
            <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              On this page
            </div>
            <ul className="mt-3 space-y-1.5 border-l border-border pl-4">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-sm text-fg-muted hover:text-accent">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-14">
            <DocSection id="quickstart" icon={Zap} title="Quickstart">
              <p>
                Create an API key in <span className="font-medium text-fg">Settings → API keys</span>{' '}
                (the plaintext key is shown once), then push your first order. One request wires the
                whole platform: the customer record, loyalty points, referral attribution, review
                requests, analytics and marketing destinations.
              </p>
              <Code>{`curl -X POST https://app.avori.com/api/v1/orders \\
  -H "Authorization: Bearer avk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "maya@example.com",
    "orderNumber": "#1042",
    "items": [
      { "sku": "GLOSS-01", "name": "Golden Hour Gloss",
        "quantity": 1, "price": 19 }
    ],
    "discountCodes": ["WELCOME10"],
    "referralCode": "MAYA-4XKP"
  }'`}</Code>
            </DocSection>

            <DocSection id="auth" icon={KeyRound} title="Authentication">
              <p>
                Private endpoints under <code className="font-mono text-xs text-fg">/api/v1/*</code>{' '}
                authenticate with a bearer API key scoped to your workspace. Keys are stored as
                SHA-256 hashes, treat them like passwords and rotate from Settings any time.
              </p>
              <Code>{`Authorization: Bearer avk_your_key_here`}</Code>
              <p>
                Keep keys server-side. For browser-embedded surfaces use the widget endpoints under{' '}
                <code className="font-mono text-xs text-fg">/api/public/brand/&#123;brandId&#125;/…</code>{' '}
               , CORS-open, rate-limited per IP, and restricted to published content.
              </p>
            </DocSection>

            <DocSection id="rest" icon={Code2} title="REST API">
              <p>
                JSON in, JSON out. Lists paginate with <code className="font-mono text-xs text-fg">?limit</code>{' '}
                and <code className="font-mono text-xs text-fg">?cursor</code> (response carries{' '}
                <code className="font-mono text-xs text-fg">nextCursor</code>).
              </p>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/50 text-2xs uppercase tracking-wider text-fg-subtle">
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Endpoint</th>
                      <th className="px-4 py-2.5">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENDPOINTS.map(([m, path, desc]) => (
                      <tr key={path} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-accent">{m}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-fg">{path}</td>
                        <td className="px-4 py-2.5 text-fg-muted">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection id="webhooks" icon={Webhook} title="Webhooks in both directions">
              <p>
                <span className="font-medium text-fg">Outbound:</span> register endpoints in
                Settings → Webhooks and subscribe to topics like{' '}
                <code className="font-mono text-xs text-fg">order.created</code>,{' '}
                <code className="font-mono text-xs text-fg">order.updated</code>,{' '}
                <code className="font-mono text-xs text-fg">review.created</code> and{' '}
                <code className="font-mono text-xs text-fg">review.approved</code>. Every delivery is
                signed and retried with backoff (1, 4, 9, 16 minutes; 5 attempts), delivery logs are
                visible per endpoint.
              </p>
              <Code>{`X-Avori-Topic: order.created
X-Avori-Signature: hex(hmac_sha256(secret, rawBody))

// verify (node)
const ok = crypto.timingSafeEqual(
  Buffer.from(signature, "hex"),
  Buffer.from(crypto.createHmac("sha256", secret)
    .update(rawBody).digest("hex"), "hex"));`}</Code>
              <p>
                <span className="font-medium text-fg">Inbound:</span> Avori receives and verifies
                platform webhooks, Shopify at{' '}
                <code className="font-mono text-xs text-fg">/api/integrations/shopify/webhooks</code>{' '}
                (HMAC base64) and WooCommerce at{' '}
                <code className="font-mono text-xs text-fg">/api/integrations/woocommerce/webhooks</code>{' '}
                (<code className="font-mono text-xs text-fg">X-WC-Webhook-Signature</code>).
              </p>
            </DocSection>

            <DocSection id="widget" icon={Plug} title="Widget SDK">
              <p>
                A ~16KB dependency-free bundle renders shoppable video (inline, floating or feed) on
                any site. Public JSON endpoints expose reviews, Q&A, quizzes and social feeds if you
                prefer fully custom UI.
              </p>
              <Code>{`<script src="https://app.avori.com/widget.js" async></script>
<div class="shop-video-widget"
     data-brand-id="YOUR_BRAND_ID"
     data-mode="floating"></div>`}</Code>
              <p>
                Read-only widget data:{' '}
                <code className="font-mono text-xs text-fg">
                  GET /api/public/brand/&#123;brandId&#125;/videos · /reviews?productId=… · /social
                </code>
              </p>
            </DocSection>

            <DocSection id="limits" icon={ShieldCheck} title="Errors & limits">
              <p>
                Errors return <code className="font-mono text-xs text-fg">{`{ "error": "message" }`}</code>{' '}
                with conventional status codes (400 validation, 401 auth, 403 forbidden, 404 not
                found). Public endpoints are rate-limited per IP (reads ~600/min, writes ~10/min).
                Order ingestion is idempotent per <code className="font-mono text-xs text-fg">orderNumber</code>{' '}
                and per connector <code className="font-mono text-xs text-fg">externalId</code>.
              </p>
              <p>
                Questions or missing endpoints?{' '}
                <Link href="/contact" className="font-semibold text-accent hover:text-accent-hover">
                  Tell us
                </Link>{' '}
               , the API grows with real integrations.
              </p>
            </DocSection>
          </div>
        </div>

        <CtaBand title="Ship your integration today" sub="Create a workspace, mint a key, and push your first order in minutes." />
      </main>
      <MarketingFooter />
    </div>
  );
}
