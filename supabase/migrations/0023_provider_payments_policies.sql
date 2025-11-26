-- Habilita RLS y políticas para public.provider_payments
alter table if exists public.provider_payments enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_payments'
      and policyname = 'ProviderPayments/select by provider or admin'
  ) then
    create policy "ProviderPayments/select by provider or admin"
      on public.provider_payments
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payments.provider_id)
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
      and tablename = 'provider_payments'
      and policyname = 'ProviderPayments/insert by provider or admin'
  ) then
    create policy "ProviderPayments/insert by provider or admin"
      on public.provider_payments
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payments.provider_id)
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
      and tablename = 'provider_payments'
      and policyname = 'ProviderPayments/update by provider or admin'
  ) then
    create policy "ProviderPayments/update by provider or admin"
      on public.provider_payments
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payments.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payments.provider_id)
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
      and tablename = 'provider_payments'
      and policyname = 'ProviderPayments/delete admin or service'
  ) then
    create policy "ProviderPayments/delete admin or service"
      on public.provider_payments
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
