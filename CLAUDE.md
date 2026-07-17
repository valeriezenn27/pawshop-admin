# PawShop Admin — CLAUDE.md

## Overview

PawShop Admin is a personal learning project for Next.js, React, Supabase, and Vercel, and for
learning agentic AI workflows with Claude Code. Despite the name, the domain is **not**
veterinary/clinic — it's a generic multi-tenant retail-inventory app (products, organizations,
CSV import staging). Early stage: 3 commits, actively evolving. Expect gaps and half-finished
paths; that's normal for this project, not a sign something is broken.

## Tech stack (exact versions, from `package.json` / installed)

| Package | Version |
|---|---|
| next | 16.2.9 (App Router only — no `pages/`) |
| react / react-dom | 19.2.7 |
| typescript | ^5, `strict: true` |
| @supabase/supabase-js | 2.108.1 |
| @supabase/ssr | 0.12.0 |
| tailwindcss | 3.4.17 |
| lucide-react | 0.468.0 (only icon lib) |
| @playwright/test (dev) | 1.49.0 |
| supabase CLI (dev) | 2.106.0 |
| eslint / eslint-config-next (dev) | eslint ^8 / eslint-config-next 15.3.3 — **mismatched** against next 16, see gotchas |

No zod, no react-hook-form, no shadcn/radix, no state-management library, no clsx/tailwind-merge.
Form validation and `cn()` are hand-rolled in this repo — don't introduce a validation or styling
library without discussing it first, since it'd be an inconsistent addition next to the existing
hand-rolled code.

## Architecture

### Multi-tenancy — how it actually works

Tenant isolation is **database-level RLS, not application-level filtering**. The scoping column
is `organization_id` (not `tenant_id`/`clinic_id`).

- `organizations` — the tenant entity.
- `organization_members (organization_id, user_id, role)` — join table; `role` is one of
  `owner | admin | operator | viewer`. This table is what RLS policies check against.
- Two `security definer` helper functions in `supabase/migrations/20260708000000_secure_imports.sql`
  do the real enforcement:
  - `is_org_member(org_id)` — true if `auth.uid()` has any row in `organization_members` for that org.
  - `can_manage_org(org_id)` — true if that role is `owner`/`admin`/`operator` (i.e. not `viewer`).
- Every tenant-scoped table (`products`, `import_jobs`, `import_rows`) has RLS enabled and policies
  built from those two functions — `for select using (is_org_member(...))`,
  `for insert/update/delete ... with check (can_manage_org(...))`.
- `platform_admins (user_id)` + `is_platform_admin()` grants a separate, explicit cross-tenant
  `for all` policy on `organizations`, `organization_members`, `products`, `import_jobs`,
  `import_rows` — but **not** `webhook_events` (server/service-role only, by design).
- Application code (server components in `app/*/page.tsx`) queries tables with **no**
  `.eq("organization_id", ...)` filter — it doesn't need one, because RLS already restricts what
  the authenticated Postgres role can see. Writes from API routes resolve an `organization_id` in
  app code before insert, but the actual security boundary is still the RLS `with check`.
  See `supabase/migrations/20260708000000_secure_imports.sql` for the full policy set and
  `supabase/tests/rls.sql` for the isolation proof.

### Folder structure

```
app/                    App Router only. No pages/.
  api/                  Route handlers — the only place writes from client components land.
  imports/, login/, products/   Page routes, all server components.
  layout.tsx            Root layout — resolves current user/role for the sidebar.
components/             Flat, no subfolders. All "use client" except StatsCard.tsx (server).
lib/
  supabase/client.ts     Browser Supabase client (@supabase/ssr createBrowserClient).
  supabase/server.ts     Server Supabase client (@supabase/ssr createServerClient, cookies-based).
  supabase.ts            Legacy plain supabase-js client — NOT used anywhere; see gotchas.
  types.ts               All domain types live in this single file (no types/ folder).
  utils.ts                formatCurrency, formatDate, cn (hand-rolled, not clsx).
supabase/
  migrations/            4 SQL files, source of truth for schema + RLS.
  schema.sql              Duplicate of the first migration — stale, see gotchas.
  tests/rls.sql           pgTAP tenant-isolation test — run manually, not part of `npm test`.
  config.toml             Supabase CLI local-dev config.
tests/e2e/pawshop.spec.ts  All Playwright specs, one file.
proxy.ts                 Next.js 16's renamed middleware.ts — auth guard (see gotchas).
```

