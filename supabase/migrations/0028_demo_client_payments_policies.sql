-- Habilita RLS y políticas para public.demo_client_payments
alter table if exists public.demo_client_payments enable row level security;

-- Lectura: service_role, admin o usuarios del proveedor dueño del slug
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'demo_client_payments'
      and policyname = 'DemoClientPayments/select by provider or admin'
  ) then
    create policy "DemoClientPayments/select by provider or admin"
      on public.demo_client_payments
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          join public.providers p on p.id = u.provider_id
          where u.id = auth.uid()
            and (u.role = 'admin' or p.slug = demo_client_payments.provider_slug)
        )
      );
  end if;
end $$;

-- Inserción: service_role, admin o usuarios del proveedor dueño del slug
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'demo_client_payments'
      and policyname = 'DemoClientPayments/insert by provider or admin'
  ) then
    create policy "DemoClientPayments/insert by provider or admin"
      on public.demo_client_payments
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          join public.providers p on p.id = u.provider_id
          where u.id = auth.uid()
            and (u.role = 'admin' or p.slug = demo_client_payments.provider_slug)
        )
      );
  end if;
end $$;

-- Actualización: service_role, admin o usuarios del proveedor dueño del slug
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'demo_client_payments'
      and policyname = 'DemoClientPayments/update by provider or admin'
  ) then
    create policy "DemoClientPayments/update by provider or admin"
      on public.demo_client_payments
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          join public.providers p on p.id = u.provider_id
          where u.id = auth.uid()
            and (u.role = 'admin' or p.slug = demo_client_payments.provider_slug)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          join public.providers p on p.id = u.provider_id
          where u.id = auth.uid()
            and (u.role = 'admin' or p.slug = demo_client_payments.provider_slug)
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
      and tablename = 'demo_client_payments'
      and policyname = 'DemoClientPayments/delete admin or service'
  ) then
    create policy "DemoClientPayments/delete admin or service"
      on public.demo_client_payments
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
