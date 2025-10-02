-- Drop and recreate function to fix buyer name display for potential suppliers
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
  assigned_buyer_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
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
         a2_cgc::text    as a2_cgc
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
                      null::text as a2_cgc
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT 
      us.id AS unified_id,

      -- Mantemos display_name para compatibilidade
      COALESCE(
        sa2.a2_nreduz,
        ps.trade_name,
        sa2.a2_nome,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
      ) AS display_name,

      -- Novos campos
      COALESCE(sa2.a2_nreduz, ps.trade_name) AS trade_name,
      COALESCE(sa2.a2_nome,   ps.legal_name) AS legal_name,
      
      -- Format CNPJ (remove dots, slashes, dashes)
      CASE 
        WHEN COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj) IS NOT NULL 
        THEN regexp_replace(COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj), '[^0-9]', '', 'g')
        ELSE NULL 
      END AS cnpj,

      us.status::text AS unified_status,
      us.protheus_filial::text,
      us.protheus_cod::text,
      us.protheus_loja::text,

      -- Normalize buyer codes for better matching
      COALESCE(
        nullif(btrim(us.assigned_buyer_cod), ''),
        nullif(btrim(ps.assigned_buyer_cod), '')
      ) AS assigned_buyer_cod,
      
      COALESCE(
        nullif(btrim(us.assigned_buyer_filial), ''),
        nullif(btrim(ps.assigned_buyer_filial), ''),
        '01'
      ) AS assigned_buyer_filial,
      
      -- Get buyer name using normalized codes
      y1.y1_nome::text AS assigned_buyer_name

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
      ON y1.y1_cod = COALESCE(
           nullif(btrim(us.assigned_buyer_cod), ''),
           nullif(btrim(ps.assigned_buyer_cod), '')
         )
     AND y1.y1_filial = COALESCE(
           nullif(btrim(us.assigned_buyer_filial), ''),
           nullif(btrim(ps.assigned_buyer_filial), ''),
           '01'
         )
    WHERE m.group_id = %L
    ORDER BY display_name
  $q$, v_union_sa2, p_id_grupo);
END;
$function$;