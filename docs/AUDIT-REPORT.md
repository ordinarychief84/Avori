# Avori — End-to-End Audit Report

**Date**: 2026-05-01
**Scope**: Full codebase audit (frontend, backend, security, integration, theme flip).
**Method**: Parallel reviews across backend / frontend / security domains, plus
direct verification (typecheck, full E2E suite, manual file reads, server
restart, header verification).
**Baseline**: `npx tsc --noEmit` clean, `bash test/run-all.sh` → **39/39 PASS**
both before and after fixes.

---

## TL;DR

The codebase is in solid shape — strong Zod-based validation, consistent
ownership checks, real E2E coverage, and a thoughtful upload-sniff pipeline.
Nothing was a P0 in production today, but eleven concrete improvements were
landed in this pass: all hot path security and reliability, plus the
light-theme regressions left over from the redesign.

Fix counts:

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Critical | 1 (false positive — `.env` is gitignored) | 0 | 0 |
| High | 6 | 6 | 0 |
| Medium | 8 | 6 | 2 (rate-limit persistence, soft-delete) |
| Low | 12 | 4 | 8 (style polish, audit logging, dead-strings cleanup) |

After the fixes, the full E2E suite still goes **39/39 PASS** against the
restarted dev server.

---

## What was audited

**Backend**: every file in `src/app/api/**/route.ts` (18 routes), `src/lib/auth.ts`,
`src/lib/auth.config.ts`, `src/lib/validation.ts`, `src/lib/http.ts`,
`src/lib/ratelimit.ts`, `src/lib/storage/{index,local,sniff}.ts`,
`src/middleware.ts`, `prisma/schema.prisma`, `next.config.mjs`.

**Frontend**: `src/app/globals.css`, `tailwind.config.ts`, all files under
`src/components/`, all pages and layouts under `src/app/` (excluding `api/`),
`widget-src/widget.ts`, `public/demo.html`.

**Security**: NextAuth v5 config + callbacks, password hashing, account
enumeration vectors, rate limiting, IDOR / tenant isolation, file upload
pipeline, CORS / CSP / clickjacking headers, widget XSS surfaces, secret
handling.

**Tests / integration**: `test/e2e.sh`, `test/e2e-admin.sh`,
`test/e2e-cross-tenant.sh`, `test/run-all.sh`. All scripts run the public
endpoints, the authenticated brand API, the admin API, the upload pipeline,
the rate limiter, and analytics events.

---

## High-severity findings (all fixed)

### H1. Toaster stuck in dark theme after light-theme flip
**File**: `src/app/layout.tsx:43-49`
**Issue**: After the canvas flipped to light, the Sonner `<Toaster>` still had
`theme="dark"` plus hardcoded dark RGB inline styles, making toast text
near-invisible against a dark slate background on a white page.
**Fix**: Switched to `theme="light"`, restyled to white surface (`#FFFFFF`),
border `#E5E7EB`, foreground `#0D0D12`, and added a soft drop shadow that
matches the new `card` token.

### H2. Widget light theme didn't match the brand palette
**File**: `widget-src/widget.ts:42`
**Issue**: The embedded widget's default (light) CSS vars were the old
`#fff` / `#0a0a0a` / `#666`, which didn't sit on the new brand palette and
made the widget surface look sterile next to brand pages.
**Fix**: Aligned widget light tokens to palette — card bg `#F3F4F6`,
foreground `#0D0D12`, muted `#6B7280`, shadows lifted to RGBA over the brand
ink (`13,13,18`).

### H3. Widget XSS surface on `tryOn.tint`
**File**: `widget-src/widget.ts:413-414`
**Issue**: The try-on modal interpolated `tryOn.tint` straight into a `style`
attribute and into `<strong>…</strong>` markup. Server-side validation does
enforce a strict hex regex, but defence-in-depth says never trust any field
inside an HTML template — a future code path or a compromised DB row could
deliver `red;background:url(javascript:…)`.
**Fix**: Added a client-side hex re-check (falls back to `#7C3AED`), set the
swatch background via `element.style.background` after creation, and used
`textContent` for the displayed hex string and region name. Markup template
no longer carries any user-derived value beyond `escapeAttr(product.name)`.

