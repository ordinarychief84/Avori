# Avori System Design & Hardening Plan

Senior architecture review of the Avori codebase as of 2026-07-04.
Prepared as: current-state audit, target architecture, endpoint map, data model,
security plan, and a sprint-by-sprint implementation plan.

Ground rule applied throughout: **the existing architecture is sound; do not rebuild.**
Improvements below are targeted diffs against working code.

---

## 1. Current Codebase Audit

Measured from the repository (not aspirational):

| Surface | Count | Notes |
|---|---|---|
| API route files | 98 | 56 brand-scoped, 16 REST `/api/v1`, 10 public widget, 8 connector, 5 admin, auth/signup/cron |
| Prisma models | 48 | 30 enums; every tenant-owned model carries `brandId` |
| Dashboard pages | 30 | All modules have management UIs |
| Marketing/hosted pages | 12+ | Landing, pricing, help, docs, hosted quiz `/q`, hosted shade `/s` |
| E2E tests | 4 bash suites | Includes a dedicated cross-tenant isolation suite |

### 1.1 Already built (keep, verified working)

- **Multi-tenant core.** `Brand` is the tenant. Every query path goes through
  `requireBrand()` (session), `requireApiKey()` (hashed bearer key), or an
  explicit `brandId` route param on public widget endpoints. A grep across all
  56 brand routes shows zero routes missing tenant scoping (the one flagged
  file, `upload`, authenticates but has no DB access).
- **Connectors.** Shopify (OAuth + HMAC callback verification + HMAC webhooks +
  full sync), WooCommerce (REST-key connector + HMAC webhooks + **installable
  WordPress plugin** that embeds the widget and pushes orders), Magento and
  BigCommerce via documented REST-API guides, headless via `/api/v1` +
  `/sdk.js`, and the one-line `widget.js` snippet.
- **Order ingest spine.** `src/lib/orders.ts#ingestOrder` is the single
  pipeline for all sources (API, Shopify, Woo, plugin). It upserts the
  customer, writes the order idempotently (`brandId+orderNumber` unique,
  connector `externalId` dedupe), then fans out: loyalty earn, cashback,
  referral conversion with fraud checks, discount usage, review-request jobs,
  analytics event, outbound webhooks, marketing destinations.
- **Modules.** Reviews (text/photo/video media URLs, verified badge from real
  orders, moderation queue, auto-publish threshold, Q&A, AI summaries, rating
  breakdown, gallery), shoppable video (tags, placement targeting, playlist
  order, per-video stats), social feed, quizzes (weighted scoring, branching,
  publish validation, hosted page, claim flow), surveys/NPS, bundles (4
  types), upsells (4 placements + attribution), discounts, free gifts, gift
  cards, loyalty (points, tiers, signup/review/birthday bonuses, cashback),
  store credit ledger, referrals (customer/employee/influencer + fraud
  flags), shade analyzer (hosted + API + dashboard), AI insights/assistant.
- **Platform plumbing.** Hashed API keys (SHA-256, shown once), outbound
  webhooks (HMAC + quadratic-backoff retries + delivery log), inbound
  signature verification (Shopify base64 HMAC, Woo base64 HMAC), DB-backed job
  queue with atomic claim + backoff (`worker` script + `/api/cron`), audit
  log, per-IP rate limiting on public endpoints, magic-byte upload sniffing
  with size caps, security headers (frame-deny, nosniff, permissions policy,
  scoped CORS), RBAC roles (OWNER/MANAGER/STAFF; owner-gated team routes).

### 1.2 Partially built

| Area | Status | Gap |
|---|---|---|
| Magento / BigCommerce | Docs-guided REST integration | No native OAuth app/extension; acceptable for MVP, revisit at demand |
| Billing | Schema-ready (`Brand.plan`, `stripeCustomerId`) + pricing UI | No Stripe/Shopify Billing flows implemented |
| Media | Local disk (`public/uploads`) behind a storage interface | No S3 driver; no video transcoding/thumbnails |
| Rate limiting | In-memory per-instance | Resets on deploy; not shared across instances |
| Product model | Single-price product | No `ProductVariant` (Shopify sync flattens to first variant) |
| Analytics | Raw `AnalyticsEvent` + live aggregation queries | No session/anonymous IDs, no rollup tables, queries scan raw events |
| Review requests | Scheduled jobs + audit trail | Email transport is a console stub (no provider wired) |
| Tests | E2E bash suites (auth, CRUD, cross-tenant) | No unit tests; suites predate newest modules |

