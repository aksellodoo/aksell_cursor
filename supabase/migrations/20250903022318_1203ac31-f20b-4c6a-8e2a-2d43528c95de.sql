-- Remover função existente para poder alterar o tipo de retorno
DROP FUNCTION IF EXISTS public.get_unified_group_members(integer);

-- Recriar função get_unified_group_members para usar relacionamentos e exibir nomes dos vendedores
CREATE OR REPLACE FUNCTION public.get_unified_group_members(p_id_grupo integer)
 RETURNS TABLE(unified_id uuid, display_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text, vendor_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_union_sa1 text;
  v_sa3_join text := '';
  v_vendor_name_expr text := 'coalesce(sa1.a1_vend, sl.assigned_vendor_cod)';
  v_has_sa3_relationship boolean := false;
  v_sa1_join_field text;
  v_sa3_join_field text;
  v_sa3_table text;
begin
  -- Verificar se existe relacionamento SA1010_SA3010
  select 
    ptr.sa1_join_field,
    ptr.sa3_join_field,
    ptr.sa3_table_name,
    true
  into 
    v_sa1_join_field,
    v_sa3_join_field, 
    v_sa3_table,
    v_has_sa3_relationship
  from public.protheus_table_relationships ptr
  where ptr.relationship_name = 'SA1010_SA3010'
  limit 1;

  -- Montar união dinâmica de todas as SA1010 (clientes)
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         a1_nome::text   as a1_nome, 
         a1_nreduz::text as a1_nreduz,
         a1_cgc::text    as a1_cgc,
         btrim(%I::text) as a1_vend
       from %I', 
       coalesce(v_sa1_join_field, 'a1_vend'),
       supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usar uma união vazia
  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
                      null::text as a1_cgc,
                      null::text as a1_vend
                    where false';
  end if;

  -- Se existir relacionamento SA3010, montar JOIN e expressão para nome do vendedor
  if v_has_sa3_relationship and v_sa3_table is not null then
    v_sa3_join := format('left join %I sa3 on btrim(sa3.%I::text) = coalesce(btrim(sa1.a1_vend), btrim(sl.assigned_vendor_cod)) and btrim(sa3.a3_filial::text) = coalesce(sa1.a1_filial, sl.assigned_vendor_filial, ''01'')', 
                        v_sa3_table, v_sa3_join_field);
    v_vendor_name_expr := 'coalesce(btrim(sa3.a3_nreduz::text), btrim(sa3.a3_nome::text), sa1.a1_vend, sl.assigned_vendor_cod)';
  end if;

  return query execute format($q$
    WITH sa1 AS (
      %s
    )
    SELECT
      ua.id as unified_id,
      coalesce(
        sa1.a1_nreduz, 
        sa1.a1_nome, 
        sl.trade_name, 
        sl.legal_name, 
        'Cliente ' || ua.protheus_cod
      ) as display_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja,
      %s as vendor_name
    FROM public.unified_accounts ua
    LEFT JOIN public.sales_leads sl ON sl.id = ua.lead_id
    LEFT JOIN sa1 ON (
      ua.protheus_filial::text = sa1.a1_filial AND
      ua.protheus_cod::text    = sa1.a1_cod AND
      ua.protheus_loja::text   = sa1.a1_loja
    )
    %s
    WHERE ua.economic_group_id = %L
    ORDER BY display_name
  $q$,
    v_union_sa1,
    v_vendor_name_expr,
    v_sa3_join,
    p_id_grupo
  );

END;
$function$;