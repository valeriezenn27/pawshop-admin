-- Production-grade tenant isolation and auditable CSV staging.
-- This migration replaces the original public demo policy.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'operator', 'viewer')),
  primary key (organization_id, user_id)
);

alter table public.products add column if not exists organization_id uuid references public.organizations(id);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  status text not null default 'staging' check (status in ('staging', 'reviewed', 'promoted', 'failed')),
  column_mapping jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  promoted_at timestamptz
);

create table if not exists public.import_rows (
  id bigint generated always as identity primary key,
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  row_number integer not null,
  payload jsonb not null,
  validation_status text not null check (validation_status in ('ready', 'duplicate', 'error')),
  validation_errors jsonb not null default '[]'::jsonb,
  promoted_product_id uuid references public.products(id),
  unique (import_job_id, row_number)
);

-- Stripe event IDs are globally unique. The primary key turns webhook retries into no-ops.
create table if not exists public.webhook_events (
  event_id text primary key,
  organization_id uuid references public.organizations(id),
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "Allow all for public" on public.products;

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

create policy "members read own organization" on public.organizations
  for select to authenticated using (public.is_org_member(id));
create policy "members read memberships" on public.organization_members
  for select to authenticated using (public.is_org_member(organization_id));
create policy "members read products" on public.products
  for select to authenticated using (public.is_org_member(organization_id));
create policy "managers create products" on public.products
  for insert to authenticated with check (public.can_manage_org(organization_id));
create policy "managers update products" on public.products
  for update to authenticated using (public.can_manage_org(organization_id)) with check (public.can_manage_org(organization_id));
create policy "managers delete products" on public.products
  for delete to authenticated using (public.can_manage_org(organization_id));
create policy "members read import jobs" on public.import_jobs
  for select to authenticated using (public.is_org_member(organization_id));
create policy "managers create import jobs" on public.import_jobs
  for insert to authenticated with check (public.can_manage_org(organization_id) and created_by = auth.uid());
create policy "managers update import jobs" on public.import_jobs
  for update to authenticated using (public.can_manage_org(organization_id)) with check (public.can_manage_org(organization_id));
create policy "members read staged rows" on public.import_rows
  for select to authenticated using (public.is_org_member(organization_id));
create policy "managers stage rows" on public.import_rows
  for insert to authenticated with check (public.can_manage_org(organization_id));
create policy "managers update staged rows" on public.import_rows
  for update to authenticated using (public.can_manage_org(organization_id)) with check (public.can_manage_org(organization_id));

-- Webhook events intentionally have no client policy. Only the server service role can access them.

create index if not exists products_organization_id_idx on public.products(organization_id);
create index if not exists import_jobs_organization_id_idx on public.import_jobs(organization_id);
create index if not exists import_rows_job_status_idx on public.import_rows(import_job_id, validation_status);
