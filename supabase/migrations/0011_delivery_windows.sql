-- Crear tabla de reglas de entrega por proveedor
create table if not exists delivery_windows (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  cutoff_weekday smallint not null check (cutoff_weekday between 0 and 6),
  cutoff_time_minutes integer not null check (cutoff_time_minutes >= 0 and cutoff_time_minutes < 1440),
  delivery_weekday smallint not null check (delivery_weekday between 0 and 6),
  delivery_time_minutes integer not null default 600 check (delivery_time_minutes >= 0 and delivery_time_minutes < 1440),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists delivery_windows_provider_idx on delivery_windows(provider_id);
create unique index if not exists delivery_windows_provider_cutoff_unique
  on delivery_windows(provider_id, cutoff_weekday, cutoff_time_minutes);

-- Campos de pedido para guardar a qué ventana se asignó
alter table orders
  add column if not exists delivery_date timestamptz;

alter table orders
  add column if not exists delivery_rule_id uuid references delivery_windows(id) on delete set null;

create index if not exists orders_delivery_date_idx on orders(delivery_date);
