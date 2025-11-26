-- Habilita RLS y políticas para public.client_payments
alter table if exists public.client_payments enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'client_payments'
      and policyname = 'ClientPayments/select by provider or admin'
  ) then
    create policy "ClientPayments/select by provider or admin"
      on public.client_payments
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (
              u.role = 'admin'
              or u.provider_id = client_payments.provider_id
            )
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
      and tablename = 'client_payments'
      and policyname = 'ClientPayments/insert by provider or admin'
  ) then
    create policy "ClientPayments/insert by provider or admin"
      on public.client_payments
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (
              u.role = 'admin'
              or u.provider_id = client_payments.provider_id
            )
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
      and tablename = 'client_payments'
      and policyname = 'ClientPayments/update by provider or admin'
  ) then
    create policy "ClientPayments/update by provider or admin"
      on public.client_payments
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (
              u.role = 'admin'
              or u.provider_id = client_payments.provider_id
            )
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (
              u.role = 'admin'
              or u.provider_id = client_payments.provider_id
            )
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
      and tablename = 'client_payments'
      and policyname = 'ClientPayments/delete admin or service'
  ) then
    create policy "ClientPayments/delete admin or service"
      on public.client_payments
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
