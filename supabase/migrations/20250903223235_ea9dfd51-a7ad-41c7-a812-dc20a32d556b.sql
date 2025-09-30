
-- 1) Remover índice e coluna display_name da tabela de fornecedores unificados
drop index if exists public.purchases_unified_suppliers_display_name_idx;

alter table public.purchases_unified_suppliers
  drop column if exists display_name;

-- 2) Atualizar função que cria fornecedores unificados ausentes
create or replace function public.create_missing_unified_suppliers()
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_inserted_potential integer := 0;
  v_inserted_sa2010 integer := 0;
  v_union_sa2010 text;
begin
  -- União dinâmica de todas SA2010
  select string_agg(
    format(
      'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja, a2_nome::text as a2_nome, a2_nreduz::text as a2_nreduz, a2_cgc::text as a2_cgc from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select null::text as a2_filial, null::text as a2_cod, null::text as a2_loja, null::text as a2_nome, null::text as a2_nreduz, null::text as a2_cgc where false';
  end if;

  -- Inserir Potenciais sem unificado
  with src as (
    select
      p.id as potential_id,
      p.cnpj,
      p.created_by
    from public.purchases_potential_suppliers p
    left join public.purchases_unified_suppliers u on u.potential_supplier_id = p.id
    where u.id is null
  )
  insert into public.purchases_unified_suppliers (potential_supplier_id, cnpj, created_by)
  select potential_id, cnpj, created_by
  from src;
  get diagnostics v_inserted_potential = row_count;

  -- Inserir unidades SA2010 sem unificado
  execute format($q$
    with sa as (%s),
    src as (
      select
        a2_filial, a2_cod, a2_loja,
        a2_cgc as cnpj
      from sa
    )
    insert into public.purchases_unified_suppliers (protheus_filial, protheus_cod, protheus_loja, cnpj)
    select s.a2_filial, s.a2_cod, s.a2_loja, s.cnpj
    from src s
    left join public.purchases_unified_suppliers u
      on u.protheus_filial = s.a2_filial and u.protheus_cod = s.a2_cod and u.protheus_loja = s.a2_loja
    where u.id is null
  $q$, v_union_sa2010);

  get diagnostics v_inserted_sa2010 = row_count;

  return json_build_object(
    'success', true,
    'inserted_potential', v_inserted_potential,
    'inserted_sa2010', v_inserted_sa2010
  );
end;
$function$;

-- 3) Atualizar função de busca para calcular display_name dinamicamente
create or replace function public.search_unified_suppliers_for_groups_simple(p_search_term text)
returns table(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  current_group_id uuid,
  current_group_name text
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_term text;
  v_digits text;
  v_union_sa2010 text;
begin
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  select string_agg(
    format(
      'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja, a2_nome::text as a2_nome, a2_nreduz::text as a2_nreduz, a2_cgc::text as a2_cgc from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select null::text as a2_filial, null::text as a2_cod, null::text as a2_loja, null::text as a2_nome, null::text as a2_nreduz, null::text as a2_cgc where false';
  end if;

  return query execute format($q$
    with sa as (%s)
    select
      u.id as unified_id,
      coalesce(p.trade_name::text, p.legal_name::text, sa.a2_nreduz::text, sa.a2_nome::text, 'Fornecedor '||coalesce(u.protheus_cod::text,'')) as display_name,
      u.status::text as unified_status,
      u.protheus_filial,
      u.protheus_cod,
      u.protheus_loja,
      u.economic_group_id as current_group_id,
      coalesce(psg.name, psg.ai_suggested_name) as current_group_name
    from public.purchases_unified_suppliers u
    left join public.protheus_supplier_groups psg on psg.id = u.economic_group_id
    left join public.purchases_potential_suppliers p on p.id = u.potential_supplier_id
    left join sa on (
      u.protheus_filial = sa.a2_filial
      and u.protheus_cod = sa.a2_cod
      and u.protheus_loja = sa.a2_loja
    )
    where
      (
        coalesce(p.trade_name,'') ilike %L escape '\'
        or coalesce(p.legal_name,'') ilike %L escape '\'
        or coalesce(sa.a2_nome,'') ilike %L escape '\'
        or coalesce(sa.a2_nreduz,'') ilike %L escape '\'
        or coalesce(u.protheus_cod,'') ilike %L escape '\'
        or coalesce(u.protheus_loja,'') ilike %L escape '\'
        or (length(%L) > 0 and (
          regexp_replace(coalesce(p.cnpj,''), '[^0-9]', '', 'g') ilike %L escape '\'
          or regexp_replace(coalesce(u.cnpj,''), '[^0-9]', '', 'g') ilike %L escape '\'
          or regexp_replace(coalesce(sa.a2_cgc,''), '[^0-9]', '', 'g') ilike %L escape '\'
        ))
      )
    order by 2
    limit 50
  $q$,
    v_union_sa2010,
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    v_digits,
    '%'||v_digits||'%',
    '%'||v_digits||'%',
    '%'||v_digits||'%'
  );
end;
$function$;

-- Reafirmar privilégios (idempotente)
revoke all on function public.search_unified_suppliers_for_groups_simple(text) from public;
grant execute on function public.search_unified_suppliers_for_groups_simple(text) to anon, authenticated, service_role;