### 1.3 Missing

`ProductVariant`, `MediaAsset` registry, `Subscription` (billing), Redis-backed
rate limiting/queue, request IDs + structured logs, public review-media upload
+ helpful votes, `SyncRun` status/retry surface, per-brand (not just per-IP)
limits on expensive public endpoints, S3 storage driver, alerting.

### 1.4 Security gaps (ranked)

1. **Connector/destination tokens stored plaintext** in `Integration.accessToken`.
   DB compromise leaks Shopify/Klaviyo/Meta tokens. Fix: AES-256-GCM
   application-layer encryption (`ENCRYPTION_KEY` env), encrypt on write,
   decrypt on use (S8.3).
2. **Rate limiter is per-instance memory.** Multi-instance deploys multiply
   limits; restarts reset them. The public shade endpoint (paid vision calls)
   is the costliest exposure. Fix: Redis token bucket + per-brand daily caps.
3. **No request IDs / structured logs** for forensics or support.
4. **Public quiz/shade claim endpoints accept any email** (by design for lead
   capture) but should also carry a per-`responseId` one-claim rule (currently
   re-claim overwrites; low risk, add guard).
5. **CSP absent** (other headers present). Add a conservative CSP for
   dashboard pages; widgets stay embeddable.
6. Cron endpoint auth is optional when `CRON_SECRET` unset (fine locally,
   must be set in prod; add startup warning).

### 1.5 Refactor risks

- `validation.ts` is one large file; safe, but split only when touched.
- `Brand` doubles as merchant+store (see S5); splitting now would churn 100+
  files for zero user value. Add `Store` only when a merchant genuinely needs
  multiple storefronts under one login.
- The public widget endpoints and `/api/v1` intentionally duplicate read
  shapes; keep, they serve different auth contexts.

---

## 2. Executive Summary

Avori is a multi-platform commerce experience SaaS: one dashboard, one
customer database, and one event pipeline powering trust (reviews, Q&A, UGC,
shoppable video), AOV growth (bundles, upsells, gifts, discounts), and
retention (loyalty points, store credit, cashback, gift cards, referrals,
birthday rewards), plus AI personalization (quiz + shade analysis). The
backend must remain platform-neutral: Shopify is one connector among five
integration surfaces, never an assumption.

---

## 3. Core Architecture

Deployment shape: **modular monolith** on Next.js App Router (correct for this
stage; services below are module boundaries inside one deployable, extractable
later without API changes).

| Service (module) | Lives at | State |
|---|---|---|
| Merchant dashboard | `src/app/dashboard/*` + `/api/brand/*` | Built |
| Public widget/SDK | `public/widget.js`, `public/sdk.js`, `/api/public/brand/*` | Built |
| Shopify connector | `src/lib/connectors/shopify.ts` + `/api/integrations/shopify/*` | Built |
| WooCommerce connector | `.../woocommerce.ts` + routes + `integrations/wordpress/` plugin | Built |
| Magento / BigCommerce | REST guides + `/api/v1` | Guide-level |
| Headless API | `/api/v1/*` (16 route files) | Built |
| Review + Q&A service | `src/lib/reviews.ts` | Built |
| Video commerce | video routes + widget | Built |
| Social feed | social routes | Built (manual + API; IG/TikTok import deferred) |
| Bundle / Upsell | bundle + upsell routes | Built |
| Loyalty / credit / referral | `loyalty.ts`, `credit.ts`, `referrals.ts` | Built |
| Analytics | `events.ts` + dashboard pages | Built (rollups pending) |
| Webhook processor | `webhooks.ts` + `jobs.ts` | Built |
| Media service | `storage/` (local driver) | S3 driver pending |
| Notification service | console transport stub | Provider pending |
| Billing service | schema + pricing UI | Flows pending |
| Admin service | `/admin` + `/api/admin/*` | Built (basic) |
| Marketing destinations | `connectors/destinations.ts` (GA4/Klaviyo/Meta/Attentive) | Built |

