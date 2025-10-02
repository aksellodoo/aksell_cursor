
-- Sincroniza Tipos de Materiais do GRUPO a partir dos MEMBROS (adição apenas)
-- Considera:
--  (a) tipos no fornecedor unificado (purchases_unified_supplier_material_types)
--  (b) tipos do potencial fornecedor vinculado (purchases_potential_supplier_material_types) como fallback
create or replace function public.sync_purchases_group_material_types_from_members(
  p_id_grupo integer
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inserted int := 0;
  v_total_after int := 0;
  v_union_count int := 0;
begin
  -- Insere no grupo a união dos tipos dos membros, ignorando duplicados
  with union_types as (
    select distinct material_type_id
    from (
      -- Tipos de materiais diretamente no fornecedor unificado
      select mt.material_type_id
      from public.purchases_economic_group_members m
      join public.purchases_unified_supplier_material_types mt
        on mt.supplier_id = m.unified_supplier_id
      where m.group_id = p_id_grupo

      union

      -- Fallback: tipos de materiais no potencial fornecedor vinculado ao unificado
      select pmt.material_type_id
      from public.purchases_economic_group_members m
      join public.purchases_unified_suppliers us
        on us.id = m.unified_supplier_id
      join public.purchases_potential_supplier_material_types pmt
        on pmt.supplier_id = us.potential_supplier_id
      where m.group_id = p_id_grupo
    ) s
  )
  insert into public.purchases_economic_group_material_types (group_id, material_type_id, created_by)
  select p_id_grupo, ut.material_type_id, auth.uid()
  from union_types ut
  on conflict (group_id, material_type_id) do nothing;

  get diagnostics v_inserted = ROW_COUNT;

  -- Total de tipos no grupo após a inserção
  select count(*) into v_total_after
  from public.purchases_economic_group_material_types
  where group_id = p_id_grupo;

  -- Quantidade de tipos distintos encontrados nos membros (para referência)
  select count(*) into v_union_count
  from (
    select mt.material_type_id
    from public.purchases_economic_group_members m
    join public.purchases_unified_supplier_material_types mt
      on mt.supplier_id = m.unified_supplier_id
    where m.group_id = p_id_grupo
    union
    select pmt.material_type_id
    from public.purchases_economic_group_members m
    join public.purchases_unified_suppliers us
      on us.id = m.unified_supplier_id
    join public.purchases_potential_supplier_material_types pmt
      on pmt.supplier_id = us.potential_supplier_id
    where m.group_id = p_id_grupo
  ) s;

  return json_build_object(
    'success', true,
    'inserted', v_inserted,
    'total_group_types', v_total_after,
    'union_member_types', v_union_count
  );
end;
$function$;
