-- Policies for product images bucket
-- Run via `npx supabase db push`

-- Public read access to product-images bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read product images'
  ) then
    create policy "Public read product images"
      on storage.objects
      for select
      using (bucket_id = 'product-images');
  end if;
end $$;

-- Insert only with service_role
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role write product images'
  ) then
    create policy "Service role write product images"
      on storage.objects
      for insert
      to service_role
      with check (bucket_id = 'product-images');
  end if;
end $$;

-- Update only with service_role
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role update product images'
  ) then
    create policy "Service role update product images"
      on storage.objects
      for update
      to service_role
      using (bucket_id = 'product-images')
      with check (bucket_id = 'product-images');
  end if;
end $$;

-- Delete only with service_role
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role delete product images'
  ) then
    create policy "Service role delete product images"
      on storage.objects
      for delete
      to service_role
      using (bucket_id = 'product-images');
  end if;
end $$;