No `hooks/`, `middleware.ts`, or `types/` directory exists — don't create them out of habit from
other Next.js projects; follow what's here (`lib/types.ts`, `proxy.ts`).

### Data flow pattern

Two patterns, split cleanly by read vs. write, plus one RPC — follow this split for new features:

1. **Reads** — direct Supabase calls inside async **server components**, no API layer in between.
   E.g. `app/products/page.tsx` builds a query directly from `searchParams` and awaits it in the
   page component itself.
2. **Writes from client components** — `fetch()` to an internal `app/api/*` route handler, which
   wraps the server Supabase client and performs the mutation. E.g. `ProductForm.tsx` →
   `POST /api/products` / `PUT /api/products/[id]`.
3. **One privileged write path** — `app/api/imports/promote/route.ts` calls
   `supabase.rpc("promote_product_import", ...)`, a `security invoker` Postgres function that
   does the entire staging-insert + duplicate-recheck + product-insert sequence atomically.

**No Server Actions** (`'use server'`) exist anywhere in this codebase. Don't introduce them for
a new feature without discussing it — it'd be a third, inconsistent mutation pattern next to (2)
and (3) above.

`proxy.ts` at the repo root is Next.js 16's renamed convention for what used to be
`middleware.ts` — it's not a typo or a random file, it's the actual auth guard (redirects
unauthenticated users to `/login`, redirects authenticated users away from `/login`).

## Non-negotiable rules

1. **Every new tenant-scoped table must have RLS enabled and policies before any application code
   touches it.** Follow the existing template: add `organization_id uuid references
   organizations(id)`, `alter table ... enable row level security`, and policies built from
   `is_org_member()` / `can_manage_org()` (or new equivalents, not raw `auth.uid()` checks
   duplicated per-table).
2. **Never rely on application-level filtering as the tenant-isolation boundary.** RLS is the
   real boundary in this codebase. If you write a query, it's fine that it doesn't filter by
   `organization_id` — but only because RLS is doing that job. Don't "fix" this by adding
   app-level filters as a substitute for missing RLS policies; fix the RLS instead.
3. **Platform-admin bypass must be its own explicit RLS policy** (`is_platform_admin()`), never a
   silent app-level role check that skips RLS. If a table needs a platform-admin override, add a
   dedicated `for all ... using (is_platform_admin())` policy, following
   `20260708010000_platform_admin.sql`.
4. **`webhook_events` (and any future server-only ledger table) gets no client-facing RLS policy
   at all.** That's intentional, not an oversight — don't add a policy to "fix" access to it from
   the browser.
5. **After any RLS change, run `supabase/tests/rls.sql` manually** (see Testing below) before
   considering the change done.
6. **Never commit directly to `main`.** Leave changes staged for review — the user commits.

## Coding conventions actually observed

- **Components**: flat under `components/`, no subfolders, PascalCase filenames matching the
  exported component (`ProductForm.tsx`, `SearchFilter.tsx`).
- **Client/server boundary**: default to server components for pages (`app/**/page.tsx`); mark a
  component `"use client"` only when it needs interactivity/state — this repo does that
  consistently for every component except the purely presentational `StatsCard.tsx`.
- **Forms/validation**: hand-rolled, inline in the component (see `ProductForm.tsx`) — no schema
  library. Category options are a hardcoded array in the form component, not a DB-driven enum.
- **Styling**: Tailwind utility classes plus a few hand-rolled component classes in
  `app/globals.css` (`.btn-primary`, `.card`, etc.) and a local `cn()` helper in `lib/utils.ts`
  (`classes.filter(Boolean).join(" ")`) — not `clsx`/`tailwind-merge`.
- **Types**: all domain types in the single `lib/types.ts` file. Not every DB table has a
  corresponding TS type yet (`import_jobs`/`import_rows` are handled with ad hoc inline shapes in
  `ImportWorkspace.tsx` instead) — follow the existing pattern (add to `lib/types.ts`) rather than
  inventing a new types location, but note the DB-side types are the source of truth.
