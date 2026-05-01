# Avori — Local Dev Quick Reference

## Seeded accounts

| Role  | Email              | Password      | Lands on    |
|-------|--------------------|---------------|-------------|
| Admin | `admin@avori.dev`  | `password123` | `/admin`    |
| Brand | `demo@avori.dev`   | `password123` | `/dashboard`|

> Both seeded by `prisma/seed.ts`. Hash cost is **12** (bumped from 10 in the audit pass).

## Key URLs

| Page              | URL                                      |
|-------------------|------------------------------------------|
| Login             | http://localhost:3000/login              |
| Signup            | http://localhost:3000/signup             |
| Admin home        | http://localhost:3000/admin              |
| Brand dashboard   | http://localhost:3000/dashboard          |
| Products list     | http://localhost:3000/dashboard/products |
| Videos list       | http://localhost:3000/dashboard/videos   |
| Analytics         | http://localhost:3000/dashboard/analytics|
| Embed snippet     | http://localhost:3000/dashboard/embed    |
| Public widget demo| http://localhost:3000/demo.html          |
| Marketing landing | http://localhost:3000                    |

## Seeded data

- **Brand**: `Demo Brand` (slug `demo-brand`, domain `localhost`)
- **Products**:
  - `seed-prod-1` — Iced Latte Lip Balm — $18.00 — *try-on enabled (LIPSTICK, #C44569)*
  - `seed-prod-2` — Espresso Body Mist — $32.00
  - `seed-prod-3` — Matcha Hand Cream — $24.00
- **Video**: `seed-video-1` — "Spring drop — coffee bar" with 3 product tags

## Embed snippet (for any external site)

```html
<script src="http://localhost:3000/widget.js" async></script>
<div class="shop-video-widget"
     data-brand-id="<the-brandId-from-seed-output>"
     data-mode="floating"></div>
```

`data-mode` accepts: `floating` (corner bubble), `inline` (in-page card), `feed` (full-screen vertical feed).

## Common commands

```bash
# install
npm install

# database — migrate + generate client
npx prisma migrate dev
npx prisma generate

# seed (creates the accounts above)
npm run db:seed

# dev server
npm run dev                       # http://localhost:3000

# rebuild the embedded widget bundle (public/widget.js)
npm run widget:build

# typecheck
npx tsc --noEmit

# full E2E suite (requires dev server running)
bash test/run-all.sh              # 39 tests, target localhost:3000 by default
bash test/run-all.sh http://localhost:3001   # or another port
```

## Public API (no auth — for the widget)

| Method | Endpoint                                          | Purpose                            |
|--------|---------------------------------------------------|------------------------------------|
| GET    | `/api/public/brand/{brandId}/videos`              | Feed of active videos + tags       |
| POST   | `/api/public/events`                              | Track IMPRESSION / VIEW / TAG_CLICK / CTA_CLICK |

CORS: `Access-Control-Allow-Origin: *` (it's a public widget).

## Brand API (auth required — BRAND role)

```
GET    /api/brand/me
GET    /api/brand/products              ?limit=N&cursor=<id>   (default 100, max 200)
POST   /api/brand/products
GET    /api/brand/products/{id}
PATCH  /api/brand/products/{id}
DELETE /api/brand/products/{id}        (also deletes the upload blob)

GET    /api/brand/videos                ?limit=N&cursor=<id>
POST   /api/brand/videos
GET    /api/brand/videos/{id}
PATCH  /api/brand/videos/{id}
DELETE /api/brand/videos/{id}          (also deletes video file + thumbnail)

GET    /api/brand/videos/{id}/tags
POST   /api/brand/videos/{id}/tags
PATCH  /api/brand/videos/{id}/tags/{tagId}
DELETE /api/brand/videos/{id}/tags/{tagId}

GET    /api/brand/analytics
POST   /api/brand/upload                multipart/form-data; field "file"
```

## Admin API (auth required — ADMIN role)

```
GET    /api/admin/brands
PATCH  /api/admin/brands/{id}          (disable/enable)
GET    /api/admin/videos
PATCH  /api/admin/videos/{id}
GET    /api/admin/products
```

## Brand palette (light theme)

| Token             | Hex       | Usage                                      |
|-------------------|-----------|--------------------------------------------|
| Canvas            | `#F3F4F6` | Page background                            |
| Surface           | `#FFFFFF` | Cards, sidebar, raised surfaces            |
| Surface-2         | `#E5E7EB` | Pressed / nested / hover                   |
| Border            | `#E5E7EB` | Hairlines                                  |
| Border-strong     | `#D1D5DB` | Focused / divider                          |
| Foreground        | `#0D0D12` | Primary text                               |
| Foreground muted  | `#6B7280` | Secondary text                             |
| Foreground subtle | `#9CA3AF` | Placeholder / disabled                     |
| Accent            | `#7C3AED` | Primary purple                             |
| Accent hover      | `#6D28D9` | Hover state                                |
| Accent deep       | `#4C1D95` | Pressed / deepest                          |
| Accent subtle     | `#F5F3FF` | Selected pill bg, hover row tint           |

## Reset the dev DB

```bash
npx prisma migrate reset           # WARNING: drops all data
npm run db:seed                    # re-seed accounts + sample data
```

## If a port is stuck

```powershell
# PowerShell — find and kill whatever holds :3000
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn[0].OwningProcess -Force }
```
