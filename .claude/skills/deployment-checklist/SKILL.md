---
name: deployment-checklist
description: Pre-deploy steps for PawShop Admin based on the actual env var / Vercel setup found in the repo
---

# Deployment checklist for PawShop Admin

## What actually exists

- **No `vercel.json`** in the repo. The README claims "Vercel-ready deployment" as a stack bullet,
  but there is no Vercel-specific config — this currently rests entirely on Next.js defaults
  (Vercel auto-detects a Next.js app with zero config needed for the basic case).
- **Env vars actually read by code** (grepped across the codebase):
  - `NEXT_PUBLIC_SUPABASE_URL` — required, no fallback (`!` non-null assertion in
    `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`).
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — preferred key name, falls back to:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used if the publishable key isn't set.
  - `process.env.CI` — read only by `playwright.config.ts`, not app code.
  - No service-role key is referenced anywhere in the codebase. The README states the
    service-role key "must only be used in server-side routes and is never exposed" — in
    practice, it's simply never used at all currently, not actively guarded.
- **`.env.local.example`** documents only the two `NEXT_PUBLIC_*` Supabase vars above.
- **`.gitignore`** excludes `supabase/.temp/`, `supabase/.branches/`, `supabase/snippets/` (local
  Supabase CLI/Studio state) plus standard Next.js/Vercel/env entries — none of these should ever
  be committed.

## Pre-deploy checklist (based on what's real today)

1. **Confirm the target Supabase project's migrations are applied.** This repo's source of truth
   for schema is `supabase/migrations/*.sql`, applied in order. Before pointing a deployment at a
   Supabase project, run (or confirm someone has run) all four migrations against it — there is
   no CI step that does this automatically.
2. **Set the two required env vars** in the Vercel project settings (or wherever it's deployed):
   `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, pointed at the target (not local) Supabase project.
3. **Run `npm run build` locally first** — there's no separate typecheck script, so `build` is
   the only thing that will surface a TypeScript error before it reaches the deploy platform.
4. **Run `npm test`** (Playwright) against a local dev server before deploying — there is no CI
   workflow file in this repo (no `.github/workflows/`) running this automatically today.
5. **Verify at least one platform admin exists** in the target database if admin features are
   needed — the only seeded platform admin (`a700d287-4f91-48bb-9a88-e445e9dff81d`, migration
   `20260708010000_platform_admin.sql`) is a local-dev UUID; a fresh/production Supabase project
   won't have this user unless you insert a real admin's `auth.users.id` into `platform_admins`.

## TODO: decide on this — not yet established in this repo

- **No `vercel.json`** exists. TODO: decide whether one is needed (e.g. to pin a Node version,
  configure redirects, or set function regions) or whether Vercel's zero-config Next.js detection
  is sufficient going forward.
- **No CI pipeline** (no `.github/workflows/`) runs `npm run build`, `npm test`, or the pgTAP RLS
  test automatically on push/PR. TODO: decide whether to add one before this project has multiple
  contributors or a production deployment target.
- **No documented process for applying migrations to a remote/production Supabase project** (e.g.
  via `supabase link` + `supabase db push`, or a CI step). TODO: decide the actual workflow before
  deploying against a non-local Supabase project.
- **No secrets-rotation or service-role-key usage plan** — since no code uses the service-role key
  today, there's nothing to check here yet, but if a future feature needs server-only privileged
  access (e.g. the webhook handler the README describes but that doesn't exist yet), TODO: decide
  where that key is stored (Vercel env var, never `NEXT_PUBLIC_*`) before writing that code.
