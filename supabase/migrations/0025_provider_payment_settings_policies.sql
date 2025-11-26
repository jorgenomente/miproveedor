-- Habilita RLS y políticas para public.provider_payment_settings
alter table if exists public.provider_payment_settings enable row level security;

-- Lectura: service_role, admin o usuarios del mismo proveedor
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_payment_settings'
      and policyname = 'PaymentSettings/select by provider or admin'
  ) then
    create policy "PaymentSettings/select by provider or admin"
      on public.provider_payment_settings
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payment_settings.provider_id)
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
      and tablename = 'provider_payment_settings'
      and policyname = 'PaymentSettings/insert by provider or admin'
  ) then
    create policy "PaymentSettings/insert by provider or admin"
      on public.provider_payment_settings
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payment_settings.provider_id)
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
      and tablename = 'provider_payment_settings'
      and policyname = 'PaymentSettings/update by provider or admin'
  ) then
    create policy "PaymentSettings/update by provider or admin"
      on public.provider_payment_settings
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payment_settings.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and (u.role = 'admin' or u.provider_id = provider_payment_settings.provider_id)
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
      and tablename = 'provider_payment_settings'
      and policyname = 'PaymentSettings/delete admin or service'
  ) then
    create policy "PaymentSettings/delete admin or service"
      on public.provider_payment_settings
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
