
-- 1) Atualiza a função: passar a usar unified_accounts como fonte
CREATE OR REPLACE FUNCTION public.update_protheus_customer_groups(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
  v_run_id UUID;
  v_new_groups_count INTEGER := 0;
  v_new_members_count INTEGER := 0;
  v_ignored_members_count INTEGER := 0;
  v_unit RECORD;
  v_group_id_grupo INTEGER;
  v_group_uuid UUID;
  v_group_exists BOOLEAN;
BEGIN
  -- Descobrir a tabela dinâmica SA1 correspondente (para obter nomes)
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Registrar execução
  INSERT INTO public.protheus_group_update_runs (protheus_table_id, triggered_by)
  VALUES (p_table_id, auth.uid())
  RETURNING id INTO v_run_id;

  -- Percorre unidades (filial, cod, loja) que existam em unified_accounts e ainda não estejam em grupo
  FOR v_unit IN EXECUTE format($q$
    SELECT DISTINCT
      ua.protheus_filial::text AS filial,
      ua.protheus_cod::text    AS cod,
      ua.protheus_loja::text   AS loja,
      sa1.a1_nome::text        AS nome
    FROM public.unified_accounts ua
    LEFT JOIN %I sa1
      ON sa1.a1_filial::text = ua.protheus_filial::text
     AND sa1.a1_cod::text    = ua.protheus_cod::text
     AND sa1.a1_loja::text   = ua.protheus_loja::text
    WHERE ua.protheus_filial IS NOT NULL
      AND ua.protheus_cod    IS NOT NULL
      AND ua.protheus_loja   IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM public.protheus_customer_group_units pgu
        WHERE pgu.protheus_table_id = %L
          AND pgu.filial = ua.protheus_filial::text
          AND pgu.cod    = ua.protheus_cod::text
          AND pgu.loja   = ua.protheus_loja::text
      )
    ORDER BY 1,2,3
  $q$, v_table, p_table_id)
  LOOP
    -- Localiza grupo existente (captura INTEGER e UUID)
    SELECT id_grupo, id
      INTO v_group_id_grupo, v_group_uuid
    FROM public.protheus_customer_groups
    WHERE protheus_table_id = p_table_id
      AND filial = v_unit.filial
      AND cod    = v_unit.cod
    LIMIT 1;

    v_group_exists := v_group_id_grupo IS NOT NULL;

    -- Cria grupo se necessário (usa o nome da SA1 quando disponível)
    IF NOT v_group_exists THEN
      INSERT INTO public.protheus_customer_groups (
        protheus_table_id,
        filial,
        cod,
        name,
        name_source
      ) VALUES (
        p_table_id,
        v_unit.filial,
        v_unit.cod,
        v_unit.nome,
        'auto_created'
      )
      RETURNING id_grupo, id INTO v_group_id_grupo, v_group_uuid;

      v_new_groups_count := v_new_groups_count + 1;
    END IF;

    -- Vincula unidade ao grupo (usa id_grupo INTEGER)
    INSERT INTO public.protheus_customer_group_units (
      protheus_table_id,
      filial,
      cod,
      loja,
      group_id,
      assigned_by
    ) VALUES (
      p_table_id,
      v_unit.filial,
      v_unit.cod,
      v_unit.loja,
      v_group_id_grupo,
      auth.uid()
    );

    -- Registra resultado da execução usando SEMPRE o INTEGER id_grupo
    INSERT INTO public.protheus_group_update_results (
      run_id,
      filial,
      cod,
      loja,
      action,
      group_id,
      reason
    ) VALUES (
      v_run_id,
      v_unit.filial,
      v_unit.cod,
      v_unit.loja,
      CASE WHEN v_group_exists THEN 'assigned_to_existing' ELSE 'created_group' END,
      v_group_id_grupo,
      CASE WHEN v_group_exists THEN 'Associado ao grupo existente' ELSE 'Novo grupo criado' END
    );

    v_new_members_count := v_new_members_count + 1;
  END LOOP;

  -- Membros já em grupo (ignorados) – agora a partir de unified_accounts
  EXECUTE format($q$
    SELECT COUNT(*)
    FROM public.unified_accounts ua
    WHERE ua.protheus_filial IS NOT NULL
      AND ua.protheus_cod    IS NOT NULL
      AND ua.protheus_loja   IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM public.protheus_customer_group_units pgu
        WHERE pgu.protheus_table_id = %L
          AND pgu.filial = ua.protheus_filial::text
          AND pgu.cod    = ua.protheus_cod::text
          AND pgu.loja   = ua.protheus_loja::text
      )
  $q$, p_table_id)
  INTO v_ignored_members_count;

  -- Atualiza contagem de unidades por grupo
  UPDATE public.protheus_customer_groups g
  SET unit_count = (
    SELECT COUNT(*)
    FROM public.protheus_customer_group_units pgu
    WHERE pgu.group_id = g.id_grupo
  )
  WHERE g.protheus_table_id = p_table_id;

  -- Finaliza execução
  UPDATE public.protheus_group_update_runs
  SET 
    finished_at       = now(),
    new_groups_count  = v_new_groups_count,
    new_members_count = v_new_members_count
  WHERE id = v_run_id;

  RETURN json_build_object(
    'success', true,
    'run_id', v_run_id,
    'new_groups_count', v_new_groups_count,
    'new_members_count', v_new_members_count,
    'ignored_members_count', v_ignored_members_count
  );
END;
$function$;

-- 2) Atualiza get_group_members para incluir status do unified_accounts
CREATE OR REPLACE FUNCTION public.get_group_members(p_id_grupo integer, p_table_id uuid)
RETURNS TABLE(
  filial text, 
  cod text, 
  loja text, 
  nome text, 
  nome_reduzido text, 
  vendor_name text,
  unified_status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Verifica se existe a tabela de vendedores
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pgu.filial,
      pgu.cod,
      pgu.loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sa1.a1_vend::text 
      END as vendor_name,
      ua.status::text as unified_status
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    LEFT JOIN public.unified_accounts ua ON (
      ua.protheus_filial::text = pgu.filial AND
      ua.protheus_cod::text    = pgu.cod AND
      ua.protheus_loja::text   = pgu.loja
    )
    %s
    WHERE pgu.group_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  $q$, 
       v_has_vendor_table, 
       v_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sa1.a1_vend::text'
            ELSE ''
       END,
       p_id_grupo);
END;
$function$;
