-- Run after `supabase start` with: psql "$DATABASE_URL" -f supabase/tests/rls.sql
-- These assertions prove tenant B cannot read or mutate tenant A's records.
begin;
select plan(8);

select tests.create_supabase_user('alice');
select tests.create_supabase_user('bob');
select tests.create_supabase_user('carol');

insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Alice Shop'),
  ('10000000-0000-0000-0000-000000000002', 'Bob Shop');
insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', tests.get_supabase_uid('alice'), 'owner'),
  ('10000000-0000-0000-0000-000000000002', tests.get_supabase_uid('bob'), 'owner');
insert into public.products (organization_id, name, category, price, stock, status) values
  ('10000000-0000-0000-0000-000000000001', 'Alice Product', 'Test', 10, 1, 'active'),
  ('10000000-0000-0000-0000-000000000002', 'Bob Product', 'Test', 10, 1, 'active');

select tests.authenticate_as('alice');
select results_eq('select count(*)::integer from public.products', array[1], 'Alice sees one product');
select results_eq($$select name from public.products$$, array['Alice Product'], 'Alice sees only her tenant');
select is_empty($$update public.products set name = 'stolen' where organization_id = '10000000-0000-0000-0000-000000000002' returning name$$, 'Alice cannot update Bob product');

-- Membership management: only owner/admin of the org may add members or change roles.
select results_eq(
  $$insert into public.organization_members (organization_id, user_id, role)
    values ('10000000-0000-0000-0000-000000000001', tests.get_supabase_uid('carol'), 'viewer')
    returning role$$,
  array['viewer'],
  'Alice (owner) adds Carol to her own org');
select results_eq(
  $$update public.organization_members set role = 'operator'
    where organization_id = '10000000-0000-0000-0000-000000000001'
      and user_id = tests.get_supabase_uid('carol')
    returning role$$,
  array['operator'],
  'Alice changes Carol''s role');
select is_empty(
  $$update public.organization_members set role = 'admin'
    where organization_id = '10000000-0000-0000-0000-000000000001'
      and user_id = tests.get_supabase_uid('alice')
    returning role$$,
  'Alice cannot change her own role');

select tests.authenticate_as('bob');
select results_eq($$select name from public.products$$, array['Bob Product'], 'Bob sees only his tenant');
-- Denied inserts raise 42501 under RLS (unlike updates, which just filter rows).
select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, role)
    values ('10000000-0000-0000-0000-000000000001', tests.get_supabase_uid('bob'), 'owner')$$,
  '42501',
  null,
  'Bob cannot add himself to Alice''s org');

select * from finish();
rollback;
