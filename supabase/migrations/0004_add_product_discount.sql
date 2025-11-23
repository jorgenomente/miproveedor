-- Add discount percent to products
alter table if exists public.products
  add column if not exists discount_percent numeric(5,2) not null default 0;
