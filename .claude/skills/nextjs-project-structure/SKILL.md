---
name: nextjs-project-structure
description: Where things actually go in PawShop Admin's Next.js App Router codebase, and the real server/client component boundary
---

# Next.js project structure in PawShop Admin

App Router only (`app/`) — there is no `pages/` directory, and none should be added. Next.js
16.2.9, React 19.2.7, TypeScript strict mode, path alias `@/*` → repo root (see `tsconfig.json`).

## Where things go

```
app/
  layout.tsx                     Root layout. Server component. Resolves current user + role
                                  (platform admin vs org member) for the sidebar/account menu.
  page.tsx                       Dashboard ("/"). Server component, fetches + aggregates stats
                                  inline (no separate stats API is actually used, see gotchas).
  login/page.tsx                 Server component wrapping the client LoginForm in <Suspense>.
  products/page.tsx              List + search/filter. Server component.
  products/new/page.tsx           Server component; renders ProductForm with organizations loaded
                                  server-side.
  products/[id]/edit/page.tsx     Server component; loads the one product server-side.
  imports/page.tsx                Renders the client ImportWorkspace.
  api/
    products/route.ts             GET, POST
    products/[id]/route.ts         GET, PUT, DELETE
    imports/promote/route.ts       POST — the one RPC-backed write path
    stats/route.ts                 GET — implemented but currently unused by any page (see gotchas)
  globals.css                    Tailwind base + hand-rolled utility classes (.btn-primary, .card,
                                  .form-input, etc.) — check here before inventing a new class name.

components/                      Flat. No subfolders. One component per file, PascalCase filename
                                  matching the export.

lib/
  supabase/client.ts              Browser client (createBrowserClient). Used only by client
                                  components that need to call Supabase directly (LoginForm,
                                  AccountMenu) — most components don't call Supabase directly at
                                  all; they hit /api/* instead.
  supabase/server.ts               Server client (createServerClient + cookies()). Used by every
                                  server component/page and every app/api/*/route.ts.
  supabase.ts                     Legacy client, not used anywhere currently — see root CLAUDE.md
                                  gotchas before extending it.
  types.ts                        All domain types in one file. No types/ directory.
  utils.ts                        formatCurrency, formatDate, cn — small, hand-rolled, no
                                  external formatting/classname library.

proxy.ts                         Repo root. This is Next.js 16's renamed middleware.ts — the auth
                                  guard. Don't create a middleware.ts; this project uses proxy.ts.

supabase/                        Schema, migrations, RLS, pgTAP tests — see the
                                  supabase-schema-conventions and rls-policies skills.

tests/e2e/pawshop.spec.ts        The only test file. See testing-standards skill.
```

There is no `hooks/` directory — if a component needs a reusable stateful hook, either add it
alongside its one usage or start a `hooks/` folder deliberately (this repo hasn't needed one yet).

## Server vs. client component boundary, as actually used here

Rule observed in every existing file: **pages are server components by default; only the leaf
components that need interactivity (forms, buttons with handlers, client-side fetch/state) are
`"use client"`.**

- Every file directly under `app/**/page.tsx` and `app/layout.tsx` is a server component — none of
  them have a `"use client"` directive.
- Every component under `components/` is `"use client"` **except** `StatsCard.tsx`, which is pure
  presentational (props in, JSX out, no hooks) and is rendered from the server-component dashboard
  page directly.
- No Server Actions (`'use server'`) exist anywhere. Mutations go through client components
  calling `fetch()` against `app/api/*` route handlers (see the data flow section in the root
  `CLAUDE.md`). If you're tempted to add a Server Action for a new form, don't — it'd be a third
  mutation pattern inconsistent with the rest of the app; use the existing
  client-component-fetches-a-route-handler pattern instead, unless you and the user have
  explicitly decided to introduce Server Actions project-wide.

When adding a new page:
1. Default to a server component. Fetch data directly with `createClient()` from
   `lib/supabase/server.ts` inside the async page function (see `app/products/page.tsx` for the
   canonical example: builds a query from `searchParams`, awaits it, passes `data` to a client
   child component).
2. Only reach for `"use client"` on the specific leaf component that needs `useState`/event
   handlers/`useRouter` — not on the page itself.
3. If the client component needs to mutate data, add or reuse a route handler under `app/api/`
   rather than calling Supabase directly from the client component (the two exceptions today,
   `LoginForm`/`AccountMenu`, call Supabase auth methods directly because that's a browser-side
   auth operation, not a tenant-scoped data mutation).

## Styling conventions

Tailwind utility classes are the default. A handful of hand-rolled component classes exist in
`app/globals.css` (`.btn-primary`, `.btn-secondary`, `.card`, `.form-input`, `.form-label`) — reuse
these instead of rewriting the same utility combination inline. `cn()` in `lib/utils.ts` is a
minimal `classes.filter(Boolean).join(" ")`, not `clsx`/`tailwind-merge` — don't add either library
without discussing it, since introducing one would leave two conditional-classname patterns
side by side.