Async work: DB-backed `Job` queue (atomic claim, retries, backoff), executed
by `npm run worker` or `/api/cron`. Add Redis + BullMQ only when job volume or
multi-instance deploys demand it; the interface (`enqueueJob`) already
isolates callers from the queue implementation.

---

## 4. Multi-Platform Connector Architecture

Shared contract (all connectors): normalize into `ingestOrder` /
`Customer.upsert` / product upsert with `externalId` idempotency; store
connection state on `Integration` (per-brand, per-provider unique); surface
status + "Sync now" in Settings; verify every inbound webhook signature.

| Platform | Auth | Sync | Real-time | Widget | Billing |
|---|---|---|---|---|---|
| Shopify | OAuth (HMAC-verified callback, signed state) | REST Admin API pull | HMAC webhooks `orders/create` | ScriptTag or theme snippet | Shopify Billing API (S-billing sprint) |
| WooCommerce | Plugin (Brand ID + API key) or REST keys | Connector pull | Plugin push on order events + HMAC webhooks | Plugin auto-embeds (product-aware) | Stripe |
| Magento | Avori API key in Magento config | Order observer → `/api/v1/orders` | Observer push | Theme footer snippet | Stripe |
| BigCommerce | Avori API key + store webhook → middleware | Webhook push | `store/order/created` | Script Manager entry | Stripe |
| Headless/custom | Hashed bearer API key (server-side) | `/api/v1` push | Client's choice | `sdk.js` / snippet / JSON endpoints | Stripe |

Upgrade path (post-MVP): native BigCommerce OAuth app and Magento marketplace
extension following the Shopify connector file layout one-to-one.

---

## 5. Multi-Tenant Data Model

Existing vocabulary maps to the requested one; **do not rename working
models**, extend them:

| Requested | Existing | Action |
|---|---|---|
| merchant + store | `Brand` (tenant) | Keep unified; introduce `Store` only for multi-storefront merchants later |
| platform_connection | `Integration` | Keep; add token encryption + `config Json` (done) |
| user / role / permission | `User.role` + `User.brandRole` (OWNER/MANAGER/STAFF) | Keep enum RBAC; permission table deferred |
| product / variant | `Product` | **Add `ProductVariant`** (S7 schema) |
| customer / order / order_item | `Customer` / `Order` / `OrderItem` | Keep |
| review / review_media / Q&A | `Review` (+`mediaUrls[]`) / `ProductQuestion` | Add `ReviewVote`; media URLs stay array + `MediaAsset` registry |
| video / tags | `Video` / `VideoProductTag` | Keep |
| social | `SocialAccount` / `SocialPost` | Keep |
| bundle / upsell | `Bundle`+`BundleItem` / `UpsellOffer` | Keep |
| loyalty wallet / transactions | `LoyaltyMember`+`PointsTransaction` and `CreditAccount`+`CreditTransaction` | Keep (points and money deliberately separate ledgers) |
| referral | `Referral`+`ReferralEvent` (+kind) | Keep |
| widget / settings | `WidgetInstall` + `Brand.settings` | Keep |
| analytics_events | `AnalyticsEvent` | Extend: `sessionId`, `anonymousId`; add `DailyMetric` rollup |
| subscription | — | **Add `Subscription`** |
| audit log / api key | `AuditLog` / `ApiKey` | Keep |
| webhooks / attempts | `WebhookEndpoint` / `WebhookDelivery` | Keep (delivery = attempt log); add `SyncRun` |
| media_assets | — | **Add `MediaAsset`** |

Isolation rules (already enforced, keep as review checklist): every read/write
filters by `brandId` derived from auth, never from the request body; child
rows reach tenancy through their parent FK; public endpoints take `brandId`
from the URL path and only expose published content.

---

## 6. Backend API Endpoint Design

