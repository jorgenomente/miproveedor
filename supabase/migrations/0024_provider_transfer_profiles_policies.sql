-- Habilita RLS y políticas para public.provider_transfer_profiles
alter table if exists public.provider_transfer_profiles enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_transfer_profiles'
      and policyname = 'TransferProfiles/select by provider or admin'
  ) then
    create policy "TransferProfiles/select by provider or admin"
      on public.provider_transfer_profiles
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_transfer_profiles.provider_id)
        )
      );
  end if;
end $$;

-- Inserción: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_transfer_profiles'
      and policyname = 'TransferProfiles/insert by provider or admin'
  ) then
    create policy "TransferProfiles/insert by provider or admin"
      on public.provider_transfer_profiles
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_transfer_profiles.provider_id)
        )
      );
  end if;
end $$;

-- Actualización: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_transfer_profiles'
      and policyname = 'TransferProfiles/update by provider or admin'
  ) then
    create policy "TransferProfiles/update by provider or admin"
      on public.provider_transfer_profiles
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_transfer_profiles.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_transfer_profiles.provider_id)
        )
      );
  end if;
end $$;

-- Borrado: service_role o admin
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_transfer_profiles'
      and policyname = 'TransferProfiles/delete admin or service'
  ) then
    create policy "TransferProfiles/delete admin or service"
      on public.provider_transfer_profiles
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      );
  end if;
end $$;
