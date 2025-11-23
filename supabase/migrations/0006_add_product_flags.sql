-- Flags para resaltar nuevos y marcar sin stock
alter table if exists public.products
  add column if not exists is_new boolean not null default false,
  add column if not exists is_out_of_stock boolean not null default false;
