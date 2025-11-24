-- Métodos de pago configurables por proveedor y campos de pago en pedidos

-- Tabla de settings de pago por proveedor
create table if not exists public.provider_payment_settings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  cash_enabled boolean not null default true,
  transfer_enabled boolean not null default true,
  transfer_alias text,
  transfer_cbu text,
  transfer_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint provider_payment_settings_provider_unique unique (provider_id)
);

create index if not exists provider_payment_settings_provider_idx on public.provider_payment_settings(provider_id);

create trigger provider_payment_settings_updated_at
before update on public.provider_payment_settings
for each row execute function public.set_updated_at();

-- Campos de pago en pedidos
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'payment_method'
  ) then
    alter table public.orders
      add column payment_method text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'payment_proof_status'
  ) then
    alter table public.orders
      add column payment_proof_status text not null default 'no_aplica';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'payment_proof_url'
  ) then
    alter table public.orders
      add column payment_proof_url text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'orders' and constraint_name = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('efectivo', 'transferencia'));
  end if;

  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'orders' and constraint_name = 'orders_payment_proof_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_proof_status_check
      check (payment_proof_status in ('no_aplica', 'pendiente', 'subido'));
  end if;
end $$;

-- Inicializar valores existentes
update public.orders
set payment_proof_status = coalesce(payment_proof_status, 'no_aplica')
where payment_proof_status is null;