- **API routes**: `app/api/**/route.ts`, one file per resource/action. Auth checks
  (`supabase.auth.getUser()` + 401) are present on some routes but not all — see gotchas; when
  writing a new route, prefer being explicit and check auth in code even though RLS also protects
  the query.
- **Errors**: no centralized error handling/logging layer exists; routes and pages handle errors
  locally (try/catch → JSON error response, or thrown to Next's error boundary). Don't introduce
  a new error-handling abstraction without discussing it first.

## Testing expectations

- **Playwright e2e** (`tests/e2e/pawshop.spec.ts`) is the only automated suite. Run with
  `npm test`. A feature isn't "done" if it changes user-facing behavior in `/products` or
  `/imports` and the existing Playwright spec wasn't updated/extended to cover it.
- **RLS/tenant isolation**: `supabase/tests/rls.sql` (pgTAP) is **not** wired into `npm test` —
  run it manually after any RLS or schema change:
  ```bash
  npx supabase start
  psql "$DATABASE_URL" -f supabase/tests/rls.sql
  ```
- **No unit tests exist** in this repo (no Jest/Vitest, no `*.test.ts` outside `tests/e2e/`). This
  is a known gap, not a deliberate choice — see `.claude/skills/testing-standards/SKILL.md` for a
  proposed minimal starting convention if you want to add one.
- There is no `typecheck` script — type errors surface via `next build`. Run `npm run build`
  before considering a change done if you touched types shared across files.

## Commands

```bash
npm run dev          # next dev
npm run build        # next build (also the de facto typecheck)
npm run start        # next start
npm run lint         # next lint — no .eslintrc/eslint.config.mjs committed, see gotchas
npm test             # playwright test (e2e)
npm run test:ui       # playwright test --ui
npm run test:report   # playwright show-report

npx supabase start    # local Supabase stack (Docker)
npx supabase stop
npx supabase db reset # re-applies all migrations to the local DB
psql "$DATABASE_URL" -f supabase/tests/rls.sql   # manual RLS isolation test
```

## Known inconsistencies (found during initial repo audit, 2026-07-17)

These aren't hidden bugs to silently "fix" — they're flagged so they aren't mistaken for
intentional patterns. Decide deliberately before touching any of them.

- `lib/supabase.ts` (plain `supabase-js` client with a placeholder-URL fallback) is not imported
  anywhere — likely dead code left over from before the `@supabase/ssr` migration.
- `supabase/schema.sql` is a byte-for-byte duplicate of the *first* migration only — it predates
  `organization_id`/RLS/orgs entirely and doesn't reflect the current schema. Two sources of
  truth for the same original state.
- `GET /api/products`, `GET /api/products/[id]`, and `GET /api/stats` are fully implemented but
  never called by any page/component — all reads go through direct server-side Supabase queries
  instead. `DashboardStats` and `ProductFilters` types exist only for this unused surface.
- Auth checks are inconsistent across API routes: `POST /api/products` and
  `POST /api/imports/promote` explicitly check `auth.getUser()`; the GET/PUT/DELETE routes don't
  and rely solely on RLS.
- `app/layout.tsx`'s platform-admin lookup (`platform_admins.select().maybeSingle()`) has no
  explicit `.eq("user_id", ...)` filter — it only works today because RLS on that table already
  scopes it to the caller and exactly one platform admin row exists. Would need revisiting before
  a second platform admin is added.
- `supabase/config.toml` references `./seed.sql` for `db reset`, but that file doesn't exist.
- `eslint-config-next` (15.3.3) is pinned behind `next` (16.2.9); no `.eslintrc`/`eslint.config.mjs`
  is committed despite `lint` being wired up.
- README describes a webhook signature-verification handler and a webhook RLS test as if
  implemented; in reality only the `webhook_events` table + RLS lockout exist in SQL — no handler
  route, no signature verification code, and `supabase/tests/rls.sql` has no webhook assertions.

## Known gotchas / decisions log

<!-- Add entries below as you make decisions during development. Suggested format:

### YYYY-MM-DD — Short title
What happened / what was decided, and why. Link to a commit or PR if relevant.
-->

## Git workflow

Never commit directly to `main`. Make changes and leave them staged/unstaged for review — the
user reviews and commits themselves unless they explicitly ask you to commit.
