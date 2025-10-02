
-- Atualiza a função para retornar Cidade/UF e distância até Indaiatuba
DROP FUNCTION IF EXISTS public.get_purchases_group_members(integer);

CREATE OR REPLACE FUNCTION public.get_purchases_group_members(p_id_grupo integer)
RETURNS TABLE(
  unified_id uuid,
  display_name text,
  trade_name text,
  legal_name text,
  cnpj text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  assigned_buyer_cod text,
  assigned_buyer_filial text,
  assigned_buyer_name text,
  city_name text,
  city_uf text,
  city_label text,
  distance_km_to_indaiatuba numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores) com campos para cidade/UF
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

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT 
      us.id AS unified_id,

      -- Nome para exibição (mantém compatibilidade)
      COALESCE(
        sa2.a2_nreduz,
        ps.trade_name,
        sa2.a2_nome,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
      ) AS display_name,

      -- Nomes detalhados
      COALESCE(sa2.a2_nreduz, ps.trade_name) AS trade_name,
      COALESCE(sa2.a2_nome,   ps.legal_name) AS legal_name,
      
      -- CNPJ normalizado
      CASE 
        WHEN COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj) IS NOT NULL 
        THEN regexp_replace(COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj), '[^0-9]', '', 'g')
        ELSE NULL 
      END AS cnpj,

      us.status::text AS unified_status,
      us.protheus_filial::text,
      us.protheus_cod::text,
      us.protheus_loja::text,

      -- Comprador designado (código/filial normalizados)
      COALESCE(
        nullif(btrim(us.assigned_buyer_cod), ''),
        nullif(btrim(ps.assigned_buyer_cod), '')
      ) AS assigned_buyer_cod,
      
      COALESCE(
        nullif(btrim(us.assigned_buyer_filial), ''),
        nullif(btrim(ps.assigned_buyer_filial), ''),
        '01'
      ) AS assigned_buyer_filial,
      
      -- Nome do comprador (join com SY1010, com trims)
      btrim(y1.y1_nome) AS assigned_buyer_name,

      -- Cidade/UF e distância: prioridade para cidade do potencial; fallback SA2010
      COALESCE(sc_ps.name, sc_sa2.name) AS city_name,
      COALESCE(sc_ps.uf,   sc_sa2.uf)   AS city_uf,
      CASE 
        WHEN sc_ps.id IS NOT NULL THEN sc_ps.name || ' - ' || sc_ps.uf
        WHEN sc_sa2.id IS NOT NULL THEN sc_sa2.name || ' - ' || sc_sa2.uf
        ELSE NULL
      END AS city_label,
      COALESCE(sc_ps.distance_km_to_indaiatuba, sc_sa2.distance_km_to_indaiatuba) AS distance_km_to_indaiatuba

    FROM public.purchases_economic_group_members m
    JOIN public.purchases_unified_suppliers us
      ON us.id = m.unified_supplier_id
    LEFT JOIN public.purchases_potential_suppliers ps
      ON ps.id = us.potential_supplier_id
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = us.protheus_filial::text
     AND sa2.a2_cod    = us.protheus_cod::text
     AND sa2.a2_loja   = us.protheus_loja::text
    LEFT JOIN public.protheus_sy1010_3249e97a y1
      ON btrim(y1.y1_cod) = COALESCE(
           nullif(btrim(us.assigned_buyer_cod), ''),
           nullif(btrim(ps.assigned_buyer_cod), '')
         )
     AND btrim(y1.y1_filial) = COALESCE(
           nullif(btrim(us.assigned_buyer_filial), ''),
           nullif(btrim(ps.assigned_buyer_filial), ''),
           '01'
         )
    -- Cidade do potencial
    LEFT JOIN public.site_cities sc_ps 
      ON sc_ps.id = ps.city_id
    -- Cidade mapeada via SA2010 (cod_mun + UF)
    LEFT JOIN public.site_cities sc_sa2 
      ON sc_sa2.cod_munic = regexp_replace(COALESCE(sa2.a2_cod_mun, ''), '[^0-9]', '', 'g')
     AND sc_sa2.uf        = upper(btrim(COALESCE(sa2.a2_est, '')))
    WHERE m.group_id = %L
    ORDER BY display_name
  $q$, v_union_sa2, p_id_grupo);
END;
$function$;
