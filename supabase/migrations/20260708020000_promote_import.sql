-- Atomically stage reviewed rows and promote valid products.
create or replace function public.promote_product_import(
  p_organization_id uuid,
  p_file_name text,
  p_column_mapping jsonb,
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job_id uuid;
  v_item jsonb;
  v_payload jsonb;
  v_status text;
  v_row_id bigint;
  v_product_id uuid;
  v_promoted integer := 0;
  v_duplicates integer := 0;
  v_errors integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_manage_org(p_organization_id)
     and not public.is_platform_admin() then
    raise exception 'You cannot import into this organization';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'At least one reviewed row is required';
  end if;

  insert into public.import_jobs (
    organization_id, file_name, status, column_mapping, created_by
  ) values (
    p_organization_id, p_file_name, 'reviewed', p_column_mapping, auth.uid()
  ) returning id into v_job_id;

  for v_item in select value from jsonb_array_elements(p_rows)
  loop
    v_payload := v_item -> 'payload';
    v_status := coalesce(v_item ->> 'status', 'error');

    -- Recheck against production inside the same transaction. This makes a
    -- repeated upload duplicate-safe even if the browser review was stale.
    if v_status = 'ready' and exists (
      select 1 from public.products
      where organization_id = p_organization_id
        and lower(name) = lower(v_payload ->> 'name')
    ) then
      v_status := 'duplicate';
    end if;

    insert into public.import_rows (
      import_job_id,
      organization_id,
      row_number,
      payload,
      validation_status,
      validation_errors
    ) values (
      v_job_id,
      p_organization_id,
      (v_item ->> 'row_number')::integer,
      v_payload,
      v_status,
      case
        when v_status = 'duplicate' then '["Product name already exists"]'::jsonb
        when v_status = 'error' then jsonb_build_array(coalesce(v_item ->> 'message', 'Invalid row'))
        else '[]'::jsonb
      end
    ) returning id into v_row_id;

    if v_status = 'ready' then
      insert into public.products (
        organization_id, name, category, price, stock, status
      ) values (
        p_organization_id,
        trim(v_payload ->> 'name'),
        trim(v_payload ->> 'category'),
        (v_payload ->> 'price')::numeric,
        (v_payload ->> 'stock')::integer,
        case when v_payload ->> 'status' in ('active', 'inactive')
          then v_payload ->> 'status' else 'active' end
      ) returning id into v_product_id;

      update public.import_rows
      set promoted_product_id = v_product_id
      where id = v_row_id;
      v_promoted := v_promoted + 1;
    elsif v_status = 'duplicate' then
      v_duplicates := v_duplicates + 1;
    else
      v_errors := v_errors + 1;
    end if;
  end loop;

  update public.import_jobs
  set status = 'promoted', promoted_at = now()
  where id = v_job_id;

  return jsonb_build_object(
    'job_id', v_job_id,
    'promoted', v_promoted,
    'duplicates', v_duplicates,
    'errors', v_errors
  );
end;
$$;

revoke all on function public.promote_product_import(uuid, text, jsonb, jsonb) from public;
grant execute on function public.promote_product_import(uuid, text, jsonb, jsonb) to authenticated;
