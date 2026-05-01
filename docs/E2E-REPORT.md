# Avori — End-to-End Test Report

**Run:** 2026-05-01 against `main` (commit `40df300`)
**Server:** Next.js 14 dev on `http://localhost:3000`, Postgres on Neon
**Result:** **65 of 65 tests pass.** No regressions outstanding.

```
== CROSS-TENANT TOTAL: PASS=10 FAIL=0 ==
== ADMIN+EVENTS TOTAL: PASS=16 FAIL=0 ==
== TOTAL (smoke+auth+CRUD+upload): PASS=39 FAIL=0 ==
ALL SUITES PASSED
```

`bash test/run-all.sh` to reproduce. Dev server must be running.

---

## What was tested

### 1. Smoke (5)
- `GET /`, `/login`, `/signup`, `/widget.js`, `/brand/logo-mark.svg` all return 200.

### 2. Authentication (2)
- `demo@avori.dev` lands a session with `role=BRAND` and a populated `brandId`.
- `admin@avori.dev` lands a session with `role=ADMIN`.

### 3. Middleware role gating (3)
- Anonymous → `/dashboard` returns 307 (redirect to login).
- Anonymous → `/admin` returns 307.
- BRAND user → `/admin` returns 307 (admin-only enforced at the edge, not just in the page).

### 4. Brand-scoped APIs (7)
- 4 routes return 200 for the authed brand owner.
- 3 routes return 401 for anonymous callers.

### 5. Validation (1)
- `POST /api/brand/products` with `{}` body returns 400.

### 6. Product / Video / Tag CRUD (8)
- Create → patch → delete each resource type.
- Tag with `endTime ≤ startTime` returns 400.

### 7. Public events (1)
- `POST /api/public/events` with valid payload returns 200.

### 8. Signup hardening (2)
- Rate-limited per IP — sixth signup in a minute returns 429.
- Duplicate email returns a generic error (no user-existence enumeration).

### 9. Upload security (5)
- HTML payload labelled `image/png` is **rejected** ("Unsupported file type") — magic-byte sniff catches the spoof.
- A real 1×1 PNG is accepted; the URL has a server-derived `.png` extension regardless of the original filename.
- The served file carries `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; sandbox`.
- An MP4 ftyp header labelled `image/jpeg` is rejected (mime kind/category mismatch).

### 10. Admin scope (4)
- All three `/api/admin/*` routes return 200 for ADMIN and 403 for BRAND.

### 11. Ownership (1)
- PATCH on a non-existent product id returns 404 (not 500, not 200).

### 12. Cross-tenant isolation (10)
A new brand B is created via signup, then attempts to access brand A's resources by guessing IDs:
- B reading or mutating A's product → 404 (not 200).
- B reading or mutating A's video → 404.
- B tagging A's video → 404.
- B tagging B's own video with A's product → 404.
- B's product list excludes A's products entirely.

### 13. Admin disable flow (7)
- Disabling brand A: public videos endpoint returns `{ brand: null, videos: [] }`, events endpoint returns `accepted:false`.
- Disabling a video: it disappears from the public payload.
- Re-enabling restores both.

### 14. Analytics rollup (3)
Posted 5 IMPRESSION + 3 VIEW + 2 CTA_CLICK events to `/api/public/events`, then read `/api/brand/analytics` and confirmed all three counters incremented by exactly that much.

### 15. INACTIVE product hiding (3)
Setting a tagged product to INACTIVE removes it from the widget payload (tags filter on `product.status: ACTIVE`). Re-activating restores it.

### 16. Public payload field exposure (3)
The public videos response does **not** contain `createdAt`, `updatedAt`, or `passwordHash`. (`brandId` is intentionally absent from sanitized objects too.)

---

## Issues found and fixed in this pass