Conventions (already in force): JSON in/out; errors `{ "error": string }`;
zod validation on every body; cursor pagination `?limit&cursor` →
`nextCursor`; auth contexts `S` = dashboard session (`requireBrand`), `K` =
hashed API key (`requireApiKey`), `P` = public rate-limited, `A` = admin.

### 6.1 Existing surface (98 routes, grouped)

| Group | Routes (method · path → purpose) |
|---|---|
| Auth | `POST /api/signup` (rate-limited, creates OWNER+Brand) · `[...nextauth]` login/logout/session · invite = `POST /api/brand/team` (owner-only) · role change/remove `PATCH·DELETE /api/brand/team/[id]` |
| Workspace | `PATCH /api/brand/settings` (profile + module settings + onboarded) |
| Connectors | `POST /api/integrations/shopify/install` · `GET .../callback` · `POST .../sync` · `POST .../webhooks` · Woo `connect/sync/webhooks` · `POST·DELETE /api/integrations/marketing` (GA4/Klaviyo/Meta/Attentive verify+connect) |
| Catalog | brand products CRUD + `review-summary`; `GET /api/v1/products` |
| Customers | brand CRUD + `points` + `credit` adjust; `GET·POST /api/v1/customers` |
| Orders | brand list/create/status + `refund-credit`; `POST /api/v1/orders` |
| Reviews/Q&A | moderate/reply/delete; question answer/delete; `GET·POST /api/v1/reviews`; public reviews (+breakdown, Q&A) + question submit |
| Videos | CRUD + tags CRUD; public feed (`?productId` targeting) |
| Social | brand posts CRUD; `GET /api/v1/social`; public feed |
| Quizzes | CRUD + questions CRUD + responses/export; `GET·POST /api/v1/quizzes/{slug}`; public quiz GET/submit/claim; hosted `/q/{brand}/{slug}` |
| Shade | brand analyze; `POST /api/v1/shade/analyze`; public analyze/claim; hosted `/s/{brand}` |
| Surveys | CRUD + responses/export + AI summary; `POST /api/v1/surveys/{id}/respond` |
| AOV | bundles CRUD · upsells CRUD · gifts CRUD · discounts CRUD; `GET /api/v1/bundles` · `GET·POST /api/v1/upsells` · `POST /api/v1/gifts/eligible` · `POST /api/v1/discounts/validate` |
| Loyalty | program/tiers/rewards CRUD + members; `GET·POST /api/v1/loyalty` (balance/redeem); gift cards create/status + `POST /api/v1/giftcards/redeem` |
| Referrals | program PATCH · issue (customer or advocate email+kind); `POST /api/v1/referrals/track` |
| Events | `POST /api/public/events` (widget) · `POST /api/v1/events` |
| Platform | API keys create/revoke · webhook endpoints CRUD + deliveries · AI chat/insights · contact form · cron |
| Admin | brands/products/videos list + disable |

### 6.2 Missing endpoints to add (full spec)

| # | Method · Path | Auth | Purpose / body → response | Security notes |
|---|---|---|---|---|
| 1 | `POST /api/public/brand/{id}/reviews/{reviewId}/helpful` | P | body `{}` → `{helpfulCount}` | 5/min/IP; one per IP hash per review (Redis set) |
| 2 | `POST /api/public/brand/{id}/uploads/review-media` | P | multipart image (≤5MB) → `{url}` | Reuse sniffer; images only; 3/min/IP; quarantine flag on `MediaAsset` |
| 3 | `GET /api/brand/sync/status` + `POST /api/brand/sync/retry` | S | list `SyncRun`s → retry enqueues job | Owner/Manager |
| 4 | `POST /api/v1/media/sign` | K | `{kind,contentType,bytes}` → presigned S3 PUT + `mediaId` | Validate type/size before signing; keys never exposed |
| 5 | `POST /api/v1/media/{id}/confirm` | K | finalize `MediaAsset` after upload | HEAD-check object exists + size matches |
| 6 | `POST /api/billing/stripe/checkout` | S (owner) | `{plan,period}` → `{checkoutUrl}` | Price IDs server-side only |
| 7 | `POST /api/billing/stripe/webhook` | Stripe sig | subscription lifecycle → `Subscription` upsert | Verify `stripe-signature`; idempotent on event id |
| 8 | `POST /api/billing/shopify/subscribe` + `GET .../confirm` | S (owner) | Shopify `appSubscriptionCreate` → confirm URL → activate | Verify HMAC on return; store charge id |
| 9 | `GET /api/brand/billing` | S | `{plan,period,status,renewsAt}` | — |
| 10 | `POST /api/v1/events/batch` | K | `{events:[≤50]}` → `{accepted}` | Cap array; same enum validation |
| 11 | `GET /api/health` | none | `{ok,db,queueDepth}` | For uptime checks; no tenant data |
| 12 | `POST /api/admin/webhooks/retry` | A | `{deliveryId}` → requeue | Admin-only, audited |

