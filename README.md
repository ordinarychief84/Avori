# Avori — Commerce Experience OS

One platform for the entire customer experience layer of an ecommerce store. Avori replaces the stack of single-purpose apps (reviews, loyalty, referrals, quizzes, video, upsells, …) with a single multi-tenant system: **one dashboard, one customer database, one analytics engine, one AI layer**.

## Modules

| Area | Modules |
|---|---|
| Commerce | Customers (unified DB) · Orders (ingest pipeline) · Products |
| Engage | Shoppable Videos + embeddable widget · Reviews & Q&A · Instagram/Social feed · Product Quizzes (conditional logic) · Surveys (NPS/CSAT) · **AI Shade Analysis** |
| Grow | Loyalty (points, VIP tiers, rewards) · Referrals (with fraud protection) · Gift cards & store credit · Discounts · Bundles (FBT/BXGY/Mix&Match/Volume) · Free gifts · Upsells & cross-sells |
| Intelligence | Unified analytics · AI insights · AI assistant |
| Platform | REST API + API keys · Outbound webhooks (HMAC) · Background jobs · Audit log · Team roles · Shopify connector |

Every module writes to the same customer record and the same event stream — an order ingested once triggers loyalty earn, referral conversion (with self-referral/repeat-IP fraud checks), review-request scheduling, analytics and webhooks automatically.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma** (multi-tenant: every row is brand-scoped)
- **Auth.js v5** (credentials) with workspace roles (owner / manager / staff)
- **Anthropic Claude** (`claude-opus-4-8`) for the AI layer — optional, degrades gracefully
- **Vanilla TS embed widget** bundled with esbuild

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# edit DATABASE_URL and AUTH_SECRET (generate with: openssl rand -base64 32)

# 3. Database
npx prisma migrate deploy
npm run db:seed

# 4. Build the embed widget
npm run widget:build

# 5. Run
npm run dev       # app on http://localhost:3000
npm run worker    # background jobs (review requests, webhook retries, syncs)
```

### Seeded credentials

| Role  | Email            | Password    |
|-------|------------------|-------------|
| Admin | admin@avori.dev  | password123 |
| Brand | demo@avori.dev   | password123 |

The seed creates a full demo store: 20 customers, 60 orders across 90 days, reviews awaiting moderation, an active loyalty program with tiers, a referral with a flagged self-referral, a live quiz, an NPS survey, bundles, discounts, gift + upsell campaigns, social posts, shade profiles — and a local demo API key: `avk_demo_1234567890abcdef`.

## REST API (`/api/v1`)

Authenticate with `Authorization: Bearer <api key>` (create keys in Settings → API keys; hashed at rest, shown once). This is how custom storefronts and server integrations talk to Avori.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/products` | Catalog with rating summaries |
| GET/POST | `/api/v1/customers` | Fetch by email / upsert |
| POST | `/api/v1/orders` | **Order ingestion** — feeds loyalty, referrals, analytics, review requests, webhooks. Supports `referralCode` and `upsellOfferId` attribution |
| GET/POST | `/api/v1/reviews` | Approved reviews + summary / submit a review |
| GET/POST | `/api/v1/loyalty` | Balance, tier, history, rewards / redeem a reward |
| POST | `/api/v1/discounts/validate` | Validates discount codes, reward codes **and** gift cards |
| POST | `/api/v1/giftcards/redeem` | Apply gift card balance at checkout |
| POST | `/api/v1/referrals/track` | Record a referral link click |
| GET/POST | `/api/v1/quizzes/:slug` | Fetch quiz / submit answers → product recommendations + lead capture |
| POST | `/api/v1/surveys/:id/respond` | Submit a survey response |
| GET/POST | `/api/v1/upsells` | Offers for a placement / click tracking |
| GET | `/api/v1/bundles` | Active bundles (optionally per product) |
| POST | `/api/v1/gifts/eligible` | Which gifts a cart unlocks + next-threshold progress |
| POST | `/api/v1/shade/analyze` | AI photo analysis → shade profile + matching products |
| GET | `/api/v1/social` | Shoppable social gallery |
| POST | `/api/v1/events` | Generic analytics ingestion |

