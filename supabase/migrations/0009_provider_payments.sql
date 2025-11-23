-- Pagos reportados por proveedores (comprobantes de suscripción)
create table if not exists provider_payments (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  period_label text not null,
  proof_url text not null,
  status text not null default 'pending',
  note text,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint provider_payments_status_check check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists provider_payments_provider_idx on provider_payments(provider_id);
create index if not exists provider_payments_status_idx on provider_payments(status);
create index if not exists provider_payments_created_idx on provider_payments(created_at desc);
