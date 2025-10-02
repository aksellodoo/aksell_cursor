-- Atualizar função RPC para melhorar pesquisa em grupos econômicos de compras
CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups_paginated(
  p_search_term text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_sort_column text DEFAULT 'name',
  p_sort_direction text DEFAULT 'asc'
)
RETURNS TABLE(
  id_grupo integer,
  code text,
  name text,
  ai_suggested_name text,
  member_count integer,
  buyers text[],
  material_types text[],
  created_at timestamp with time zone,
  total_count integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
  v_search_clause text := '';
  v_sort_clause text;
  v_offset integer;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'select 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz,
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    where false';
  END IF;

  -- Construir cláusula de busca se termo fornecido
  IF p_search_term IS NOT NULL AND btrim(p_search_term) <> '' THEN
    v_search_clause := format(
      'AND (
        -- Busca no nome/código do grupo
        lower(unaccent(coalesce(peg.name, peg.ai_suggested_name, ''''))) ilike lower(unaccent(%L)) OR
        lower(unaccent(coalesce(peg.code, ''''))) ilike lower(unaccent(%L)) OR
        
        -- Busca nos membros: nomes do potencial
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(ps.trade_name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(ps.legal_name, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca nos membros: nomes do SA2010
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sa2.a2_nome, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sa2.a2_nreduz, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca no CNPJ normalizado
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          LEFT JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          WHERE pegm.group_id = peg.id_grupo
            AND regexp_replace(coalesce(us.cnpj, ps.cnpj, sa2.a2_cgc, ''''), ''[^0-9]'', '''', ''g'') ilike %L
        ) OR
        
        -- Busca nas chaves Protheus
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              coalesce(us.protheus_filial::text, '''') ilike %L OR
              coalesce(us.protheus_cod::text, '''') ilike %L OR
              coalesce(us.protheus_loja::text, '''') ilike %L
            )
        ) OR
        
        -- Busca na cidade/UF via potencial
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          LEFT JOIN public.site_cities sc ON sc.id = ps.city_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sc.name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sc.uf, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca na cidade/UF via SA2010
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          LEFT JOIN public.site_cities sc ON (
            sc.cod_munic = regexp_replace(coalesce(sa2.a2_cod_mun, ''''), ''[^0-9]'', '''', ''g'') AND
            sc.uf = upper(btrim(coalesce(sa2.a2_est, '''')))
          )
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sc.name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sc.uf, ''''))) ilike lower(unaccent(%L))
            )
        )
      )',
      '%' || btrim(p_search_term) || '%',  -- grupo nome
      '%' || btrim(p_search_term) || '%',  -- grupo código
      '%' || btrim(p_search_term) || '%',  -- potencial trade_name
      '%' || btrim(p_search_term) || '%',  -- potencial legal_name
      '%' || btrim(p_search_term) || '%',  -- sa2 a2_nome
      '%' || btrim(p_search_term) || '%',  -- sa2 a2_nreduz
      '%' || regexp_replace(btrim(p_search_term), '[^0-9]', '', 'g') || '%',  -- cnpj
      '%' || btrim(p_search_term) || '%',  -- protheus filial
      '%' || btrim(p_search_term) || '%',  -- protheus cod
      '%' || btrim(p_search_term) || '%',  -- protheus loja
      '%' || btrim(p_search_term) || '%',  -- cidade potencial
      '%' || btrim(p_search_term) || '%',  -- uf potencial
      '%' || btrim(p_search_term) || '%',  -- cidade sa2
      '%' || btrim(p_search_term) || '%'   -- uf sa2
    );
  END IF;

  -- Construir cláusula de ordenação
  CASE p_sort_column
    WHEN 'name' THEN
      v_sort_clause := 'ORDER BY coalesce(peg.name, peg.ai_suggested_name, ''Grupo '' || peg.id_grupo::text) ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'code' THEN
      v_sort_clause := 'ORDER BY peg.code ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'member_count' THEN
      v_sort_clause := 'ORDER BY member_count ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'created_at' THEN
      v_sort_clause := 'ORDER BY peg.created_at ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    ELSE
      v_sort_clause := 'ORDER BY coalesce(peg.name, peg.ai_suggested_name, ''Grupo '' || peg.id_grupo::text) ASC';
  END CASE;

  -- Calcular offset
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    base_groups AS (
      SELECT 
        peg.id_grupo,
        peg.code,
        peg.name,
        peg.ai_suggested_name,
        peg.created_at,
        COUNT(pegm.id)::integer AS member_count,
        
        -- Buscar compradores únicos dos membros
        COALESCE(
          array_remove(
            array_agg(DISTINCT COALESCE(
              nullif(btrim(us.assigned_buyer_cod), ''),
              nullif(btrim(ps.assigned_buyer_cod), '')
            )),
            NULL
          ),
          ARRAY[]::text[]
        ) AS buyers,
        
        -- Buscar tipos de material únicos
        COALESCE(
          array_remove(
            array_agg(DISTINCT UNNEST(COALESCE(pmt.material_types, ARRAY[]::text[]))),
            NULL
          ),
          ARRAY[]::text[]
        ) AS material_types
        
      FROM public.purchases_economic_groups peg
      LEFT JOIN public.purchases_economic_group_members pegm ON pegm.group_id = peg.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
      LEFT JOIN sa2_all sa2 ON (
        sa2.a2_filial = us.protheus_filial::text AND
        sa2.a2_cod = us.protheus_cod::text AND
        sa2.a2_loja = us.protheus_loja::text
      )
      LEFT JOIN public.purchases_group_material_types pmt ON pmt.group_id = peg.id_grupo
      WHERE 1=1 %s
      GROUP BY peg.id_grupo, peg.code, peg.name, peg.ai_suggested_name, peg.created_at
    ),
    total_count_query AS (
      SELECT COUNT(*)::integer AS total_count FROM base_groups
    )
    SELECT 
      bg.id_grupo,
      bg.code,
      bg.name,
      bg.ai_suggested_name,
      bg.member_count,
      bg.buyers,
      bg.material_types,
      bg.created_at,
      tc.total_count
    FROM base_groups bg
    CROSS JOIN total_count_query tc
    %s
    LIMIT %s OFFSET %s
  $q$, v_union_sa2, v_search_clause, v_sort_clause, p_page_size, v_offset);
END;
$function$;