### 6.3 Response/error standard (adopt everywhere, mostly done)

`ok(data, status)` / `fail(error)` stay; add `requestId` to error payloads
once request-ID middleware lands (S12).

---

## 7. Database Schema (Prisma diff)

The 48 existing models stand. Additions:

```prisma
model ProductVariant {
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  title      String            // "30ml / Warm Sand"
  sku        String?
  price      Decimal  @db.Decimal(10, 2)
  externalId String?           // shopify variant id, woo variation id
  inventory  Int?
  options    Json?             // {size:"30ml", shade:"Warm Sand"}
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([productId])
  @@unique([productId, externalId])
}

model MediaAsset {
  id        String   @id @default(cuid())
  brandId   String
  brand     Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  kind      String                 // image | video | review_image | review_video
  url       String
  mime      String
  bytes     Int
  status    String   @default("ready") // pending | ready | quarantined | deleted
  refType   String?                // review | video | product | social
  refId     String?
  createdAt DateTime @default(now())

  @@index([brandId, refType, refId])
}

model Subscription {
  id                 String    @id @default(cuid())
  brandId            String    @unique
  brand              Brand     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  provider           String                  // stripe | shopify
  plan               Plan      @default(FREE)
  period             String    @default("monthly") // monthly | annual
  status             String    @default("active")  // active | past_due | canceled | trialing
  externalId         String?                 // stripe sub id / shopify charge id
  currentPeriodEnd   DateTime?
  canceledAt         DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model SyncRun {
  id         String   @id @default(cuid())
  brandId    String
  provider   IntegrationProvider
  status     JobStatus @default(PENDING)
  stats      Json?                 // {products, customers, orders}
  error      String?
  startedAt  DateTime @default(now())
  finishedAt DateTime?

  @@index([brandId, startedAt])
}

model ReviewVote {
  id       String @id @default(cuid())
  reviewId String
  review   Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  ipHash   String
  createdAt DateTime @default(now())

  @@unique([reviewId, ipHash])
}

// Analytics rollup written by the aggregation job (S11)
model DailyMetric {
  id      String   @id @default(cuid())
  brandId String
  day     DateTime @db.Date
  metric  String            // revenue | orders | video_views | quiz_completions | ...
  value   Decimal  @db.Decimal(14, 2)

  @@unique([brandId, day, metric])
  @@index([brandId, metric, day])
}
```

Field additions: `AnalyticsEvent.sessionId String?`, `AnalyticsEvent.anonymousId String?`
(+ index `[brandId, anonymousId]`); `Review.helpfulCount` exists.
Soft-delete strategy: keep hard deletes for tenant-owned content (GDPR-friendly);
`disabled`/`revokedAt`/`status` flags already cover suspend cases. Migrations:
one `npx prisma migrate dev --name variants_media_billing_rollups`.

---

## 8. Security Design

In place: bcrypt(12) + timing-equalized login, JWT sessions (Auth.js v5),
signed OAuth state, HMAC verification for Shopify/Woo/outbound webhooks,
SHA-256 API keys, RBAC, tenant scoping, zod everywhere, magic-byte upload
sniffing + size caps, per-IP rate limits, security headers, audit log,
`.env` secrets (gitignored), Supabase TLS + encryption at rest, Prisma
parameterized queries (no raw SQL), React-escaped output.

To add, in priority order:

