-- Public product images, stored under <organization_id>/<random filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read product images" on storage.objects;
create policy "members read product images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-images'
    and (
      public.is_org_member(((storage.foldername(name))[1])::uuid)
      or public.is_platform_admin()
    )
  );

drop policy if exists "managers upload product images" on storage.objects;
create policy "managers upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (
      public.can_manage_org(((storage.foldername(name))[1])::uuid)
      or public.is_platform_admin()
    )
  );

drop policy if exists "managers update product images" on storage.objects;
create policy "managers update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (
      public.can_manage_org(((storage.foldername(name))[1])::uuid)
      or public.is_platform_admin()
    )
  )
  with check (
    bucket_id = 'product-images'
    and (
      public.can_manage_org(((storage.foldername(name))[1])::uuid)
      or public.is_platform_admin()
    )
  );

drop policy if exists "managers delete product images" on storage.objects;
create policy "managers delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (
      public.can_manage_org(((storage.foldername(name))[1])::uuid)
      or public.is_platform_admin()
    )
  );
