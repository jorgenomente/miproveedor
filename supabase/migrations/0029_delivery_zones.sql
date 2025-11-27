-- Ensure delivery_zones table exists to store shipping costs by locality
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists delivery_zones_provider_id_idx on public.delivery_zones(provider_id);
create index if not exists delivery_zones_provider_active_idx on public.delivery_zones(provider_id, is_active);

alter table if exists public.orders
  add column if not exists delivery_zone_id uuid references public.delivery_zones(id),
  add column if not exists shipping_cost numeric(12,2) default 0;

alter table if exists public.demo_orders
  add column if not exists delivery_zone_name text,
  add column if not exists shipping_cost numeric(12,2) default 0;