1. **Encrypt connector tokens** (AES-256-GCM helper `src/lib/crypto.ts`; wrap
   `Integration.accessToken` reads/writes; key rotation via versioned prefix).
2. **Redis rate limiting** (shared buckets; per-brand daily caps on shade
   vision; keep in-memory fallback for dev).
3. **CSP** for dashboard/marketing responses; widgets/SDK exempt.
4. **Request IDs** + structured logs (S12) and startup guard: refuse prod
   boot without `CRON_SECRET`, `ENCRYPTION_KEY`, `AUTH_SECRET`.
5. **Media hardening**: S3 driver, randomized keys (done for local), optional
   ClamAV/lambda scan hook on `MediaAsset.status=pending`.
6. **PII/data retention**: customer delete endpoint already cascades; add
   documented export (CSV exists for responses; add customers export).
7. **Backups**: Supabase PITR (enable in dashboard) + weekly logical dump.

Likely attacks → defenses:

| Attack | Defense |
|---|---|
| Tenant ID tampering (IDOR) | brandId from auth context only; cross-tenant e2e suite in CI |
| Stolen API key | Hashed at rest, prefix-identified, one-click revoke, per-key lastUsed |
| Webhook forgery | HMAC verify (timing-safe) on Shopify/Woo/Stripe; generic receivers require per-endpoint secret |
| Widget abuse / scraping | Public endpoints published-content-only + rate limits; no PII ever |
| Vision-endpoint cost abuse | 3/min/IP + per-brand daily Redis cap + image size cap |
| Credential stuffing | Login rate limit per IP+email; equalized timing |
| Malicious upload | Magic-byte sniff, extension rewrite, size caps, sandboxed CSP on `/uploads`, scan hook |
| XSS via reviews/UGC | React escaping; widget renders text nodes only (never innerHTML of user content) |
| CSRF | Auth.js CSRF on auth; SameSite=Lax session; JSON+same-origin for mutations |
| SSRF via webhook URLs | Outbound webhook URLs must be https, public-IP only (add resolver check) |
| Replay of claims | One-claim guard per responseId/profileId (S6.2) |

---

## 9. Storefront Widget & SDK Security

Model (implemented): the browser only ever holds the **public brandId**, never
an API key. `widget.js`/`sdk.js` call `/api/public/brand/{brandId}/…` which
serve *published* content only (active videos, approved reviews, visible
posts, active quizzes) and accept only rate-limited, validated writes (review
submit, question, quiz submit, claims, events). Secret keys stay server-side
on `/api/v1`. One store cannot load another's data because the path brandId is
the only selector and returns nothing non-published; there is no
cross-brand query surface. Event tracking posts `{brandId,type,refs}` with
server-derived domain/IP; `WidgetInstall` records which domains embed which
brand (surfaced during onboarding). Optional upgrade: signed widget configs
(HMAC of brandId+domain) to pin embeds to registered domains, flag when a
brand enables "strict domains" in settings.

---

## 10. Analytics Event System

Event enum already covers the requested taxonomy (IMPRESSION, VIEW,
TAG_CLICK, CTA_CLICK, QUIZ_*, REVIEW_SUBMIT, UPSELL_*, BUNDLE_*,
REFERRAL_CLICK, GIFT_UNLOCKED, SOCIAL_CLICK, SHADE_ANALYSIS, SURVEY_SUBMIT,
ORDER_CREATED). Add:

- `anonymousId` (SDK-generated UUID in localStorage) + `sessionId` (rolling
  30-min) sent by widget/sdk; joined to `customerId` when an email is later
  captured (claim endpoints already link customers).
- **Attribution:** first-touch module attribution per order: at
  `ingestOrder`, look back over the anonymous/session events within 7 days
  for UPSELL_CLICK / QUIZ_COMPLETE / TAG_CLICK / REFERRAL_CLICK and write
  `meta.attribution` on ORDER_CREATED; revenue reports group by it.
- **Dedup:** unique Redis key `evt:{brandId}:{anonId}:{type}:{refId}` with
  10-second TTL drops double-fires.
- **Batching:** `POST /api/v1/events/batch` (≤50).
- **Rollups:** nightly `analytics_rollup` job writes `DailyMetric`; dashboards
  read rollups first, fall back to live queries for today.