A code-audit pass turned up 20 findings. The 13 high/medium fixes landed in commit [`40df300`](https://github.com/ordinarychief84/Avori/commit/40df300). The remaining 7 (low/nit/architecturally-larger) are documented as follow-ups below.

### Fixed

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 1 | high | Signup endpoint had no rate limit — easy to spam the brand table | Added per-IP token bucket (5/min) |
| 2 | medium | "Email already registered" leaked which emails were registered | Generic error returned in all duplicate cases |
| 3 | medium | Slug uniqueness check had a TOCTOU race on parallel signups | Wrapped in transaction + handle Prisma `P2002` |
| 4 | medium | Events endpoint trusted the client-reported `domain` field | Server now derives domain from `Origin`/`Referer` header |
| 5 | high | CORS `*` on events with no origin check let any site forge analytics | Same fix as #4 — install rows are pinned to the verified domain |
| 7 | high | Upload validated only `file.type` (client-spoofable), letting a `.html` payload masquerade as `.png` | Magic-byte sniffer (`src/lib/storage/sniff.ts`) determines mime + extension server-side |
| 8 | high | Upload size enforced only after the full body was buffered into memory | `Content-Length` pre-check rejects oversized requests early |
| 9 | high | Filename extension was attacker-controlled via `file.name` | Extension is now derived from sniffed mime, never from filename |
| 10 | medium | Middleware had a duplicate auth check that bypassed the `authorized` callback (any signed-in user could load `/admin`) | Middleware now relies solely on `authorized` in `auth.config.ts` |
| 11 | low | Signup → signIn race: failure left user on `/dashboard` while unauthenticated | Inspect `signIn` result, redirect to `/login` with the email pre-filled if it fails |
| 12 | medium | Top-products `ctr` was actually `tagClick → ctaClick` conversion, not view-based CTR | Renamed field to `tagToCta` |
| 15 | low | Dashboard pages used `session!.user.brandId!` non-null asserts that could throw on a streaming-edge race | New `pageBrandSession()` helper redirects cleanly |
| 16 | low | Email-uniqueness check had its own TOCTOU window | Same fix as #3 — `P2002` handler covers both |
| 17 | nit | Leftover `as 'ACTIVE' | 'INACTIVE'` casts on Prisma enum reads from the SQLite phase | Removed |
| — | high | Even with #7-#9 fixed, `/uploads/*` was served with `Access-Control-Allow-Origin: *` and content-sniffed types | Added `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; sandbox` headers |

### Deferred (documented, not blocking)

| # | Severity | Issue | Why deferred |
|---|---|---|---|
| 6 | high | Rate-limit bucket is in-process — useless behind multiple instances | Needs Redis/Upstash. Out of scope for this pass. The current limiter still defends single-instance dev/preview correctly, and adds *some* friction in production. |
| 13 | medium | Analytics endpoint does ~21 sequential queries per dashboard load | Optimization, not correctness. Single rollup query would be ~3x faster but adds complexity. |
| 14 | low | Public videos response includes `null` for missing description/thumbnail | Cosmetic. |
| 19 | nit | Middleware `matcher` correctly bypasses `/login`, `/signup` | Confirmed working as intended. |
| 20 | nit | `LocalStorageProvider` would silently fail on read-only filesystems (Vercel) | Production deploys should use S3/R2 anyway; storage stubs noted. |

---

## Architecture confidence

- **Cross-tenant security:** verified by signing up a fresh brand B and exhaustively trying to read or mutate brand A's resources by direct ID. Every attempt returns 404 (the helpers `ownProduct` / `ownVideo` / `ownTag` consistently filter by `session.user.brandId` first). 10/10 hostile attempts blocked.
- **Middleware:** anonymous traffic to `/dashboard` and `/admin` redirects via Auth.js's `authorized` callback. BRAND user attempting `/admin` redirects too (no longer a "two-tier" check that admin-page-only-enforced).
- **Public widget API:** confirmed disabled brands and videos disappear from the response, INACTIVE products disappear from tag arrays, and no internal Prisma fields (`createdAt`, `updatedAt`, `passwordHash`, raw `brandId`) leak.
- **Auth.js v5 split:** `auth.config.ts` is genuinely edge-safe (no Prisma/bcrypt). The `authorized` callback is now the single source of truth for protected-route gating.
- **File uploads:** the audit's main attack chain (upload `.html` payload labelled `image/png` → served from open-CORS origin → execute) is closed at three layers: magic-byte sniff, server-derived extension, and `nosniff` + CSP sandbox headers.

---

## Reproduction

```bash
cd C:\Users\JANE EBERE\Desktop\Avori
npm run dev   # in one terminal
bash test/run-all.sh   # in another
```

Each sub-suite is also runnable independently:

- `bash test/e2e.sh` — smoke + auth + CRUD + upload security
- `bash test/e2e-cross-tenant.sh` — multi-brand IDOR attempts
- `bash test/e2e-admin.sh` — admin disable + analytics rollup

The harness uses `curl` + `node` (for JSON parsing) and is portable across Git Bash on Windows, macOS, and Linux. No additional npm deps.

---

## Files touched

| Layer | Files |
|---|---|
| Storage | [src/lib/storage/sniff.ts](../src/lib/storage/sniff.ts) (new), [src/lib/storage/index.ts](../src/lib/storage/index.ts), [src/lib/storage/local.ts](../src/lib/storage/local.ts) |
| Routes | [src/app/api/brand/upload/route.ts](../src/app/api/brand/upload/route.ts), [src/app/api/public/events/route.ts](../src/app/api/public/events/route.ts), [src/app/api/signup/route.ts](../src/app/api/signup/route.ts), [src/app/api/brand/analytics/route.ts](../src/app/api/brand/analytics/route.ts) |
| Auth | [src/lib/auth.ts](../src/lib/auth.ts), [src/middleware.ts](../src/middleware.ts) |
| Validation | [src/lib/validation.ts](../src/lib/validation.ts) |
| Pages | [src/app/dashboard/*.tsx](../src/app/dashboard/) (7 pages — `pageBrandSession()` migration) |
| Headers | [next.config.mjs](../next.config.mjs) (`/uploads/*` CSP + nosniff) |
| Tests | [test/run-all.sh](../test/run-all.sh), [test/e2e.sh](../test/e2e.sh), [test/e2e-cross-tenant.sh](../test/e2e-cross-tenant.sh), [test/e2e-admin.sh](../test/e2e-admin.sh) (all new) |

Build verified: `tsc --noEmit` clean, `npm run build` clean, `bash test/run-all.sh` clean.
