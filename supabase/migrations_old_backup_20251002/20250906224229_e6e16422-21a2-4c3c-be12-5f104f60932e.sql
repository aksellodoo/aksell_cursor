
-- 1) Lista consolidada dos fornecedores faltantes (Protheus + Potenciais)
create or replace function public.list_missing_unified_suppliers()
returns table (
  source text,                 -- 'protheus' | 'potential'
  potential_id uuid,           -- id do potencial quando source='potential'
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  trade_name text,             -- nome fantasia
  legal_name text,             -- razão social
  cnpj text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_union_sa2 text;
begin
  -- União dinâmica de todas as SA2010 (fornecedores Protheus)
  select string_agg(
           format(
             'select 
                a2_filial::text as filial, 
                a2_cod::text    as cod, 
                a2_loja::text   as loja, 
                a2_nome::text   as legal_name, 
                a2_nreduz::text as trade_name, 
                a2_cgc::text    as cnpj
              from %I',
             supabase_table_name
           ),
           ' union all '
         )
    into v_union_sa2
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  -- 1A) Potenciais sem unificado
  return query
  select
    'potential'::text as source,
    ps.id             as potential_id,
    null::text        as protheus_filial,
    null::text        as protheus_cod,
    null::text        as protheus_loja,
    coalesce(ps.trade_name, ps.legal_name) as trade_name,
    ps.legal_name     as legal_name,
    case when ps.cnpj is not null then regexp_replace(ps.cnpj, '[^0-9]', '', 'g') else null end as cnpj
  from public.purchases_potential_suppliers ps
  left join public.purchases_unified_suppliers us
    on us.potential_supplier_id = ps.id
  where us.id is null;

  -- 1B) Protheus sem unificado (se houver SA2010)
  if v_union_sa2 is not null then
    return query execute format($q$
      with sa2_all as (%s)
      select
        'protheus'::text as source,
        null::uuid       as potential_id,
        s.filial         as protheus_filial,
        s.cod            as protheus_cod,
        s.loja           as protheus_loja,
        s.trade_name,
        s.legal_name,
        case when s.cnpj is not null then regexp_replace(s.cnpj, '[^0-9]', '', 'g') else null end as cnpj
      from sa2_all s
      where not exists (
        select 1
          from public.purchases_unified_suppliers us
         where us.protheus_filial = s.filial
           and us.protheus_cod    = s.cod
           and us.protheus_loja   = s.loja
      )
    $q$, v_union_sa2);
  end if;
end;
$$;

-- 2) Totalizadores: missing = total de registros da lista acima
create or replace function public.get_purchases_supplier_totalizers()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_union_sa2         text;
  v_unified           integer := 0;
  v_potential         integer := 0;
  v_protheus          integer := 0;
  v_missing           integer := 0;
begin
  -- Contagens diretas
  select count(*)::int into v_unified   from public.purchases_unified_suppliers;
  select count(*)::int into v_potential from public.purchases_potential_suppliers;

  -- União dinâmica de SA2010 para contar Protheus
  select string_agg(
           format('select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja from %I', supabase_table_name),
           ' union all '
         )
    into v_union_sa2
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2 is not null then
    execute format($q$
      with sa2_all as (%s)
      select count(*)::int from sa2_all
    $q$, v_union_sa2)
    into v_protheus;
  end if;

  -- Faltantes = tamanho da lista consolidada
  select count(*)::int into v_missing
  from public.list_missing_unified_suppliers();

  return json_build_object(
    'unified',   v_unified,
    'potential', v_potential,
    'protheus',  v_protheus,
    'missing',   v_missing
  );
end;
$$;
