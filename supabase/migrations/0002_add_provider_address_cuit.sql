-- Add address and cuit to providers
alter table public.providers
  add column if not exists address text,
  add column if not exists cuit text;
