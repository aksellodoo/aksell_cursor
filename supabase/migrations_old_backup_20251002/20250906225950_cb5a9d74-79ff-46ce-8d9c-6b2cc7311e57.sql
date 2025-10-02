
-- Cria (se necessário) e retorna o fornecedor unificado a partir de um potencial
create or replace function public.ensure_unified_supplier_from_potential(p_potential_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_unified_id uuid;
  v_buyer_cod text;
  v_buyer_filial text;
  v_cnpj text;
begin
  if p_potential_id is null then
    raise exception 'p_potential_id não pode ser nulo';
  end if;

  -- Já existe unificado para este potencial?
  select id
    into v_unified_id
  from public.purchases_unified_suppliers
  where potential_supplier_id = p_potential_id
  limit 1;

  if v_unified_id is not null then
    return v_unified_id;
  end if;

  -- Buscar alguns campos do potencial (opcionais)
  select 
    nullif(btrim(assigned_buyer_cod), '') as buyer_cod,
    nullif(btrim(assigned_buyer_filial), '') as buyer_filial,
    cnpj
  into v_buyer_cod, v_buyer_filial, v_cnpj
  from public.purchases_potential_suppliers
  where id = p_potential_id;

  if not found then
    raise exception 'Potencial fornecedor % não encontrado', p_potential_id;
  end if;

  -- Criar o unificado a partir do potencial
  insert into public.purchases_unified_suppliers (
    potential_supplier_id,
    assigned_buyer_cod,
    assigned_buyer_filial,
    cnpj,
    created_by
  ) values (
    p_potential_id,
    v_buyer_cod,
    v_buyer_filial,
    v_cnpj,
    auth.uid()
  )
  returning id into v_unified_id;

  return v_unified_id;
end;
$$;

-- Garante unificado e (opcionalmente) vincula ao grupo econômico de compras
create or replace function public.ensure_unified_supplier_and_assign_group(p_potential_id uuid, p_group_id integer default null)
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_unified_id uuid;
  v_assign_result json;
begin
  v_unified_id := public.ensure_unified_supplier_from_potential(p_potential_id);

  if p_group_id is not null then
    v_assign_result := public.add_unified_supplier_to_purchases_group(p_group_id, v_unified_id);
  end if;

  return json_build_object(
    'unified_id', v_unified_id,
    'assigned', p_group_id is not null,
    'assign_result', coalesce(v_assign_result, json_build_object('skipped', true))
  );
end;
$$;
