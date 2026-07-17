---
name: supabase-schema-conventions
description: Migration file conventions, naming, and real relationship patterns in PawShop Admin's Supabase schema
---

# Supabase schema conventions in PawShop Admin

## Migration file naming

`supabase/migrations/YYYYMMDDHHMMSS_description.sql`, e.g.:

```
20240101000000_init.sql
20260708000000_secure_imports.sql
20260708010000_platform_admin.sql
20260708020000_promote_import.sql
```

Description is snake_case, short, describes the change's intent (not just "the table it touches")
— `secure_imports`, `platform_admin`, `promote_import`, not `add_organizations_table`. Each
migration is additive and idempotent where possible (`create table if not exists`,
`create or replace function`), so re-running the full migration history from scratch is safe.

## Real relationship pattern in this schema

```
organizations (id, name, created_at)
  ← organization_members (organization_id, user_id, role)   [composite PK, join table]
  ← products (organization_id, ...)
  ← import_jobs (organization_id, file_name, status, column_mapping, created_by, ...)
      ← import_rows (import_job_id, organization_id, row_number, payload, validation_status, ...)
          → promoted_product_id → products.id   [nullable FK, links a staged row to what it produced]
  ← webhook_events (organization_id nullable, event_id pk, ...)   [server-only, no client RLS]

platform_admins (user_id pk → auth.users.id)   [cross-cutting override, not org-scoped]
```

Conventions to follow for a new table:
- Primary key: `uuid primary key default gen_random_uuid()` for most tables; `bigint generated
  always as identity primary key` for high-volume append-only tables (see `import_rows`).
- Tenant FK: `organization_id uuid not null references public.organizations(id) on delete cascade`
  (nullable only if the row can genuinely exist outside a tenant, as `webhook_events` does).
- `created_at timestamptz not null default now()` on every table; add `updated_at` +
  the existing trigger pattern (see `20240101000000_init.sql`'s `updated_at` trigger on `products`)
  if the row is mutable after creation.
- Status/enum-like columns: plain `text` with a `check (status in (...))` constraint, not a
  Postgres `enum` type — e.g. `import_jobs.status check (status in ('staging','reviewed',
  'promoted','failed'))`, `organization_members.role check (role in ('owner','admin','operator',
  'viewer'))`. Follow this, don't introduce a `create type ... as enum` for a new status column.
- Index every foreign key used in an RLS policy predicate — every existing tenant-scoped table has
  a `<table>_organization_id_idx` (or similar) btree index; add one for any new FK you filter/join
  on in a policy.
- RLS: see the `rls-policies` skill — enable it and add policies in the same migration that
  creates the table, not a follow-up migration.

## Functions

Two kinds exist, use whichever matches the job:
- **`security definer`, `stable`, `language sql`** — for cheap boolean predicates used inside RLS
  policies (`is_org_member`, `can_manage_org`, `is_platform_admin`). Always
  `set search_path = public` to avoid search-path hijacking, since `security definer` functions
  run with the definer's privileges.
- **`security invoker`, `language plpgsql`** — for multi-step transactional RPCs called from the
  app via `supabase.rpc(...)` (`promote_product_import`). Explicitly re-check authorization inside
  the function body (don't rely solely on the RLS of the tables it touches), `revoke all ... from
  public`, then `grant execute ... to authenticated` explicitly.

## Known gaps / TODO — don't invent an answer, flag it

- `supabase/schema.sql` is a stale duplicate of the first migration only (predates
  `organization_id`, orgs, RLS). **TODO: decide** whether to regenerate it as a flattened
  reference schema or delete it — don't treat it as current schema documentation.
- `supabase/config.toml` references `db.seed.sql_paths = ["./seed.sql"]` but `supabase/seed.sql`
  does not exist. **TODO: decide** whether to add a seed file (useful for consistent local dev
  data) or remove the reference.
- `lib/supabase.ts` (plain `supabase-js` client, separate ad hoc `Database` type) isn't used
  anywhere. **TODO: decide** whether to delete it or wire up proper generated types
  (`supabase gen types typescript`) as its replacement — right now no file in the repo has
  Supabase-generated TS types at all; `lib/types.ts`'s types are hand-written and can drift from
  the actual schema.
