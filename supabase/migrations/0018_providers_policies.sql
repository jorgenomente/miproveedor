-- Habilita RLS y políticas para public.providers
alter table if exists public.providers enable row level security;

-- Lectura: service_role o usuarios que pertenezcan al proveedor o sean admin
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'providers'
      and policyname = 'Providers/select self or admin'
  ) then
    create policy "Providers/select self or admin"
      on public.providers
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = providers.id)
        )
      );
  end if;
end $$;

-- Inserción: service_role o usuarios admin
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'providers'
      and policyname = 'Providers/insert admin or service'
  ) then
    create policy "Providers/insert admin or service"
      on public.providers
      for insert
      with check (
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

-- Actualización: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'providers'
      and policyname = 'Providers/update self or admin'
  ) then
    create policy "Providers/update self or admin"
      on public.providers
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = providers.id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = providers.id)
        )
      );
  end if;
end $$;

-- Borrado: solo service_role o admin
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'providers'
      and policyname = 'Providers/delete admin or service'
  ) then
    create policy "Providers/delete admin or service"
      on public.providers
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
