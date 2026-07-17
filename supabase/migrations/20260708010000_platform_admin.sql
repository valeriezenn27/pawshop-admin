-- Platform administrators can manage all tenants.
-- Membership roles remain scoped to one organization.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  );
$$;

-- Wanda. Platform-admin assignment is intentionally migration/service-role only.
-- Guarded so fresh local databases (where this hosted auth user does not
-- exist) can still run `supabase db reset`; on the hosted project the row
-- inserts as before.
insert into public.platform_admins (user_id)
select id from auth.users where id = 'a700d287-4f91-48bb-9a88-e445e9dff81d'
on conflict (user_id) do nothing;

create policy "platform admins read admin assignments"
  on public.platform_admins
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform admins manage organizations"
  on public.organizations
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage memberships"
  on public.organization_members
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage products"
  on public.products
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage import jobs"
  on public.import_jobs
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage import rows"
  on public.import_rows
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- webhook_events remains server-only even for platform admins because it can
-- contain sensitive payment-provider payloads.
