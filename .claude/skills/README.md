# Skills index

These are `SKILL.md` files scoped to what's *actually* in PawShop Admin — real code/SQL quoted
from this repo, not generic best practices. Claude Code loads them automatically when a task
matches; you can also read one directly if you want to recall a convention yourself. Anything not
yet decided in the codebase is marked `TODO: decide on this` inside the relevant file rather than
invented.

## rls-policies

**What it's for**: the tenant-isolation model — the `organization_id` column, the
`is_org_member()`/`can_manage_org()` helper functions, the exact policy template, and how to run
the pgTAP isolation test.

**Use it when**: you're adding a new table that needs to belong to an organization, adding a new
kind of access rule (e.g. a new role, a new cross-tenant exception), or touching anything under
`supabase/migrations/`.

**Sample scenario**: "Add a `suppliers` table scoped to an organization, with the same read/write
rules as `products`." → this skill gives you the exact `enable row level security` +
four-policy template to copy, tells you to index `organization_id`, and reminds you to extend
`supabase/tests/rls.sql` with a cross-tenant assertion before calling it done.

## nextjs-project-structure

**What it's for**: where a new file should physically go, and the real server-vs-client component
split (pages are server components; only interactive leaf components are `"use client"`; no
Server Actions anywhere; `proxy.ts` is this project's `middleware.ts`).

**Use it when**: starting a new page/route/component and you're not sure whether it should be a
server or client component, or where it belongs in the folder structure.

**Sample scenario**: "Add a `/products/[id]` detail page (read-only, not the edit form)." → this
skill tells you it should be a server component fetching directly via
`lib/supabase/server.ts` (like `app/products/page.tsx` does), not a client component with a
`useEffect` fetch, and that any add-to-cart-style button on it should be its own small
`"use client"` leaf, not the whole page.

## supabase-schema-conventions

**What it's for**: migration file naming (`YYYYMMDDHHMMSS_description.sql`), column/constraint
conventions (status columns as `text` + `check`, not Postgres enums), and the real
organizations → products/import_jobs → import_rows relationship shape.

**Use it when**: writing a new migration file, adding a column, or designing a new table's
relationships.

**Sample scenario**: "Add an `order_status` column to a new `orders` table." → this skill tells
you to follow the `text` + `check (order_status in (...))` pattern used by `import_jobs.status`
and `organization_members.role`, not to introduce a Postgres `enum` type, which would be
inconsistent with everything else in this schema.

## testing-standards

**What it's for**: what "done" means here — the Playwright e2e suite is the only automated
coverage (`npm test`), the pgTAP RLS test is manual, and there are currently no unit tests (a
flagged gap, not a decision).

**Use it when**: finishing a feature and deciding what to run before calling it complete, or
deciding whether/how to add a new kind of test.

**Sample scenario**: "I changed the CSV column-mapping logic in `ImportWorkspace.tsx`." → this
skill tells you to extend `tests/e2e/pawshop.spec.ts`'s import-flow test rather than starting a
second spec file, and points you at the (not-yet-decided) Vitest proposal if you'd rather unit
test that logic directly instead of only through the browser.

## deployment-checklist

**What it's for**: what env vars are actually read (`NEXT_PUBLIC_SUPABASE_URL` +
publishable/anon key), that there's no `vercel.json` or CI pipeline yet, and the pre-deploy steps
that are realistic given that.

**Use it when**: about to deploy, or setting up a new environment (staging, a second Supabase
project, etc.).

**Sample scenario**: "I want to deploy this to a fresh Vercel project pointed at a new Supabase
project." → this skill's checklist reminds you the 4 migrations must be applied to that new
project first (nothing does this automatically), which two env vars to set, and flags that there's
no CI running `npm test`/`npm run build` today, so you need to run them yourself before deploying.

## vet-domain-glossary

**What it's for**: the actual domain entities (`Product`, `Organization`, `OrganizationMember`,
`ImportJob`/`ImportRow`, `WebhookEvent`, `PlatformAdmin`) and the domain rules enforced today —
explicitly **not** a vet/clinic/patient/appointment domain, despite the project name.

**Use it when**: you're about to build a feature and want to check whether an entity/rule you're
assuming ("owners", "pets", "appointments") actually exists in this codebase before writing code
against it.

**Sample scenario**: "Add a field to track which pet an order is for." → this skill flags that
there is no `pet`/`owner`/`patient` entity in this schema at all — that would be new scope, not an
extension of an existing one — so you should confirm the domain pivot with the user before
building it.
