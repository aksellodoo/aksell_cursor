
-- 1) Adicionar colunas no grupo do Protheus
ALTER TABLE public.protheus_customer_groups
  ADD COLUMN IF NOT EXISTS assigned_vendor_cod text,
  ADD COLUMN IF NOT EXISTS assigned_vendor_filial text;

-- 2) Trigger para normalizar os campos de vendedor do grupo (trim e vazio -> NULL)
CREATE OR REPLACE FUNCTION public.tg_normalize_group_vendor()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.assigned_vendor_cod IS NOT NULL THEN
    NEW.assigned_vendor_cod := NULLIF(btrim(NEW.assigned_vendor_cod), '');
  END IF;
  IF NEW.assigned_vendor_filial IS NOT NULL THEN
    NEW.assigned_vendor_filial := NULLIF(btrim(NEW.assigned_vendor_filial), '');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS biu_normalize_group_vendor ON public.protheus_customer_groups;
CREATE TRIGGER biu_normalize_group_vendor
BEFORE INSERT OR UPDATE ON public.protheus_customer_groups
FOR EACH ROW
EXECUTE FUNCTION public.tg_normalize_group_vendor();

-- 3) Atualizar função: get_unified_customer_groups para incluir os novos campos
CREATE OR REPLACE FUNCTION public.get_unified_customer_groups()
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  nome_grupo text,
  member_count integer,
  vendor_names text[],
  assigned_vendor_cod text,
  assigned_vendor_filial text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      pcg.id_grupo,
      pcg.id AS group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) AS nome_grupo,
      (
        SELECT count(*)::int
        FROM public.unified_accounts ua
        WHERE ua.economic_group_id = pcg.id_grupo
      ) AS member_count,
      (
        SELECT array_agg(DISTINCT sl.assigned_vendor_cod) FILTER (WHERE sl.assigned_vendor_cod IS NOT NULL)
        FROM public.unified_accounts ua2
        LEFT JOIN public.sales_leads sl ON sl.id = ua2.lead_id
        WHERE ua2.economic_group_id = pcg.id_grupo
      ) AS vendor_names,
      pcg.assigned_vendor_cod::text,
      pcg.assigned_vendor_filial::text
    FROM public.protheus_customer_groups pcg
    ORDER BY pcg.id_grupo;
END;
$function$;

-- 4) Atualizar função: get_customer_groups_with_id para incluir os novos campos
-- Mantém a lógica existente e acrescenta os dois campos ao retorno
CREATE OR REPLACE FUNCTION public.get_customer_groups_with_id(p_table_id uuid)
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  filial text,
  cod text,
  nome_grupo text,
  nome_grupo_sugerido text,
  member_count integer,
  vendor_names text[],
  assigned_vendor_cod text,
  assigned_vendor_filial text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table text;
  v_has_vendor_table boolean := false;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public'
      AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pcg.id_grupo,
      pcg.id as group_id,
      pcg.filial,
      pcg.cod,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      pcg.nome_grupo_sugerido,
      (
        SELECT count(*)::int
        FROM public.unified_accounts ua
        WHERE ua.economic_group_id = pcg.id_grupo
      ) as member_count,
      (
        SELECT array_agg(distinct
          CASE 
            WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text
            WHEN sa1.a1_vend IS NOT NULL THEN sa1.a1_vend::text
            WHEN sl.assigned_vendor_cod IS NOT NULL THEN sl.assigned_vendor_cod::text
            ELSE NULL
          END
        ) FILTER (WHERE
          CASE 
            WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome IS NOT NULL
            WHEN sa1.a1_vend IS NOT NULL THEN sa1.a1_vend IS NOT NULL
            WHEN sl.assigned_vendor_cod IS NOT NULL THEN sl.assigned_vendor_cod IS NOT NULL
            ELSE FALSE
          END
        )
        FROM public.unified_accounts ua2
        LEFT JOIN %I sa1 ON (
          ua2.protheus_filial::text = sa1.a1_filial::text AND
          ua2.protheus_cod::text    = sa1.a1_cod::text AND
          ua2.protheus_loja::text   = sa1.a1_loja::text
        )
        LEFT JOIN public.sales_leads sl ON sl.id = ua2.lead_id
        %s
        WHERE ua2.economic_group_id = pcg.id_grupo
      ) as vendor_names,
      pcg.assigned_vendor_cod::text,
      pcg.assigned_vendor_filial::text
    FROM public.protheus_customer_groups pcg
    WHERE pcg.protheus_table_id = %L
    ORDER BY pcg.id_grupo
  $q$,
    v_has_vendor_table,
    v_has_vendor_table,
    v_table,
    CASE WHEN v_has_vendor_table 
      THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = COALESCE(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      ELSE ''
    END,
    p_table_id
  );
END;
$function$;
