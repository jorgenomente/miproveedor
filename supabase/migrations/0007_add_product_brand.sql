-- Marca de producto para filtrar y agrupar catálogos
alter table if exists public.products
  add column if not exists brand text;
