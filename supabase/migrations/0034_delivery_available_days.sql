-- Modo de entrega por días disponibles por zona

create table if not exists public.provider_delivery_settings (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  mode text not null default 'windows' check (mode in ('windows', 'available_days')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger provider_delivery_settings_updated_at
before update on public.provider_delivery_settings
for each row execute function public.set_updated_at();

create index if not exists provider_delivery_settings_mode_idx on public.provider_delivery_settings(mode);

create table if not exists public.delivery_zone_available_days (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  zone_id uuid not null references public.delivery_zones(id) on delete cascade,
  delivery_weekday integer not null check (delivery_weekday between 0 and 6),
  cutoff_time_minutes integer not null default 1200,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists delivery_zone_available_days_provider_idx on public.delivery_zone_available_days(provider_id);
create index if not exists delivery_zone_available_days_zone_idx on public.delivery_zone_available_days(zone_id);
create unique index if not exists delivery_zone_available_days_unique
  on public.delivery_zone_available_days(zone_id, delivery_weekday);

alter table if exists public.delivery_zone_available_days enable row level security;
alter table if exists public.provider_delivery_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'provider_delivery_settings' and policyname = 'Delivery settings/select'
  ) then
    create policy "Delivery settings/select"
      on public.provider_delivery_settings
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = provider_delivery_settings.provider_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'provider_delivery_settings' and policyname = 'Delivery settings/upsert'
  ) then
    create policy "Delivery settings/upsert"
      on public.provider_delivery_settings
      for all
      using (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = provider_delivery_settings.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = provider_delivery_settings.provider_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_zone_available_days' and policyname = 'Available days/select'
  ) then
    create policy "Available days/select"
      on public.delivery_zone_available_days
      for select
      using (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = delivery_zone_available_days.provider_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_zone_available_days' and policyname = 'Available days/insert'
  ) then
    create policy "Available days/insert"
      on public.delivery_zone_available_days
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = delivery_zone_available_days.provider_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_zone_available_days' and policyname = 'Available days/update'
  ) then
    create policy "Available days/update"
      on public.delivery_zone_available_days
      for update
      using (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = delivery_zone_available_days.provider_id)
        )
      )
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = delivery_zone_available_days.provider_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_zone_available_days' and policyname = 'Available days/delete'
  ) then
    create policy "Available days/delete"
      on public.delivery_zone_available_days
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.users u
          where u.id = auth.uid() and (u.role = 'admin' or u.provider_id = delivery_zone_available_days.provider_id)
        )
      );
  end if;
end $$;
