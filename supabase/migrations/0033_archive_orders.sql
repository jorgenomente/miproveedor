-- Soft delete / archivo de pedidos

alter table orders
add column if not exists is_archived boolean not null default false,
add column if not exists archived_at timestamptz;

create index if not exists orders_is_archived_idx on orders (is_archived, provider_id);

-- Demo orders table (usada para modo demo en el panel)
alter table if exists demo_orders
add column if not exists is_archived boolean not null default false,
add column if not exists archived_at timestamptz;
