---
name: testing-standards
description: How to verify work is actually done in PawShop Admin — the real Playwright + pgTAP setup, and the unit-test gap
---

# Testing standards in PawShop Admin

## What exists today

**Playwright e2e** — the only automated test suite. Config: `playwright.config.ts`
(`testDir: ./tests/e2e`, projects `chromium` + `Mobile Chrome`/Pixel 5, `webServer` auto-starts
`npm run dev` against `localhost:3000`, HTML reporter). All specs live in one file:
`tests/e2e/pawshop.spec.ts`. It covers: dashboard load/stats/sidebar, the full CSV import flow
(map → validate → promote, asserting the exact "N products moved..." confirmation string),
product list load, search filter presence, add-product navigation, form validation (empty
required fields, price ≤ 0), full CRUD (add → appears in table → edit → search → delete), a
second edit-product scenario, delete-modal cancel/confirm, search/status filtering, and three
mobile-viewport smoke tests.

Run it:
```bash
npm test              # playwright test — headless, full suite
npm run test:ui        # playwright test --ui — interactive/debug
npm run test:report     # playwright show-report — view last run's HTML report
```

**pgTAP RLS test** — `supabase/tests/rls.sql`, proves tenant isolation at the database level (two
users, two orgs, asserts cross-tenant reads/writes are blocked). **Not** wired into `npm test` —
run it manually:
```bash
npx supabase start
psql "$DATABASE_URL" -f supabase/tests/rls.sql
```

**No unit tests exist.** No Jest, no Vitest, no `*.test.ts`/`*.spec.ts` outside `tests/e2e/`. This
is a gap in the project, not a deliberate "we only do e2e" decision that's been made — treat it as
open, per the root `CLAUDE.md`.

**No `typecheck` script.** Type errors surface via `next build`'s implicit check.

## What "done" means for a change in this repo, today

- If you changed behavior reachable from `/products` or `/imports` in the browser: run
  `npm test` and make sure it still passes; extend `tests/e2e/pawshop.spec.ts` with a case for
  the new behavior if the existing spec doesn't already exercise it (don't start a second spec
  file — this repo keeps everything in one).
- If you changed anything in `supabase/migrations/`, especially RLS policies: run
  `npx supabase db reset` locally, then `psql "$DATABASE_URL" -f supabase/tests/rls.sql`, and
  extend `rls.sql` with assertions for the new/changed policy.
- If you changed shared types (`lib/types.ts`) or anything touching multiple files: run
  `npm run build` to catch type errors, since there's no separate typecheck step.
- If you changed lint-relevant code: run `npm run lint` — note there's no committed ESLint config
  file despite the script existing (see root `CLAUDE.md` gotchas), so verify it actually runs
  meaningful checks rather than assuming it does.

## TODO: decide on this — minimal unit-test starting convention

No decision has been made on unit testing yet. If/when you want to add one, a reasonable minimal
starting point for this stack (not yet chosen, don't treat as settled):
- **Vitest** (fast, works well with the Next.js/TS/ESM setup already in place, no Babel config
  needed) over Jest.
- Start with the parts of the codebase that have real, non-trivial logic and zero e2e coverage
  today: `ProductForm.tsx`'s `validate()` function, and the client-side CSV parsing/validation
  logic in `ImportWorkspace.tsx` (the part that runs before `promoteImport()` hits the server) —
  both are pure-ish functions that would be cheap to unit test and currently are only exercised
  indirectly through slow, full-browser Playwright runs.
- Don't add component-rendering tests (React Testing Library, etc.) unless a real regression
  shows the e2e suite isn't catching something — that's a heavier commitment this project hasn't
  signed up for yet.
