-- Habilita realtime y lectura pública para pedidos demo.
alter publication supabase_realtime add table public.demo_orders;

alter table public.demo_orders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'demo_orders' and policyname = 'Public select demo orders') then
    create policy "Public select demo orders" on public.demo_orders for select using (true);
  end if;
end$$;
