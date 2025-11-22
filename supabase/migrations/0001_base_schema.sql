-- Base schema for MiProveedor without Prisma.
-- Run this in Supabase SQL editor or via `supabase db push --db-url <DATABASE_URL>`.

create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role') then
    create type public.role as enum ('admin', 'provider');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('nuevo', 'preparando', 'enviado', 'entregado', 'cancelado');
  end if;
end $$;

-- Trigger helper to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Providers
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  contact_email text not null,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger providers_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

-- Users (links Supabase Auth user id to provider + role)
create table if not exists public.users (
  id uuid primary key,
  name text,
  email text not null unique,
  role public.role not null,
  provider_id uuid references public.providers(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Clients (tiendas)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  slug text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_provider_slug_key unique (provider_id, slug)
);

create index if not exists clients_provider_id_idx on public.clients (provider_id);

create trigger clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null,
  unit text,
  is_active boolean not null default true,
  image_url text,
  category text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_provider_id_idx on public.products (provider_id);

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status public.order_status not null default 'nuevo',
  contact_name text not null,
  contact_phone text not null,
  delivery_method text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_provider_id_idx on public.orders (provider_id);
create index if not exists orders_client_id_idx on public.orders (client_id);
create index if not exists orders_status_idx on public.orders (status);

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(12,2) not null
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
