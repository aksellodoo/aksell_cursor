
-- Garantir RLS habilitado (idempotente)
alter table if exists public.site_product_applications enable row level security;

-- Permitir que quem tem 'ver_modificar' em "Dados do Site" veja TODAS as aplicações (ativas e inativas)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'site_product_applications' 
      and policyname = 'Applications: select by department permission'
  ) then
    create policy "Applications: select by department permission"
      on public.site_product_applications
      for select
      using (public.can_modify_site_products(auth.uid()));
  end if;
end$$;

-- Permitir INSERT para quem tem 'ver_modificar'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'site_product_applications' 
      and policyname = 'Applications: write by department permission'
  ) then
    create policy "Applications: write by department permission"
      on public.site_product_applications
      for insert
      with check (public.can_modify_site_products(auth.uid()));
  end if;
end$$;

-- Permitir UPDATE para quem tem 'ver_modificar'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'site_product_applications' 
      and policyname = 'Applications: update by department permission'
  ) then
    create policy "Applications: update by department permission"
      on public.site_product_applications
      for update
      using (public.can_modify_site_products(auth.uid()))
      with check (public.can_modify_site_products(auth.uid()));
  end if;
end$$;

-- Permitir DELETE para quem tem 'ver_modificar'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'site_product_applications' 
      and policyname = 'Applications: delete by department permission'
  ) then
    create policy "Applications: delete by department permission"
      on public.site_product_applications
      for delete
      using (public.can_modify_site_products(auth.uid()));
  end if;
end$$;
