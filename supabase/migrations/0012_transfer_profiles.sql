-- Cuentas de transferencia múltiples por proveedor

create table if not exists public.provider_transfer_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  label text,
  alias text,
  cbu text,
  extra_info text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_transfer_profiles_provider_idx on public.provider_transfer_profiles(provider_id);

create trigger provider_transfer_profiles_updated_at
before update on public.provider_transfer_profiles
for each row execute function public.set_updated_at();

-- Migrar datos existentes de alias/CBU únicos a perfiles
insert into public.provider_transfer_profiles (provider_id, label, alias, cbu, extra_info, is_active)
select
  provider_id,
  'Cuenta principal' as label,
  transfer_alias,
  transfer_cbu,
  transfer_notes,
  true as is_active
from public.provider_payment_settings
where (
  transfer_alias is not null and length(trim(transfer_alias)) > 0
)
or (
  transfer_cbu is not null and length(trim(transfer_cbu)) > 0
)
on conflict do nothing;
