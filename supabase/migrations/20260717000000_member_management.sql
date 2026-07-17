-- Organization admins (owner/admin) can add members and change member roles.
-- Operators can manage inventory but not people; viewers stay read-only.
-- Auth user creation itself happens via the service-role admin API in
-- app/api/users — but the tenant-scoped membership row is inserted with the
-- caller's own client so these policies remain the enforcement boundary.

-- Explicit table grants: the hosted project inherited these from Supabase's
-- platform default privileges, but a from-scratch database (local `db reset`)
-- does not. RLS policies below remain the row-level boundary; grants only
-- open the table to the authenticated role at all.
grant select on public.organizations to authenticated;
grant select, insert, update on public.organization_members to authenticated;

create or replace function public.is_org_admin(org_id uuid)
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
      and role in ('owner', 'admin')
  );
$$;

create policy "org admins add members" on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id));

-- user_id <> auth.uid() blocks self-promotion (an admin cannot make
-- themselves owner). Platform admins bypass this via their own policy.
create policy "org admins change member roles" on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id) and user_id <> auth.uid())
  with check (public.is_org_admin(organization_id) and user_id <> auth.uid());
