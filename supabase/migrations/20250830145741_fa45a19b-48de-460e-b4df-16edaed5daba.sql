
CREATE OR REPLACE FUNCTION public.search_customers_for_groups(p_table_id uuid, p_search_term text)
RETURNS TABLE(
  filial text,
  cod text,
  loja text,
  nome text,
  nome_reduzido text,
  vendor_name text,
  current_group_id integer,
  current_group_name text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
  v_escaped_search TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Verifica se existe a tabela de vendedores padrão
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  -- Escapa o termo de busca
  v_escaped_search := replace(replace(replace(p_search_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sa1.a1_filial::text as filial,
      sa1.a1_cod::text as cod,
      sa1.a1_loja::text as loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sa1.a1_vend::text 
      END as vendor_name,
      pgu.group_id as current_group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name
    FROM %I sa1
    %s
    LEFT JOIN public.protheus_customer_group_units pgu ON (
      pgu.protheus_table_id = %L AND
      pgu.filial = sa1.a1_filial::text AND
      pgu.cod = sa1.a1_cod::text AND
      pgu.loja = sa1.a1_loja::text
    )
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = pgu.group_id
    WHERE (
      sa1.a1_nome::text ILIKE %L ESCAPE '\' OR
      sa1.a1_nreduz::text ILIKE %L ESCAPE '\' OR
      sa1.a1_cod::text ILIKE %L ESCAPE '\'
    )
    ORDER BY sa1.a1_filial, sa1.a1_cod, sa1.a1_loja
    LIMIT 100
  $q$, 
     v_has_vendor_table,
     v_table,
     CASE WHEN v_has_vendor_table 
          THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sa1.a1_vend::text'
          ELSE ''
     END,
     p_table_id,
     '%' || v_escaped_search || '%',
     '%' || v_escaped_search || '%',
     '%' || v_escaped_search || '%'
  );
END;
$function$;