---

## 11. Background Jobs

Existing queue handlers: `webhook_retry`, `review_request`,
`birthday_rewards`, `ai_insights`, `shopify_sync`, `woo_sync`. Add handlers:
`analytics_rollup` (nightly), `media_process` (thumbnail/transcode when S3
lands), `social_import` (IG/TikTok when tokens exist), `billing_check`
(daily: expire past-due), `sync_run` wrapper writing `SyncRun` rows. Retry
policy stays exponential (2^n minutes, max 3) with terminal FAILED rows
querying as the dead-letter set (`/api/brand/sync/status` + admin retry).

## 12. Error Handling & Logging

Keep `{error}` + status codes (400/401/403/404/415/429). Add
`src/lib/log.ts`: JSON lines `{ts, level, requestId, brandId?, route, msg,
meta}`; wrap `fail()` to log 5xx with stack + return `requestId`. Request ID =
`crypto.randomUUID()` per request (middleware header `x-request-id`,
propagated to jobs). Alerting: log drain (Vercel/Railway) → error-rate alert;
`/api/health` for uptime pings.

## 13. MVP Scope

**Keep and harden now:** everything in S1.1 plus the S6.2 endpoint list,
token encryption, Redis limits, S3 media, Stripe + Shopify billing, analytics
rollups, request IDs.
**Defer:** deeper AI recommendations, advanced segmentation, email automation
sequences (transactional review-request email is in scope), enterprise
white-label, multi-language, ML fraud scoring (rule-based checks stay),
native Magento/BigCommerce marketplace apps.

## 14. Implementation Plan (recalibrated to actual state)

| Sprint | Work | Notes |
|---|---|---|
| 1 (done) | Audit, schema, routes, tenancy | This document; cross-tenant e2e exists |
| 2 | Token encryption, request IDs, structured logs, startup env guard, health endpoint, prod CSP | Small diffs, high value |
| 3 | Redis rate limiting + per-brand caps; `SyncRun` + sync status/retry UI; SSRF guard on webhook URLs | |
| 4 | S3 media driver + signed uploads (`media/sign`,`confirm`) + `MediaAsset`; public review-media upload + helpful votes; scan hook | |
| 5 | `ProductVariant` + connector variant sync + variant-aware widgets | |
| 6 | Analytics: anonymous/session IDs in SDK, dedup, batch endpoint, attribution, `DailyMetric` rollup + dashboard switch | |
| 7 | Billing: Stripe checkout/webhook/portal, Shopify Billing flow, plan gating middleware (orders/mo, shade quota) | |
| 8 | Notification provider (Resend/Postmark) for review requests + gift-card delivery; email templates | |
| 9 | Unit tests (vitest) for libs (orders, loyalty, referrals, quizzes, shade claim), refreshed e2e, load test on public endpoints, pen-test checklist, beta launch | |

## 15. Code-Level Instructions (for every future change)

Do not duplicate existing pipelines: all order paths call `ingestOrder`; all
points/credit changes go through `addPoints`/`addCredit`; all review writes
go through `submitReview`. New brand routes: `requireBrand()` first line,
zod schema in `validation.ts`, `audit()` on sensitive writes, `ok/fail`
returns. New public routes: rate limit + brand-disabled check + OPTIONS. New
connector: copy the Woo connector file layout. Every schema change ships a
migration in the same commit. Every new lib gets a vitest file (S14-9
onward).

## 16. Final Deliverables Index

- Codebase audit: §1 · Architecture: §3–4 · Endpoint map: §6 · Schema: §7
- Security checklist: §8 · Connector checklist: §4 · Widget security: §9
- Missing features: §1.3 + §6.2 · Refactor plan: §1.5 · Implementation: §14
- Testing plan: §14-9 · Deployment checklist: env guard (S8.4), Supabase PITR,
  `CRON_SECRET` + scheduler on `/api/cron`, `NEXT_PUBLIC_APP_URL` set,
  Shopify/Stripe keys, S3 bucket + `ENCRYPTION_KEY` in secret manager.
