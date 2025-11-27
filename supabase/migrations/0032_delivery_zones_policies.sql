-- Habilita RLS y políticas para public.delivery_zones
alter table if exists public.delivery_zones enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_zones'
      and policyname = 'Delivery zones/select by provider or admin'
  ) then
    create policy "Delivery zones/select by provider or admin"
      on public.delivery_zones
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = delivery_zones.provider_id)
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
      and tablename = 'delivery_zones'
      and policyname = 'Delivery zones/insert by provider or admin'
  ) then
    create policy "Delivery zones/insert by provider or admin"
      on public.delivery_zones
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = delivery_zones.provider_id)
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
      and tablename = 'delivery_zones'
      and policyname = 'Delivery zones/update by provider or admin'
  ) then
    create policy "Delivery zones/update by provider or admin"
      on public.delivery_zones
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = delivery_zones.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = delivery_zones.provider_id)
        )
      );
  end if;
end $$;

-- Borrado: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'delivery_zones'
      and policyname = 'Delivery zones/delete by provider or admin'
  ) then
    create policy "Delivery zones/delete by provider or admin"
      on public.delivery_zones
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = delivery_zones.provider_id)
        )
      );
  end if;
end $$;
