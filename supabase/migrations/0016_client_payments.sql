-- Pagos por cliente para seguimiento de cuentas corrientes
create table if not exists client_payments (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  method text check (method in ('efectivo', 'transferencia')),
  reference text,
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_payments_provider_idx on client_payments(provider_id);
create index if not exists client_payments_client_idx on client_payments(client_id);
create index if not exists client_payments_status_idx on client_payments(status);
create index if not exists client_payments_paid_idx on client_payments(paid_at desc nulls last, created_at desc);

-- Pagos demo persistidos en Supabase (sin FK para simplicidad)
create table if not exists demo_client_payments (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null,
  client_slug text not null,
  order_id text,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  method text check (method in ('efectivo', 'transferencia')),
  reference text,
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists demo_client_payments_provider_idx on demo_client_payments(provider_slug);
create index if not exists demo_client_payments_client_idx on demo_client_payments(client_slug);
create index if not exists demo_client_payments_created_idx on demo_client_payments(created_at desc);
