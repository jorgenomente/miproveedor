-- Habilita RLS y políticas para public.users
alter table if exists public.users enable row level security;

-- Lectura: service_role, admin o el propio usuario
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users/select self or admin'
  ) then
    create policy "Users/select self or admin"
      on public.users
      for select
      using (
        auth.role() = 'service_role'
        or users.id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      );
  end if;
end $$;

-- Inserción: service_role o admin; (opcional) permitir self-insert
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users/insert admin or service or self'
  ) then
    create policy "Users/insert admin or service or self"
      on public.users
      for insert
      with check (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
        or users.id = auth.uid()
      );
  end if;
end $$;

-- Actualización: service_role, admin o el propio usuario
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users/update self or admin'
  ) then
    create policy "Users/update self or admin"
      on public.users
      for update
      using (
        auth.role() = 'service_role'
        or users.id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      )
      with check (
        auth.role() = 'service_role'
        or users.id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      );
  end if;
end $$;

-- Borrado: solo service_role o admin
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users/delete admin or service'
  ) then
    create policy "Users/delete admin or service"
      on public.users
      for delete
      using (
        auth.role() = 'service_role'
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      );
  end if;
end $$;
