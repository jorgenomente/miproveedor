-- Habilita RLS y políticas para public.client_order_drafts
alter table if exists public.client_order_drafts enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'client_order_drafts'
      and policyname = 'Client order drafts/select by provider or admin'
  ) then
    create policy "Client order drafts/select by provider or admin"
      on public.client_order_drafts
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = client_order_drafts.provider_id)
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
      and tablename = 'client_order_drafts'
      and policyname = 'Client order drafts/insert by provider or admin'
  ) then
    create policy "Client order drafts/insert by provider or admin"
      on public.client_order_drafts
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = client_order_drafts.provider_id)
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
      and tablename = 'client_order_drafts'
      and policyname = 'Client order drafts/update by provider or admin'
  ) then
    create policy "Client order drafts/update by provider or admin"
      on public.client_order_drafts
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = client_order_drafts.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = client_order_drafts.provider_id)
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
      and tablename = 'client_order_drafts'
      and policyname = 'Client order drafts/delete by provider or admin'
  ) then
    create policy "Client order drafts/delete by provider or admin"
      on public.client_order_drafts
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = client_order_drafts.provider_id)
        )
      );
  end if;
end $$;
