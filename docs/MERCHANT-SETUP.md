# Avori Merchant Setup Guide (for developers)

The complete path from an empty workspace to every solution live on a
merchant's storefront. Written for developers and integrators doing the
setup; every endpoint, env var and snippet below exists in this codebase.

Base URL in examples: `https://avori-pink.vercel.app` (substitute your deploy).
`{brandId}` is the merchant's workspace id, shown in Settings → Plan & billing
and used by all public embeds.

---

## 1. Platform prerequisites (once per deploy)

| Requirement | Detail |
|---|---|
| Environment variables | `DATABASE_URL` (pgBouncer :6543), `DIRECT_URL` (:5432), `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (public origin, baked into snippets), `ANTHROPIC_API_KEY` (AI features; optional, degrade gracefully), `STORAGE_PROVIDER`, `MAX_IMAGE_BYTES`, `MAX_VIDEO_BYTES`, `EVENT_RATE_LIMIT` |
| Optional platform OAuth | `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` from a Shopify Partner app enable one-click OAuth connect and webhook HMAC verification. Without them, merchants connect via Admin API token (section 3.1) |
| Background jobs | Run `npm run worker`, or schedule `GET /api/cron` (send `Authorization: Bearer $CRON_SECRET`; set `CRON_SECRET` in prod). Powers review-request emails, birthday rewards, sync jobs, webhook retries |
| Migrations | `npx prisma migrate deploy` against `DIRECT_URL` (the build runs `prisma generate` only) |
| Known limitation | `STORAGE_PROVIDER=local` writes to disk; on serverless hosts uploads fail until the S3 driver ships (SYSTEM-DESIGN §14, Sprint 4). Merchants can paste externally-hosted media URLs everywhere media is accepted |

## 2. Merchant workspace

1. **Create**: `/signup` creates the user (role OWNER) and the Brand (the tenant). Rate limited per IP.
2. **Profile**: Settings → Edit workspace: store name, primary domain, currency. The onboarding wizard at `/dashboard/onboarding` walks merchants through the same steps this guide automates.
3. **Team**: Settings → Team (owner-only): invite MANAGER (runs modules) or STAFF (moderates content).
4. **API key**: Settings → API keys → Create. Shown once, format `avk_…`, stored as SHA-256. All `/api/v1/*` calls use `Authorization: Bearer avk_…`.

## 3. Connect the store (pick the merchant's platform)

All connectors normalize into the same models; orders from any source flow
through one ingest pipeline that fires loyalty, cashback, referrals, review
requests, analytics, webhooks and marketing destinations automatically.

### 3.1 Shopify

**Path A, Admin API token (works on every deploy):**
1. Merchant's Shopify admin → Settings → Apps and sales channels → Develop apps → Create an app (name it Avori).
2. Configuration → Admin API integration → grant read access to Products, Customers, Orders → Save.
3. Install app → copy the Admin API access token (`shpat_…`, shown once).
4. Avori → Settings → Integrations → Shopify → enter `store.myshopify.com` + token → Connect. The token is verified against `shop.json` before saving; the first sync queues automatically. Re-sync anytime with "Sync now".

**Path B, one-click OAuth (needs platform keys, section 1):** merchant enters their domain, approves the OAuth screen, callback verifies HMAC and signed state, first sync queues, `orders/create` webhooks stream in real time.

### 3.2 WooCommerce

**Recommended, the plugin:** download `/downloads/avori-connect.zip` (also linked in Settings → Integrations and onboarding). WordPress → Plugins → Add New → Upload. In the plugin settings paste App URL, `{brandId}` and an API key. The plugin embeds the widget automatically (product-aware on product pages) and pushes orders on checkout and status changes with idempotent `woo-<id>` external ids.

**Alternative, REST keys:** WooCommerce → Settings → Advanced → REST API → create Read keys; connect in Avori → Settings → Integrations → WooCommerce. Inbound Woo webhooks are HMAC-verified.

### 3.3 Magento / Adobe Commerce

REST integration (guide also at `/help/connect-magento`):
1. Create an Avori API key; store it in Magento config, never frontend code.
2. Order observer (`sales_order_place_after`) POSTs to `/api/v1/orders` with `externalId: "magento-<increment_id>"` for idempotency.
3. Widget snippet in the theme footer (section 4).

### 3.4 BigCommerce

REST integration (guide at `/help/connect-bigcommerce`):
1. Create an Avori API key.
2. Storefront → Script Manager → create script, location Footer, all pages → paste the widget snippet.
3. Webhook `store/order/created` → your middleware → POST `/api/v1/orders` with `externalId: "bc-<order_id>"`.

### 3.5 Headless / custom sites

Everything is API-first. Push orders server-side:

```bash
curl -X POST $BASE/api/v1/orders \
  -H "Authorization: Bearer avk_..." -H "Content-Type: application/json" \
  -d '{
    "email": "maya@example.com",
    "externalId": "order-1042",
    "items": [{ "sku": "GLOSS-01", "name": "Golden Hour Gloss", "quantity": 1, "price": 19 }]
  }'
```

Products and customers: `GET/POST /api/v1/products`, `GET/POST /api/v1/customers`.

## 4. Storefront installation

**Widget (no code beyond one paste), before `</body>`:**

```html
<script src="{APP_URL}/widget.js" async></script>
<div class="shop-video-widget" data-brand-id="{brandId}" data-mode="floating"></div>
```

Attributes: `data-mode` = `inline` | `floating` | `feed` (video) or `gallery`
(UGC wall); `data-product-id` scopes video/UGC targeting to one product page;
`data-theme` = `auto` | `light` | `dark`; `data-api` overrides the API origin.
Shopify (ScriptTag/theme) and the WordPress plugin inject this automatically.

**SDK (custom UIs):**

```html
<script src="{APP_URL}/sdk.js" async></script>
<script>
  window.avoriReady = function (Avori) {
    Avori.init({ brandId: "{brandId}" });
    Avori.widget({ mode: "floating" });          // mount the widget
    Avori.reviews("product_id").then(render);     // reviews + ratings JSON
    Avori.ugc("product_id").then(render);         // curated UGC JSON
    Avori.socialFeed().then(render);              // social gallery JSON
    Avori.openQuiz("quiz-slug");                  // hosted quiz in a modal
    Avori.openShadeAnalyzer();                    // hosted analyzer in a modal
    Avori.track("CTA_CLICK", { productId: "…" }); // custom events
  };
</script>
```

**Verification:** every widget impression records the installing domain;
onboarding's "Put Avori on your storefront" step flips to done once a real
domain loads it. Public JSON is served CORS-open from
`/api/public/brand/{brandId}/…` and never includes unpublished content.

## 5. Solution-by-solution setup

Each dashboard module page carries this same guidance in-product (collapsible
"Set up" panel with the merchant's real snippet and URLs).

### Customer trust

**Reviews** — needs orders flowing (section 3) for Verified badges.
Dashboard → Reviews → Settings: request delay days, requests on/off,
auto-publish minimum rating (6 = never). Moderate from the Pending tab;
replies publish under the review. Approved review media auto-feeds the UGC
gallery. Storefront: widget, or
`GET /api/public/brand/{brandId}/reviews?productId=…` (includes ratings
breakdown). Submit from anywhere: `POST /api/v1/reviews` (server) or the
public submit endpoint (rate-limited). Q&A: questions arrive on the Q&A tab;
published answers serve with the reviews JSON.

**UGC Gallery** — Dashboard → UGC Gallery → approve items (auto-collected
pending from approved reviews; "Import from reviews" backfills), tag
products, credit customers. Storefront: `data-mode="gallery"` renders the
shoppable wall with a lightbox; JSON at `GET /api/v1/ugc` and
`/api/public/brand/{brandId}/ugc?productId=…`.

**Shoppable Video** — Dashboard → Videos → upload/paste a vertical video,
tag products with frame timing (hotspots appear exactly then), optionally
target specific product pages. Storefront: widget modes `inline`, `floating`,
`feed`; feed JSON at `/api/public/brand/{brandId}/videos?productId=…`.
Beauty products with try-on metadata get a camera try-on button.

**Social Feed** — Dashboard → Social Feed → add posts (media URL, caption,
permalink), tag products, toggle visibility. Serve via `GET /api/v1/social`
or the public social endpoint.

### AI personalization (requires `ANTHROPIC_API_KEY` on the deploy)

**AI Shade Analyzer** — tag products with shade metadata (Products page),
then share the hosted page `/s/{brandId}` (camera-ready, zero code) or open
it from the SDK. Custom builds: `POST /api/v1/shade/analyze` with the image.
Results recommend from the merchant's catalog; email capture attaches the
profile to the customer record.

**Quizzes** — Dashboard → Quizzes → create, add questions, weight answers
toward products, publish (validates end-to-end). Hosted page:
`/q/{brandId}/{slug}`; SDK modal `Avori.openQuiz(slug)`; headless submit
`POST /api/v1/quizzes/{slug}`. Results page shows recommendations first,
email capture second; responses and leads land under the quiz.

### Average order value

**Bundles** — create one of four types (Frequently Bought Together, Buy X
Get Y, mix & match, quantity discounts) with per-item roles and pricing.
Cart logic reads `GET /api/v1/bundles`.

**Upsells** — create offers per placement (product page, cart, checkout,
post-purchase) with targeting. Serve and record outcomes via
`GET/POST /api/v1/upsells`; accepted upsells attribute revenue to the offer.

**Free Gifts** — set spend threshold + gift product + campaign window. Cart
calls `POST /api/v1/gifts/eligible` as items change; show the
"$X away from your gift" progress it returns.

**Discounts** — create campaigns with codes, schedules, usage caps. Checkout
validates through `POST /api/v1/discounts/validate` (returns eligibility and
value; enforces every rule).

### Retention

**Loyalty** — Dashboard → Loyalty: earn rate, signup/review/birthday
bonuses, tiers with multipliers, rewards catalog. Points accrue automatically
on every ingested order. Balances and redemptions: `GET/POST /api/v1/loyalty`.
Birthday rewards run from the job scheduler (section 1).

**Cashback** — configured with the loyalty program (tier-based percentage);
paid orders post store credit automatically at ingest, visible on the
customer ledger.

**Store Credit** — one ledger for refunds, cashback, rewards and manual
adjustments. Refund-to-credit is one click on the order view; balances ride
the customer endpoints for checkout debits.

**Gift Cards** — issue from Dashboard → Gift Cards (or API), deliver the
code, redeem atomically with `POST /api/v1/giftcards/redeem`.

**Referrals** — configure advocate/friend rewards, issue links per advocate
(customer, employee or influencer). Record clicks server-side with
`POST /api/v1/referrals/track`; conversions match at order ingest and pass
fraud checks (self-referral, repeat-IP) before store credit pays out.

### Intelligence

**Surveys** — create NPS or custom surveys; collect via
`POST /api/v1/surveys/{id}/respond` from email or storefront; AI summary
button condenses responses; CSV export available.

**Analytics** — no setup: widget/SDK/hosted pages report automatically;
server events via `POST /api/v1/events` and the public events endpoint.
Dashboards show funnel + per-module revenue attribution.

**AI Assistant** — no setup beyond the platform key; chat is grounded in the
merchant's live store data; scheduled insight digests run through the job
queue.

## 6. Outbound integrations

**Webhooks** — Settings → Webhooks → add endpoint + secret. Events:
`order.created`, `order.updated`, `order.refunded`, `review.created`,
`review.approved`. Deliveries are HMAC-signed (verify with the endpoint
secret), retried with backoff, and logged per delivery.

**Marketing destinations** — Settings → Marketing destinations: GA4
(Measurement Protocol), Klaviyo, Meta Conversions API, Attentive. Connected
destinations receive purchase/signup/review events from every order source
automatically.

## 7. Go-live checklist

- [ ] Store connected (integration shows CONNECTED, "Sync now" reports counts)
- [ ] Products visible under Dashboard → Products
- [ ] Test order ingested (`POST /api/v1/orders` or a real checkout) and visible under Orders, with loyalty points on the customer
- [ ] Widget loaded on the storefront (onboarding step 3 shows done; impressions appear in Analytics)
- [ ] At least one module live: a published review, an active video, an approved UGC item, or a published quiz
- [ ] Webhook endpoint receiving `order.created` (if the merchant integrates outward)
- [ ] Cron/worker running (review requests and birthday rewards depend on it)

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Shopify rejected that token" | Custom app not installed, or token missing read scopes; reinstall the app and re-copy the token |
| "Could not reach *.myshopify.com (404)" | Domain typo; must be the `*.myshopify.com` domain, not the custom domain |
| Widget renders nothing | No published content for that mode (e.g. gallery with zero approved UGC); check the module page. The widget fails silent by design |
| Media URLs 404 on serverless | Local-disk uploads don't persist there; use external media URLs until the S3 driver lands |
| Review requests never send | Worker/cron not running, or requests disabled in Review settings |
| Public API 429 | Per-IP rate limits on public endpoints; server-to-server traffic belongs on `/api/v1` with a key |
| AI buttons missing/disabled | `ANTHROPIC_API_KEY` not set on the deploy; features degrade gracefully by design |

Related reading: [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md) (architecture and
roadmap), [LOCAL-DEV.md](./LOCAL-DEV.md) (running locally), `/docs` on the
deployed site (endpoint reference), `/help` (merchant-facing articles).