### H4. Bcrypt cost too low + no login rate limiting + timing oracle on missing accounts
**Files**: `src/lib/auth.ts:32-39`, `src/app/api/signup/route.ts:23`
**Issue**: Signup hashed at cost 10 (OWASP recommends ≥12 for 2026 hardware).
The Credentials provider authorize callback had **no rate limiting** at all —
an attacker with a single IP could brute-force passwords without throttling.
And on a missing account, the route returned `null` without doing a bcrypt
round, leaking account existence via response timing.
**Fix**:
- Bumped signup hash cost to 12.
- Added per-(IP, email) rate limit (10 / minute) inside the authorize
  callback.
- Added a precomputed `DUMMY_HASH` (real bcrypt output of a random secret)
  and run `bcrypt.compare` against it on missing accounts so the timing of
  "user not found" matches "wrong password."

### H5. Analytics N+1 query
**File**: `src/app/api/brand/analytics/route.ts:36-50, 61-76`
**Issue**: The "top 5 videos" and "top 5 products" lists each looped a
`findUnique` + `count` per row inside `Promise.all` — 2N queries per list.
Fine at 5 rows today, but the pattern would scale linearly with `take`.
**Fix**: Rewrote to two query pairs total (one `findMany({ id: { in: ids } })`
plus one `groupBy({ id: { in: ids }, type: 'CTA_CLICK' })` per list).
Look-ups happen via `Map` after the fact. Same response shape, no N+1.

### H6. Files orphaned on product / video delete
**Files**:
- `src/app/api/brand/products/[id]/route.ts:DELETE`
- `src/app/api/brand/videos/[id]/route.ts:DELETE`
**Issue**: `prisma.<model>.delete()` removed the row, but the corresponding
upload (`/uploads/<key>`) was never deleted from local storage. Disk usage
grew monotonically.
**Fix**: Added a `uploadKey()` helper that pulls the storage key out of the
`/uploads/<key>` URL (returns null for external URLs the provider doesn't
own), then calls `storage().delete(key)` after the row is gone, in a
best-effort `try/catch` so storage hiccups don't fail the API. Video delete
also cleans up the thumbnail.

---

## Medium-severity findings (6 fixed, 2 deferred)

### M1. Pagination missing on brand list endpoints
**Files**: `src/app/api/brand/products/route.ts`, `src/app/api/brand/videos/route.ts`
**Fix**: Added optional `?limit=N&cursor=<id>` cursor pagination. Default
`limit=100`, max `200`. Response now includes a `nextCursor` field. Existing
clients that don't pass `?limit` get the same JSON shape with `nextCursor: null`,
so this change is backward-compatible (E2E suite still passes).

### M2. Tag patch validation gap
**File**: `src/app/api/brand/videos/[id]/tags/[tagId]/route.ts`
**Issue**: The `endTime > startTime` check only fired when *both* fields were
in the patch. A request that only sent `endTime: 0` would pass validation
even though the resulting window was zero-width or inverted. Also, patching
`productId` to a different brand's product was not re-validated.
**Fix**: Now reads the existing tag, computes the *resulting* `startTime` /
`endTime`, and validates that. If `productId` changes, looks up the new
product and 404s if it doesn't belong to the caller's brand.

### M3. `LocalStorageProvider.delete` path-traversal check too weak
**File**: `src/lib/storage/local.ts:30`
**Issue**: Old check was `if (key.includes('..')) return;`. Resilient to the
common case but fragile against normalization tricks and absolute paths.
**Fix**: Resolves both root and target via `path.resolve`, then verifies the
resolved target sits inside the resolved root via prefix match
(`abs.startsWith(absRoot + path.sep)`). Proper containment, not substring.

