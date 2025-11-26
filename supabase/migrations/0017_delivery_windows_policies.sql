-- Habilita RLS y políticas mínimas para delivery_windows
alter table if exists public.delivery_windows enable row level security;

-- Lectura: proveedores autenticados y service_role
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_windows'
      and policyname = 'Providers can read their delivery windows'
  ) then
    create policy "Providers can read their delivery windows"
      on public.delivery_windows
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.provider_id = delivery_windows.provider_id
        )
      );
  end if;
end $$;

-- Inserción
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_windows'
      and policyname = 'Providers can create delivery windows'
  ) then
    create policy "Providers can create delivery windows"
      on public.delivery_windows
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.provider_id = delivery_windows.provider_id
        )
      );
  end if;
end $$;

-- Actualización
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_windows'
      and policyname = 'Providers can update their delivery windows'
  ) then
    create policy "Providers can update their delivery windows"
      on public.delivery_windows
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.provider_id = delivery_windows.provider_id
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.provider_id = delivery_windows.provider_id
        )
      );
  end if;
end $$;

-- Borrado
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_windows'
      and policyname = 'Providers can delete their delivery windows'
  ) then
    create policy "Providers can delete their delivery windows"
      on public.delivery_windows
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.provider_id = delivery_windows.provider_id
        )
      );
  end if;
end $$;
