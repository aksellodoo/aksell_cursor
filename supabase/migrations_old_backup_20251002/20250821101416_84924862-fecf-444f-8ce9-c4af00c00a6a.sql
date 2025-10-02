
-- Verificar se existem outras tabelas relacionadas aos produtos do site que precisam das mesmas políticas
-- site_product_names: permitir INSERT/UPDATE/DELETE a quem tem 'ver_modificar'
do $$
begin
  -- Habilitar RLS se a tabela existir
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'site_product_names') then
    alter table public.site_product_names enable row level security;
    
    -- INSERT
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_names' 
        and policyname = 'Site product names: write by department permission'
    ) then
      create policy "Site product names: write by department permission"
        on public.site_product_names
        for insert
        with check (public.can_modify_site_products(auth.uid()));
    end if;

    -- UPDATE
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_names' 
        and policyname = 'Site product names: update by department permission'
    ) then
      create policy "Site product names: update by department permission"
        on public.site_product_names
        for update
        using (public.can_modify_site_products(auth.uid()))
        with check (public.can_modify_site_products(auth.uid()));
    end if;

    -- DELETE
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_names' 
        and policyname = 'Site product names: delete by department permission'
    ) then
      create policy "Site product names: delete by department permission"
        on public.site_product_names
        for delete
        using (public.can_modify_site_products(auth.uid()));
    end if;
  end if;
end$$;

-- site_product_segments_map: permitir INSERT/UPDATE/DELETE a quem tem 'ver_modificar'
do $$
begin
  -- Habilitar RLS se a tabela existir
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'site_product_segments_map') then
    alter table public.site_product_segments_map enable row level security;
    
    -- INSERT
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_segments_map' 
        and policyname = 'Site product segments map: write by department permission'
    ) then
      create policy "Site product segments map: write by department permission"
        on public.site_product_segments_map
        for insert
        with check (public.can_modify_site_products(auth.uid()));
    end if;

    -- UPDATE
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_segments_map' 
        and policyname = 'Site product segments map: update by department permission'
    ) then
      create policy "Site product segments map: update by department permission"
        on public.site_product_segments_map
        for update
        using (public.can_modify_site_products(auth.uid()))
        with check (public.can_modify_site_products(auth.uid()));
    end if;

    -- DELETE
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' and tablename = 'site_product_segments_map' 
        and policyname = 'Site product segments map: delete by department permission'
    ) then
      create policy "Site product segments map: delete by department permission"
        on public.site_product_segments_map
        for delete
        using (public.can_modify_site_products(auth.uid()));
    end if;
  end if;
end$$;
