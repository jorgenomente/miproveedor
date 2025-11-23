-- Add tags array to products for quick filtering in el link público y panel
alter table if exists public.products
  add column if not exists tags text[] not null default '{}';

-- Index to speed up filters by tag
create index if not exists products_tags_idx on public.products using gin (tags);
