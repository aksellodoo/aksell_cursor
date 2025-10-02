
-- Atualiza/Cria o RPC para listar membros de grupo econômico de compras
-- com nomes detalhados, CNPJ e comprador designado.

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
  v_has_sa3 boolean := false;
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

  -- Verifica se a tabela de vendedores (SA3010) padrão existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_sa3;

  RETURN QUERY EXECUTE format($q$
    WITH m AS (
      SELECT unified_supplier_id AS unified_id
      FROM public.purchases_economic_group_members
      WHERE group_id = %L
    ),
    sa2_all AS (
      %s
    )
    SELECT
      u.id::uuid                               AS unified_id,
      -- Prioridade do display: nome fantasia potencial, nome reduzido SA2010,
      -- depois razão social potencial, depois razão social SA2010, por fim 'Sem nome'
      COALESCE(p.trade_name::text, sa2.a2_nreduz, p.legal_name::text, sa2.a2_nome, 'Sem nome') AS display_name,
      COALESCE(p.trade_name::text, sa2.a2_nreduz)   AS trade_name,
      COALESCE(p.legal_name::text, sa2.a2_nome)     AS legal_name,
      -- CNPJ: do unificado, senão do potencial, senão do SA2010
      COALESCE(u.cnpj::text, p.cnpj::text, sa2.a2_cgc) AS cnpj,
      u.status::text                            AS unified_status,
      u.protheus_filial::text                   AS protheus_filial,
      u.protheus_cod::text                      AS protheus_cod,
      u.protheus_loja::text                     AS protheus_loja,
      u.assigned_buyer_cod::text                AS assigned_buyer_cod,
      u.assigned_buyer_filial::text             AS assigned_buyer_filial,
      CASE 
        WHEN %L THEN sa3.a3_nome::text 
        ELSE NULL 
      END                                       AS assigned_buyer_name
    FROM m
    JOIN public.purchases_unified_suppliers u
      ON u.id = m.unified_id
    LEFT JOIN public.purchases_potential_suppliers p
      ON p.id = u.potential_supplier_id
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = u.protheus_filial::text
     AND sa2.a2_cod    = u.protheus_cod::text
    %s
    ORDER BY display_name
  $q$, 
    p_id_grupo,
    v_union_sa2,
    v_has_sa3,
    CASE WHEN v_has_sa3 
         THEN 'LEFT JOIN public.protheus_sa3010_fc3d70f6 sa3 
                 ON sa3.a3_filial::text = COALESCE(u.assigned_buyer_filial::text, ''01'')
                AND sa3.a3_cod::text    = u.assigned_buyer_cod::text'
         ELSE ''
    END
  );

END;
$function$;
