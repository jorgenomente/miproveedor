-- Habilita RLS y políticas para public.order_items
alter table if exists public.order_items enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor (según el pedido)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'OrderItems/select by provider or admin'
  ) then
    create policy "OrderItems/select by provider or admin"
      on public.order_items
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.orders o
          join public.users u on u.id = auth.uid()
          where o.id = order_items.order_id
            and (u.role = 'admin' or u.provider_id = o.provider_id)
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
      and tablename = 'order_items'
      and policyname = 'OrderItems/insert by provider or admin'
  ) then
    create policy "OrderItems/insert by provider or admin"
      on public.order_items
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.orders o
          join public.users u on u.id = auth.uid()
          where o.id = order_items.order_id
            and (u.role = 'admin' or u.provider_id = o.provider_id)
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
      and tablename = 'order_items'
      and policyname = 'OrderItems/update by provider or admin'
  ) then
    create policy "OrderItems/update by provider or admin"
      on public.order_items
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.orders o
          join public.users u on u.id = auth.uid()
          where o.id = order_items.order_id
            and (u.role = 'admin' or u.provider_id = o.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.orders o
          join public.users u on u.id = auth.uid()
          where o.id = order_items.order_id
            and (u.role = 'admin' or u.provider_id = o.provider_id)
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
      and tablename = 'order_items'
      and policyname = 'OrderItems/delete by provider or admin'
  ) then
    create policy "OrderItems/delete by provider or admin"
      on public.order_items
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.orders o
          join public.users u on u.id = auth.uid()
          where o.id = order_items.order_id
            and (u.role = 'admin' or u.provider_id = o.provider_id)
        )
      );
  end if;
end $$;
