
-- RPC que retorna todos os totalizadores de fornecedores de Compras, com cálculo no banco
create or replace function public.get_purchases_supplier_totalizers()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_union_sa2           text;
  v_unified             integer := 0;
  v_potential           integer := 0;
  v_protheus            integer := 0;
  v_missing_potential   integer := 0;
  v_missing_protheus    integer := 0;
begin
  -- Contadores diretos
  select count(*)::int into v_unified   from public.purchases_unified_suppliers;
  select count(*)::int into v_potential from public.purchases_potential_suppliers;

  -- União dinâmica de todas as SA2010 (fornecedores Protheus)
  select string_agg(
           format(
             'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja from %I',
             supabase_table_name
           ),
           ' union all '
         )
    into v_union_sa2
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2 is not null then
    -- Total de fornecedores Protheus
    execute format($q$
      with sa2_all as (%s)
      select count(*)::int from sa2_all
    $q$, v_union_sa2)
    into v_protheus;

    -- Protheus sem unificado
    execute format($q$
      with sa2_all as (%s)
      select count(*)::int
      from sa2_all s
      where not exists (
        select 1
          from public.purchases_unified_suppliers us
         where us.protheus_filial = s.a2_filial
           and us.protheus_cod    = s.a2_cod
           and us.protheus_loja   = s.a2_loja
      )
    $q$, v_union_sa2)
    into v_missing_protheus;
  end if;

  -- Potenciais sem unificado
  select count(*)::int
    into v_missing_potential
  from public.purchases_potential_suppliers ps
  left join public.purchases_unified_suppliers us
    on us.potential_supplier_id = ps.id
  where us.id is null;

  return json_build_object(
    'unified',            v_unified,
    'potential',          v_potential,
    'protheus',           v_protheus,
    'missing_potential',  v_missing_potential,
    'missing_protheus',   v_missing_protheus,
    'missing',            v_missing_potential + v_missing_protheus
  );
end;
$$;
