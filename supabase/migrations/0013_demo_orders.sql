-- Tabla para persistir pedidos del modo demo por 24h (se limpia por consulta).
create table if not exists public.demo_orders (
    id uuid primary key default gen_random_uuid(),
    provider_slug text not null,
    client_slug text not null,
    status text not null default 'nuevo',
    contact_name text,
    contact_phone text,
    delivery_method text,
    payment_method text,
    payment_proof_status text,
    payment_proof_url text,
    note text,
    items jsonb not null default '[]'::jsonb,
    total numeric(12,2) not null default 0,
    delivery_date timestamptz,
    delivery_rule_id text,
    cutoff_date timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists demo_orders_created_at_idx on public.demo_orders (created_at);
create index if not exists demo_orders_provider_client_idx on public.demo_orders (provider_slug, client_slug);