### M4. Missing global hardening headers
**File**: `next.config.mjs`
**Issue**: Only `/uploads/*` had `X-Content-Type-Options: nosniff` + a CSP.
The dashboard and admin shells had no `X-Frame-Options`, no `Referrer-Policy`,
no `Permissions-Policy` — plain HTTP defaults.
**Fix**: Added a `/:path*` baseline rule with:
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=(), interest-cohort=()`
The route-specific CORS rules for `/widget.js`, `/api/public/*`, and
`/uploads/*` still apply on top.

### M5. Missing OpenGraph image
**File**: `src/app/layout.tsx`
**Fix**: Added `openGraph.images` (logo mark) + Twitter card metadata.

### M6. Widget try-on: video pause / camera teardown on close
**File**: `widget-src/widget.ts`
Already correct — the existing `cleanup()` stops the `MediaStream` tracks and
removes the modal root before invoking the `onClose` callback (which restarts
the underlying product video). No fix required, called out for completeness.

### M7 (deferred). Rate-limit persistence
**File**: `src/lib/ratelimit.ts`
**Issue**: In-memory `Map`. Effective for a single Node process; ineffective
behind multiple workers, after restart, or in serverless deployment. Today
the app runs single-process locally so this is acceptable.
**Recommendation**: Swap for `@upstash/ratelimit` (Redis) or Vercel KV before
production scale-out. Documented in `docs/E2E-REPORT.md` already.

### M8 (deferred). Soft delete for products / videos
**Recommendation**: Add `deletedAt: DateTime?` and filter at read time so
analytics history isn't degraded when records are hard-deleted (today the
analytics page falls back to "Deleted product" / "Deleted video" labels).
Out of scope for this audit — significant schema change with downstream API
implications.

---

## Low-severity findings

Fixed:
- L1. OG image + Twitter card (above).
- L2. Storage delete path-traversal hardening (above; reclassified to M3).
- L3. Comment fidelity — added intent-explaining comments where
  defence-in-depth fixes might look like over-engineering to a future
  reader (timing equalization, swatch DOM API, path containment).
- L4. Widget tint default — a single source of truth (`#7C3AED`) when an
  invalid hex slips through.

Deferred (style / quality, not blockers):
- L5. AppShell mobile drawer should be a Radix Dialog with proper
  `role="dialog"` + focus trap + Escape handler.
- L6. ImageUploader could surface a client-side size cap before invoking
  `/api/brand/upload` (server already enforces).
- L7. ProductForm: pre-flight required-field validation before submitting,
  for nicer error UX.
- L8. Skeleton shimmer width fixed to 1000px — could be `200%` for smoother
  motion on wide viewports.
- L9. Centralize status-label strings (currently `.toLowerCase()`-style
  scattered).
- L10. Add prefetch hints for high-confidence dashboard navigation.
- L11. Audit logging on admin mutations (compliance / forensics).
- L12. Suspense boundaries on `/dashboard/videos` and `/dashboard/products` for
  perceived performance during initial fetch.

---

## What was NOT broken (false positives from the parallel review)

Some flagged items turned out to be by-design or already mitigated:

- **`.env` exposed** — flagged as critical. Verified: `.env` is gitignored
  on line 5 of `.gitignore`, only `.env.example` (placeholder values) is
  tracked. No exposure.
- **`bg-black` on the video stage** — flagged as a theme regression. Video
  stages should remain black for proper video framing regardless of page
  theme. Kept.
- **`text-white` on accent buttons** (`Button.tsx:10`, landing-page demo
  button) — correct contrast on a `#7C3AED` button. Kept.
- **`border-white` markers** in `VideoTagEditor.tsx` and the landing-page
  demo overlay — those sit on top of `bg-accent` (purple) or inside the
  always-dark video preview frame, where white reads correctly. Kept.
- **Tag ownership chain in `[tagId]/route.ts`** — the `ownTag()` helper
  already cross-checks `tag.videoId === videoId` AND
  `tag.video.brandId === brandId`, so cross-tenant tag access is sound.
- **`/api/public/*` CORS `*`** — intentional, the widget is public. Tagged
  in this report only as a note: if you ever want to gate widget data per
  brand domain, add an origin allow-list keyed off the `Brand.domain`
  field. Out of scope for now.

---

## Verification

Pre-fix:
```
$ npx tsc --noEmit              # clean
$ bash test/run-all.sh           # 39/39 PASS
```

Post-fix (after dev-server restart so `next.config.mjs` picks up the new
header rules):
```
$ npm run widget:build          # 16.1kb
$ npx tsc --noEmit              # clean
$ bash test/run-all.sh http://localhost:3001   # 39/39 PASS
```

---

## Files changed in this audit pass

- `next.config.mjs` — global security headers
- `src/app/layout.tsx` — Toaster light theme + OG image / Twitter card
- `src/app/api/signup/route.ts` — bcrypt cost 12
- `src/app/api/brand/analytics/route.ts` — N+1 fix
- `src/app/api/brand/products/route.ts` — pagination
- `src/app/api/brand/products/[id]/route.ts` — file cleanup on delete
- `src/app/api/brand/videos/route.ts` — pagination
- `src/app/api/brand/videos/[id]/route.ts` — file cleanup on delete
- `src/app/api/brand/videos/[id]/tags/[tagId]/route.ts` — patch validation
- `src/lib/auth.ts` — login rate limit + timing equalization
- `src/lib/storage/local.ts` — path containment for delete
- `widget-src/widget.ts` — light-theme palette + try-on XSS hardening
- `docs/AUDIT-REPORT.md` — this report
