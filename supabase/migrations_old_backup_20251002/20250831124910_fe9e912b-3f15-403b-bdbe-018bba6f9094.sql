
-- Atualiza o RPC para buscar por nomes (razão/fantasia) e CNPJ (Protheus e Leads), além de código/loja
CREATE OR REPLACE FUNCTION public.search_unified_accounts_for_groups_simple(p_search_term text)
RETURNS TABLE(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  current_group_id integer,
  current_group_name text,
  vendor_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_term text;
  v_digits text;
  v_has_vendor_table boolean := false;
  v_union_sa1 text;
  v_vendor_join text := '';
  v_cnpj_clause text := '';
BEGIN
  -- Escapar curinga/escape para ILIKE
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  -- Normalizar dígitos para busca por CNPJ
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  -- Verifica se a tabela de vendedores existe (para exibir nome do vendedor quando possível)
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  IF v_has_vendor_table THEN
    v_vendor_join := 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)';
  END IF;

  -- Monta união dinâmica de todas as SA1010 (clientes)
  SELECT string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         a1_nome::text   as a1_nome, 
         a1_nreduz::text as a1_nreduz,
         a1_cgc::text    as a1_cgc,
         a1_vend::text   as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usa uma união vazia
  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
                      null::text as a1_cgc,
                      null::text as a1_vend
                    where false';
  END IF;

  -- Se houver dígitos no termo (possível CNPJ), adiciona cláusula específica normalizando ambos os lados
  IF length(v_digits) > 0 THEN
    v_cnpj_clause := format(
      ' OR (
          regexp_replace(coalesce(sl.cnpj::text, ''''), ''[^0-9]'', '''', ''g'') ILIKE %L ESCAPE ''\'' OR
          regexp_replace(coalesce(sa1.a1_cgc::text, ''''), ''[^0-9]'', '''', ''g'') ILIKE %L ESCAPE ''\''
        )',
      '%' || v_digits || '%',
      '%' || v_digits || '%'
    );
  END IF;

  RETURN QUERY EXECUTE format($q$
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
      ua.economic_group_id as current_group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name
    FROM public.unified_accounts ua
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = ua.economic_group_id
    LEFT JOIN public.sales_leads sl ON sl.id = ua.lead_id
    LEFT JOIN sa1 ON (
      ua.protheus_filial::text = sa1.a1_filial AND
      ua.protheus_cod::text    = sa1.a1_cod AND
      ua.protheus_loja::text   = sa1.a1_loja
    )
    %s
    WHERE
      (
        sa1.a1_nome    ILIKE %L ESCAPE '\' OR
        sa1.a1_nreduz  ILIKE %L ESCAPE '\' OR
        sl.trade_name  ILIKE %L ESCAPE '\' OR
        sl.legal_name  ILIKE %L ESCAPE '\' OR
        coalesce(ua.protheus_cod,'') ILIKE %L ESCAPE '\' OR
        coalesce(ua.protheus_loja,'') ILIKE %L ESCAPE '\'
        %s
      )
    ORDER BY display_name
    LIMIT 50
  $q$,
    v_union_sa1,
    v_has_vendor_table,
    v_vendor_join,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    v_cnpj_clause
  );

END;
$function$;
