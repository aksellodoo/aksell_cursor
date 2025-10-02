
-- 1) Função genérica para checar se o usuário tem 'ver_modificar' em uma página
create or replace function public.has_page_modify_permission(page_label text, user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_role       text;
  v_dept       uuid;
  v_is_leader  boolean;
  v_admin_allow boolean := false;
  v_perm_admin     text;
  v_perm_director  text;
  v_perm_hr        text;
  v_perm_leader    text;
  v_perm_user      text;

  -- normaliza: minúsculas e remove espaços/hífens para comparar de forma robusta
  -- ex.: 'Dados do Site' -> 'dadosdosite'
  normalized_target text := regexp_replace(lower(coalesce(page_label, '')), '[-\s]+', '', 'g');
  normalized_db     text;
begin
  -- Obtém papel e departamento do usuário
  select p.role, p.department_id, coalesce(p.is_leader, false)
    into v_role, v_dept, v_is_leader
  from public.profiles p
  where p.id = user_id;

  -- Admin sempre pode modificar
  if v_role = 'admin' then
    return true;
  end if;

  if v_dept is null then
    return false;
  end if;

  -- Busca a linha de permissões do departamento para a página alvo
  -- com normalização do nome da página
  select dp.admin_permission,
         dp.director_permission,
         dp.hr_permission,
         dp.leader_permission,
         dp.user_permission
    into v_perm_admin, v_perm_director, v_perm_hr, v_perm_leader, v_perm_user
  from public.department_permissions dp
  where dp.department_id = v_dept
    and regexp_replace(lower(dp.page_name), '[-\s]+', '', 'g') = normalized_target
  limit 1;

  -- Se não achou linha de permissão, negar (exceto admin que já tratamos)
  if v_perm_admin is null then
    return false;
  end if;

  -- Seleciona a permissão correta de acordo com o papel (e liderança)
  if v_role = 'director' then
    return v_perm_director = 'ver_modificar';
  elsif v_role = 'hr' then
    return v_perm_hr = 'ver_modificar';
  else
    -- usuários comuns: se líder, usa leader_permission; senão, user_permission
    if v_is_leader then
      return v_perm_leader = 'ver_modificar';
    else
      return v_perm_user = 'ver_modificar';
    end if;
  end if;
end;
$$;

-- 2) Função específica para a página "Dados do Site"
create or replace function public.can_modify_site_products(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_page_modify_permission('Dados do Site', p_user_id)
$$;

-- 3) Políticas RLS
-- Observação: habilitar RLS caso ainda não esteja habilitado
alter table if exists public.site_products enable row level security;
alter table if exists public.site_product_groups_map enable row level security;
alter table if exists public.site_product_applications_map enable row level security;

-- site_products: permitir UPDATE/DELETE a quem tem 'ver_modificar' em "Dados do Site"
do $$
begin
  -- UPDATE
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_products' 
      and policyname = 'Site products: modify by department permission'
  ) then
    create policy "Site products: modify by department permission"
      on public.site_products
      for update
      using (public.can_modify_site_products(auth.uid()))
      with check (public.can_modify_site_products(auth.uid()));
  end if;

  -- DELETE
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_products' 
      and policyname = 'Site products: delete by department permission'
  ) then
    create policy "Site products: delete by department permission"
      on public.site_products
      for delete
      using (public.can_modify_site_products(auth.uid()));
  end if;
end$$;

-- site_product_groups_map: permitir INSERT/UPDATE/DELETE a quem tem 'ver_modificar'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_groups_map' 
      and policyname = 'Site product groups map: write by department permission'
  ) then
    create policy "Site product groups map: write by department permission"
      on public.site_product_groups_map
      for insert
      with check (public.can_modify_site_products(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_groups_map' 
      and policyname = 'Site product groups map: update by department permission'
  ) then
    create policy "Site product groups map: update by department permission"
      on public.site_product_groups_map
      for update
      using (public.can_modify_site_products(auth.uid()))
      with check (public.can_modify_site_products(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_groups_map' 
      and policyname = 'Site product groups map: delete by department permission'
  ) then
    create policy "Site product groups map: delete by department permission"
      on public.site_product_groups_map
      for delete
      using (public.can_modify_site_products(auth.uid()));
  end if;
end$$;

-- site_product_applications_map: permitir INSERT/UPDATE/DELETE a quem tem 'ver_modificar'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_applications_map' 
      and policyname = 'Site product applications map: write by department permission'
  ) then
    create policy "Site product applications map: write by department permission"
      on public.site_product_applications_map
      for insert
      with check (public.can_modify_site_products(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_applications_map' 
      and policyname = 'Site product applications map: update by department permission'
  ) then
    create policy "Site product applications map: update by department permission"
      on public.site_product_applications_map
      for update
      using (public.can_modify_site_products(auth.uid()))
      with check (public.can_modify_site_products(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'site_product_applications_map' 
      and policyname = 'Site product applications map: delete by department permission'
  ) then
    create policy "Site product applications map: delete by department permission"
      on public.site_product_applications_map
      for delete
      using (public.can_modify_site_products(auth.uid()));
  end if;
end$$;
