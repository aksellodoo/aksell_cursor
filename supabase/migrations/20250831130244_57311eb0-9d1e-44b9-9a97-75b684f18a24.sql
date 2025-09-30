CREATE OR REPLACE FUNCTION public.get_unified_group_members(p_id_grupo integer)
 RETURNS TABLE(unified_id uuid, display_name text, short_name text, commercial_name text, legal_name text, vendor_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa1         text;
  v_has_vendor_table  boolean := false;
  v_vendor_join       text := '';
BEGIN
  -- União dinâmica de todas as SA1010 (clientes do Protheus)
  SELECT string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         a1_nome::text   as a1_nome, 
         a1_nreduz::text as a1_nreduz,
         a1_vend::text   as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  -- Caso não exista tabela dinâmica SA1010 ainda
  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
                      null::text as a1_vend
                    where false';
  END IF;

  -- Verifica se a tabela de vendedores (SA3010) existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name   = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  IF v_has_vendor_table THEN
    v_vendor_join := 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)';
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
      coalesce(
        sa1.a1_nreduz,
        sl.trade_name,
        sa1.a1_nome,
        sl.legal_name,
        'Cliente ' || ua.protheus_cod
      ) as short_name,
      -- Commercial name (nome reduzido/fantasia)
      coalesce(
        sa1.a1_nreduz,
        sl.trade_name,
        sa1.a1_nome,
        sl.legal_name
      ) as commercial_name,
      -- Legal name (razão social)
      coalesce(
        sa1.a1_nome,
        sl.legal_name,
        sa1.a1_nreduz,
        sl.trade_name
      ) as legal_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja
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
    v_has_vendor_table,
    v_vendor_join,
    p_id_grupo
  );
END;
$function$