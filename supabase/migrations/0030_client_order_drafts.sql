-- Drafts for public order links
create table if not exists public.client_order_drafts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists client_order_drafts_provider_client_idx on public.client_order_drafts(provider_id, client_id);