Example:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer avk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","items":[{"sku":"AV-GH-006","name":"Golden Hour Gloss","quantity":1,"price":19}],"referralCode":"MAYA-4XKP"}'
```

## Storefront widget (no API key)

The embeddable widget serves shoppable video (inline / floating bubble / feed modes) with product hotspots and AI try-on:

```html
<script src="https://your-domain.com/widget.js" async></script>
<div class="shop-video-widget" data-brand-id="YOUR_BRAND_ID" data-mode="floating"></div>
```

CORS-open, rate-limited widget endpoints also serve reviews (`/api/public/brand/:brandId/reviews?productId=…`), question submission, and the social gallery for custom storefront components.

## Webhooks

Register endpoints in Settings → Webhooks. Deliveries are JSON, signed with `X-Avori-Signature` (HMAC-SHA256 of the body with your endpoint secret), retried with quadratic backoff. Topics include `order.created`, `order.updated`, `review.created`, `review.approved` — empty topic list receives everything.

## Background jobs

DB-backed queue (`Job` table). Handlers: `review_request` (post-purchase review emails), `webhook_retry`, `birthday_rewards`, `ai_insights`, `shopify_sync`.

- Local: `npm run worker`
- Serverless: schedule `GET /api/cron` (protect with `CRON_SECRET`)

## Integrations

**Shopify** (first-class): set `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` from a Shopify Partner app, then connect from Settings → Integrations. OAuth install, webhook HMAC verification, and product/customer/order sync into the unified models. The connector interface in `src/lib/connectors/` is the template for WooCommerce/BigCommerce/Magento. **Custom platforms** integrate today via the REST API above.

## AI layer

Set `ANTHROPIC_API_KEY` to enable — everything degrades gracefully without it:

- **AI assistant** — chat grounded in live store data
- **Insights** — generated recommendations on the Analytics page
- **Review summaries** — cached per product, served in the reviews widget
- **Survey summaries** — themes + actions from responses
- **Shade analysis** — Claude vision maps a customer photo to skin tone/undertone/season and matches tagged products (tag tones on each product's edit form)

## Security model

- Every query filters on `brandId` from the session or API key — no cross-tenant access
- API keys stored as SHA-256 hashes; shown once at creation; revocable
- Webhook payloads HMAC-signed; Shopify callbacks and webhooks HMAC-verified; OAuth state signed
- Zod validation at every write boundary; public endpoints rate-limited per IP
- Audit log on sensitive actions (moderation, keys, team, settings)
- Login throttling + timing-equalized password checks

## Project layout

```
prisma/schema.prisma       # ~45 models — full commerce data model
src/lib/                   # service layer
  orders.ts                #   order ingest pipeline (the cross-module spine)
  loyalty.ts credit.ts referrals.ts reviews.ts
  ai.ts                    #   Anthropic integration (assistant, insights, vision)
  apikey.ts webhooks.ts jobs.ts audit.ts events.ts
  connectors/shopify.ts    #   OAuth + HMAC + sync
src/app/dashboard/         # merchant dashboard (20 modules)
src/app/api/brand/         # session-scoped dashboard API
src/app/api/v1/            # API-key REST API for storefronts
src/app/api/public/        # CORS-open widget endpoints
src/app/api/cron           # job runner tick
widget-src/widget.ts       # embeddable storefront widget
scripts/worker.ts          # local job worker
```

## Useful commands

```bash
npm run dev              # Start dev server
npm run worker           # Background job worker
npm run build            # Production build
npm run prisma:studio    # Browse the database
npm run prisma:migrate   # Create / apply migrations
npm run db:seed          # Seed demo data (idempotent)
npm run widget:build     # Rebuild /public/widget.js
./test/run-all.sh        # E2E test suite
```
