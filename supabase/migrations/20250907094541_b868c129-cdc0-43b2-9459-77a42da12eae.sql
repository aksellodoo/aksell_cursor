-- Criar nova RPC para buscar grupos econômicos de compras com busca melhorada
CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups_paginated_v2(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25,
  p_search_term text DEFAULT NULL,
  p_sort_column text DEFAULT 'name',
  p_sort_direction text DEFAULT 'ASC'
)
RETURNS TABLE(
  id_grupo integer,
  code text,
  name text,
  ai_suggested_name text,
  member_count integer,
  material_types text[],
  assigned_buyer_cod text,
  assigned_buyer_name text,
  assigned_buyer_filial text,
  protheus_filial text,
  protheus_cod text,
  member_buyer_names text[],
  group_assigned_buyer_name text,
  material_type_names text[],
  created_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer;
  v_union_sa2 text;
  v_search text;
  v_sort_column text;
  v_sort_direction text;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Sanitize search term
  v_search := COALESCE(trim(p_search_term), '');
  
  -- Validate sort column and direction
  v_sort_column := CASE 
    WHEN p_sort_column IN ('id_grupo', 'code', 'name', 'member_count', 'created_at') 
    THEN p_sort_column 
    ELSE 'name' 
  END;
  
  v_sort_direction := CASE 
    WHEN upper(p_sort_direction) IN ('ASC', 'DESC') 
    THEN upper(p_sort_direction) 
    ELSE 'ASC' 
  END;
  
  -- Construir união dinâmica das tabelas SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'SELECT 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc
       FROM %I', 
       supabase_table_name
    ),
    ' UNION ALL '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  -- Fallback se não houver tabelas SA2010
  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'SELECT 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz,
                      null::text as a2_cgc
                    WHERE false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    group_stats AS (
      SELECT 
        peg.id_grupo,
        peg.code,
        COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) as name,
        peg.ai_suggested_name,
        peg.assigned_buyer_cod,
        peg.assigned_buyer_filial,
        peg.protheus_filial,
        peg.protheus_cod,
        peg.created_at,
        
        -- Contagem de membros
        COUNT(DISTINCT pegm.unified_supplier_id) as member_count,
        
        -- Nome do comprador do grupo
        btrim(y1_group.y1_nome) as group_assigned_buyer_name,
        
        -- Nomes únicos dos compradores dos membros
        array_remove(
          array_agg(
            DISTINCT COALESCE(
              btrim(y1_member.y1_nome),
              COALESCE(
                nullif(btrim(us.assigned_buyer_cod), ''),
                nullif(btrim(ps.assigned_buyer_cod), '')
              )
            )
          ), NULL
        ) as member_buyer_names,
        
        -- Tipos de materiais únicos
        array_remove(
          array_agg(DISTINCT pmt.name), NULL
        ) as material_type_names
        
      FROM public.purchases_economic_groups peg
      LEFT JOIN public.purchases_economic_group_members pegm ON pegm.group_id = peg.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
      
      -- Join para obter nome do comprador do grupo
      LEFT JOIN public.protheus_sy1010_3249e97a y1_group
        ON btrim(y1_group.y1_cod) = btrim(peg.assigned_buyer_cod)
       AND btrim(y1_group.y1_filial) = COALESCE(btrim(peg.assigned_buyer_filial), '01')
       
      -- Join para obter nomes dos compradores dos membros
      LEFT JOIN public.protheus_sy1010_3249e97a y1_member
        ON btrim(y1_member.y1_cod) = COALESCE(
             nullif(btrim(us.assigned_buyer_cod), ''),
             nullif(btrim(ps.assigned_buyer_cod), '')
           )
       AND btrim(y1_member.y1_filial) = COALESCE(
             nullif(btrim(us.assigned_buyer_filial), ''),
             nullif(btrim(ps.assigned_buyer_filial), ''),
             '01'
           )
           
      -- Join para tipos de materiais
      LEFT JOIN public.purchases_unified_supplier_material_types pusmt 
        ON pusmt.supplier_id = us.id
      LEFT JOIN public.purchases_material_types pmt 
        ON pmt.id = pusmt.material_type_id AND pmt.is_active = true
        
      GROUP BY 
        peg.id_grupo, peg.code, peg.name, peg.ai_suggested_name, 
        peg.assigned_buyer_cod, peg.assigned_buyer_filial,
        peg.protheus_filial, peg.protheus_cod, peg.created_at,
        y1_group.y1_nome
    ),
    filtered_groups AS (
      SELECT 
        gs.*,
        -- Adicionar dados de fornecedores para busca mais rica
        COALESCE(
          array_agg(DISTINCT sa2.a2_nome) FILTER (WHERE sa2.a2_nome IS NOT NULL),
          ARRAY[]::text[]
        ) as supplier_names,
        COALESCE(
          array_agg(DISTINCT sa2.a2_nreduz) FILTER (WHERE sa2.a2_nreduz IS NOT NULL),
          ARRAY[]::text[]
        ) as supplier_short_names,
        COALESCE(
          array_agg(DISTINCT regexp_replace(sa2.a2_cgc, '[^0-9]', '', 'g')) 
          FILTER (WHERE sa2.a2_cgc IS NOT NULL AND sa2.a2_cgc != ''),
          ARRAY[]::text[]
        ) as supplier_cnpjs
      FROM group_stats gs
      LEFT JOIN public.purchases_economic_group_members pegm2 ON pegm2.group_id = gs.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us2 ON us2.id = pegm2.unified_supplier_id
      LEFT JOIN sa2_all sa2 
        ON sa2.a2_filial = us2.protheus_filial::text
       AND sa2.a2_cod = us2.protheus_cod::text
       AND sa2.a2_loja = us2.protheus_loja::text
      GROUP BY 
        gs.id_grupo, gs.code, gs.name, gs.ai_suggested_name, gs.member_count,
        gs.assigned_buyer_cod, gs.assigned_buyer_filial, gs.protheus_filial, 
        gs.protheus_cod, gs.created_at, gs.group_assigned_buyer_name,
        gs.member_buyer_names, gs.material_type_names
    ),
    search_filtered AS (
      SELECT *
      FROM filtered_groups fg
      WHERE (
        %L = '' OR
        fg.name ILIKE %L OR
        fg.ai_suggested_name ILIKE %L OR
        fg.code ILIKE %L OR
        fg.protheus_filial ILIKE %L OR
        fg.protheus_cod ILIKE %L OR
        fg.group_assigned_buyer_name ILIKE %L OR
        EXISTS (
          SELECT 1 FROM unnest(fg.member_buyer_names) AS buyer_name
          WHERE buyer_name ILIKE %L
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(fg.material_type_names) AS material_type
          WHERE material_type ILIKE %L
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(fg.supplier_names) AS supplier_name
          WHERE supplier_name ILIKE %L
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(fg.supplier_short_names) AS supplier_short_name
          WHERE supplier_short_name ILIKE %L
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(fg.supplier_cnpjs) AS supplier_cnpj
          WHERE supplier_cnpj ILIKE %L
        )
      )
    ),
    total_count AS (
      SELECT COUNT(*) as total FROM search_filtered
    )
    SELECT 
      sf.id_grupo,
      sf.code,
      sf.name,
      sf.ai_suggested_name,
      sf.member_count::integer,
      sf.material_type_names as material_types,
      sf.assigned_buyer_cod,
      COALESCE(sf.group_assigned_buyer_name, sf.assigned_buyer_cod) as assigned_buyer_name,
      sf.assigned_buyer_filial,
      sf.protheus_filial,
      sf.protheus_cod,
      sf.member_buyer_names,
      sf.group_assigned_buyer_name,
      sf.material_type_names,
      sf.created_at,
      tc.total as total_count
    FROM search_filtered sf, total_count tc
    ORDER BY 
      CASE WHEN %L = 'ASC' THEN
        CASE %L
          WHEN 'id_grupo' THEN sf.id_grupo::text
          WHEN 'code' THEN sf.code
          WHEN 'name' THEN sf.name
          WHEN 'member_count' THEN lpad(sf.member_count::text, 10, '0')
          WHEN 'created_at' THEN sf.created_at::text
          ELSE sf.name
        END
      END ASC,
      CASE WHEN %L = 'DESC' THEN
        CASE %L
          WHEN 'id_grupo' THEN sf.id_grupo::text
          WHEN 'code' THEN sf.code
          WHEN 'name' THEN sf.name
          WHEN 'member_count' THEN lpad(sf.member_count::text, 10, '0')
          WHEN 'created_at' THEN sf.created_at::text
          ELSE sf.name
        END
      END DESC
    LIMIT %L OFFSET %L
  $q$, 
    v_union_sa2,
    v_search,
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    v_sort_direction,
    v_sort_column,
    v_sort_direction,
    v_sort_column,
    p_page_size,
    v_offset
  );
END;
$function$;