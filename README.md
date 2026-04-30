# Avori — Shoppable video MVP

Tolstoy-style embeddable shoppable video platform. Brands upload short vertical videos, tag products inside each frame, and drop a one-line embed onto any website. Three widget modes: inline, floating bubble, and TikTok-style feed.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- **Auth.js v5** (credentials provider)
- **Vanilla TS embed widget** bundled with esbuild

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# edit DATABASE_URL and AUTH_SECRET (generate with: openssl rand -base64 32)

# 3. Database
npm run prisma:migrate -- --name init
npm run db:seed

# 4. Build the embed widget
npm run widget:build

# 5. Run dev server
npm run dev
```

Open <http://localhost:3000>.

### Seeded credentials

| Role  | Email              | Password      |
|-------|--------------------|---------------|
| Admin | admin@avori.dev    | password123   |
| Brand | demo@avori.dev     | password123   |

The seed also creates a demo brand with 3 products and 1 video that has 3 hotspot tags. The seed prints the demo `brandId` and a ready-to-use embed snippet.

## Storage providers

`STORAGE_PROVIDER=local` writes to `./public/uploads/` and is the default.

To swap to S3 / R2 / Mux / Uploadcare, implement the interface in `src/lib/storage/index.ts` and uncomment the matching `case` in the `storage()` factory. Stub locations are marked with `// case '...':`.

## Embed snippet

```html
<script src="https://your-domain.com/widget.js" async></script>
<div
  class="shop-video-widget"
  data-brand-id="YOUR_BRAND_ID"
  data-mode="floating"></div>
```

`data-mode` accepts `inline`, `floating`, or `feed`. Optional: `data-api="https://your-domain.com"` overrides the default (the script's own origin).

The widget is single-file, no framework deps, ~10 KB minified. It tracks four event types (`IMPRESSION`, `VIEW`, `TAG_CLICK`, `CTA_CLICK`) via `navigator.sendBeacon`.

### Local widget testing

After `npm run widget:build`, open <http://localhost:3000/demo.html>, replace `REPLACE_WITH_BRAND_ID` with the brand ID printed by the seed script, and refresh.

## Project layout

```
prisma/
  schema.prisma            # 7 models, all relationships
  seed.ts                  # admin + demo brand + sample data
public/
  widget.js                # built embed bundle (gitignored)
  uploads/                 # local file storage (gitignored)
  demo.html                # standalone test storefront
widget-src/
  widget.ts                # embed widget source
src/
  middleware.ts            # protects /dashboard /admin
  lib/
    auth.ts                # Auth.js + requireBrand / requireAdmin
    prisma.ts              # singleton client
    ratelimit.ts           # in-memory token bucket
    storage/               # provider interface + local impl
    validation.ts          # zod schemas
    http.ts                # response helpers
  components/              # shared React UI
  app/
    page.tsx               # marketing landing
    (auth)/                # login, signup
    dashboard/             # brand-scoped UI
    admin/                 # admin UI
    api/
      auth/[...nextauth]
      signup
      brand/               # session-protected, brand-scoped
      admin/               # admin-only
      public/              # CORS-open, used by widget
```

## API surface

### Brand (session-protected, scoped to caller's `brandId`)

| Method | Route                                              |
|--------|----------------------------------------------------|
| GET POST | `/api/brand/products`                             |
| GET PATCH DELETE | `/api/brand/products/:id`                  |
| GET POST | `/api/brand/videos`                               |
| GET PATCH DELETE | `/api/brand/videos/:id`                    |
| GET POST | `/api/brand/videos/:id/tags`                      |
| PATCH DELETE | `/api/brand/videos/:id/tags/:tagId`           |
| POST | `/api/brand/upload` (multipart: file + kind)          |
| GET PATCH | `/api/brand/me`                                  |
| GET | `/api/brand/analytics`                                |

### Admin (role=ADMIN required)

| Method | Route                                |
|--------|--------------------------------------|
| GET | `/api/admin/brands`                     |
| PATCH | `/api/admin/brands/:id` `{disabled}`  |
| GET | `/api/admin/videos`                     |
| PATCH | `/api/admin/videos/:id` `{disabled}`  |
| GET | `/api/admin/products`                   |

### Public (CORS-open, used by widget; rate-limited per IP)

| Method | Route                                                  |
|--------|--------------------------------------------------------|
| GET | `/api/public/brand/:brandId/videos` — only ACTIVE, non-disabled |
| POST | `/api/public/events` — IMPRESSION / VIEW / TAG_CLICK / CTA_CLICK |

## Security model

- Session check on every brand/admin route via `requireBrand()` / `requireAdmin()`
- Every brand query filters on `brandId` from the session — no cross-tenant access
- File uploads: MIME + extension + size validation, sanitized filenames (`crypto.randomUUID()`)
- Public endpoints filter to `status=ACTIVE && !disabled` for brand, video, and product
- Public event endpoint: per-IP rate limit (`EVENT_RATE_LIMIT` env var, default 120/min)
- Zod validation at every write boundary

## What's intentionally NOT in this MVP

- Livestreaming
- AI try-on (planned later, not in scope)
- Creator marketplace
- Personalization beyond brand-level
- Custom CDN / signed URLs (storage provider stubs are where you'd add them)
- Email verification / OAuth providers (extend Auth.js config in `src/lib/auth.ts`)

## Deploy notes

- The widget bundle is served from `/widget.js` and must be rebuilt (`npm run widget:build`) before deploy.
- `serverActions.bodySizeLimit` is set to 200MB in `next.config.mjs` to accommodate video uploads. Tighten for production.
- For production storage, switch `STORAGE_PROVIDER` and implement the corresponding provider in `src/lib/storage/`.
- Default rate limiter is in-memory; replace with Redis/Upstash for multi-instance deployments.

## Useful commands

```bash
npm run dev              # Start dev server
npm run build            # Production build (Next + Prisma)
npm run prisma:studio    # Browse the database
npm run prisma:migrate   # Create / apply migrations
npm run db:seed          # Re-run seed
npm run widget:build     # Rebuild /public/widget.js
```
