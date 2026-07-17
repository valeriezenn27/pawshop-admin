---
name: rls-policies
description: How tenant isolation via RLS actually works in PawShop Admin, and how to extend it to a new table
---

# RLS policies in PawShop Admin

Tenant isolation is enforced **entirely at the database level** via Postgres Row Level Security.
The scoping column is `organization_id` (uuid, FK to `organizations.id`) — this repo does not use
`tenant_id` or `clinic_id`. Application code does not add `.eq("organization_id", ...)` filters on
reads; RLS does that job.

## The two helper functions everything is built on

Defined once in `supabase/migrations/20260708000000_secure_imports.sql`, reused by every policy:

```sql
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_org(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'operator')
  );
$$;
```

- `is_org_member` — any role (`owner|admin|operator|viewer`) can read.
- `can_manage_org` — everything except `viewer` can write.

Both are `security definer` so they can read `organization_members` regardless of the calling
user's own RLS restrictions on that table, and `stable` since they only read within one statement.

## The policy template for a new tenant-scoped table

When adding a new table that belongs to an organization, follow this exact shape (from the same
migration):

```sql
alter table public.<new_table> enable row level security;

create policy "members read <new_table>" on public.<new_table>
  for select to authenticated using (public.is_org_member(organization_id));

create policy "managers create <new_table>" on public.<new_table>
  for insert to authenticated with check (public.can_manage_org(organization_id));

create policy "managers update <new_table>" on public.<new_table>
  for update to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

create policy "managers delete <new_table>" on public.<new_table>
  for delete to authenticated using (public.can_manage_org(organization_id));
```

Checklist for a new table:
1. Add `organization_id uuid not null references public.organizations(id) on delete cascade`.
2. `enable row level security` — don't forget this; a table without it is fully open once RLS is
   enforced elsewhere gives a false sense of security.
3. Add all four policies above (or a subset, deliberately — e.g. an audit-log table might be
   insert-only for managers and never updatable). Don't reuse `auth.uid()` checks written inline
   per table; always go through `is_org_member`/`can_manage_org` (or a new named helper function
   if the check is genuinely different) so the logic stays in one place.
4. Add an index on `organization_id` (every existing tenant-scoped table has one, e.g.
   `products_organization_id_idx`).
5. If the table needs a platform-admin override, add a **separate, explicit** policy following
   `20260708010000_platform_admin.sql`'s pattern:
   ```sql
   create policy "platform admins manage <new_table>" on public.<new_table>
     for all to authenticated
     using (public.is_platform_admin())
     with check (public.is_platform_admin());
   ```
6. If the table should be **server-only** (like `webhook_events`), enable RLS and add **no**
   policies at all — that's what makes it inaccessible to the `authenticated`/`anon` roles while
   still being reachable via the service-role key server-side. Leave a comment explaining that
   omission is intentional (see the `-- Webhook events intentionally have no client policy`
   comment in the migration) so it isn't "fixed" later by someone assuming it's a bug.

## Roles

`organization_members.role` is one of `owner | admin | operator | viewer`, enforced by a `check`
constraint. `viewer` is read-only; the other three can manage. There's no finer-grained
permission model than this — don't invent additional roles without a migration that also updates
the `check` constraint and both helper functions.

## Testing isolation between tenants

`supabase/tests/rls.sql` is a pgTAP script that creates two users (`alice`, `bob`) in two separate
organizations, and asserts:
1. Alice sees exactly one product, and it's hers.
2. Alice cannot `UPDATE` a product belonging to Bob's org (the statement returns zero rows).
3. Bob sees only his own product.

Run it after starting the local stack:

```bash
npx supabase start
psql "$DATABASE_URL" -f supabase/tests/rls.sql
```

This is **not** wired into `npm test` (Playwright) — it must be run manually. If you add RLS
policies to a new table, extend `rls.sql` with equivalent assertions (create two tenants' worth of
rows, authenticate as each, assert cross-tenant reads/writes are blocked) rather than trusting the
policy SQL by inspection alone.

## Defense in depth beyond RLS

The one exception to "app code never re-checks tenant scope" is
`promote_product_import` (`supabase/migrations/20260708020000_promote_import.sql`), a
`security invoker` RPC that explicitly re-checks `can_manage_org`/`is_platform_admin` inside the
function body before doing anything, in addition to whatever RLS would enforce on the underlying
inserts. This is because it's a privileged, multi-step transaction — if you write a similar RPC
that performs several inserts atomically, add the same explicit guard at the top rather than
trusting that RLS alone covers a function running as `security invoker`.
