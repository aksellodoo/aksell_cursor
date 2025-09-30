
-- Fix 1) update_protheus_customer_groups: Logar group_id como INTEGER (sem cast p/ uuid)
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
  v_group_exists BOOLEAN;
BEGIN
  -- Nome da tabela dinâmica
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Inicia execução
  INSERT INTO public.protheus_group_update_runs (protheus_table_id, triggered_by)
  VALUES (p_table_id, auth.uid())
  RETURNING id INTO v_run_id;

  -- Percorre unidades ainda não vinculadas a nenhum grupo
  FOR v_unit IN EXECUTE format($q$
    SELECT DISTINCT 
      a1_filial::text AS filial,
      a1_cod::text    AS cod,
      a1_loja::text   AS loja,
      a1_nome::text   AS nome
    FROM %I sa1
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod    = sa1.a1_cod::text
        AND pgu.loja   = sa1.a1_loja::text
    )
    ORDER BY a1_filial, a1_cod, a1_loja
  $q$, v_table, p_table_id)
  LOOP
    -- Tenta achar grupo existente por (filial, cod)
    SELECT id_grupo INTO v_group_id_grupo
    FROM public.protheus_customer_groups
    WHERE protheus_table_id = p_table_id
      AND filial = v_unit.filial
      AND cod    = v_unit.cod
    LIMIT 1;

    v_group_exists := v_group_id_grupo IS NOT NULL;

    -- Cria grupo se não existir
    IF v_group_id_grupo IS NULL THEN
      INSERT INTO public.protheus_customer_groups (
        protheus_table_id, filial, cod, name, name_source
      )
      VALUES (
        p_table_id, v_unit.filial, v_unit.cod, v_unit.nome, 'auto_created'
      )
      RETURNING id_grupo INTO v_group_id_grupo;

      v_new_groups_count := v_new_groups_count + 1;
    END IF;

    -- Vincula unidade ao grupo (id_grupo integer)
    INSERT INTO public.protheus_customer_group_units (
      protheus_table_id, filial, cod, loja, group_id, assigned_by
    ) VALUES (
      p_table_id, v_unit.filial, v_unit.cod, v_unit.loja, v_group_id_grupo, auth.uid()
    );

    -- Log da ação da unidade processada
    INSERT INTO public.protheus_group_update_results (
      run_id, filial, cod, loja, action, group_id, reason
    ) VALUES (
      v_run_id,
      v_unit.filial,
      v_unit.cod,
      v_unit.loja,
      CASE WHEN v_group_exists THEN 'assigned_to_existing' ELSE 'created_group' END,
      v_group_id_grupo, -- integer, sem cast
      CASE WHEN v_group_exists THEN 'Associado ao grupo existente' ELSE 'Novo grupo criado' END
    );

    v_new_members_count := v_new_members_count + 1;
  END LOOP;

  -- Conta membros ignorados (já tinham grupo)
  EXECUTE format($q$
    SELECT COUNT(*)
    FROM %I sa1
    WHERE EXISTS (
      SELECT 1 
      FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod    = sa1.a1_cod::text
        AND pgu.loja   = sa1.a1_loja::text
    )
  $q$, v_table, p_table_id)
  INTO v_ignored_members_count;

  -- Atualiza unit_count de todos os grupos dessa tabela
  UPDATE public.protheus_customer_groups g
  SET unit_count = (
    SELECT COUNT(*) FROM public.protheus_customer_group_units pgu
    WHERE pgu.group_id = g.id_grupo
  )
  WHERE g.protheus_table_id = p_table_id;

  -- Finaliza execução
  UPDATE public.protheus_group_update_runs
  SET finished_at = now(),
      new_groups_count = v_new_groups_count,
      new_members_count = v_new_members_count
  WHERE id = v_run_id;

  RETURN json_build_object(
    'run_id', v_run_id,
    'new_groups_count', v_new_groups_count,
    'new_members_count', v_new_members_count,
    'ignored_members_count', v_ignored_members_count
  );
END;
$function$;


-- Fix 2) list_group_units: JOIN pelo id_grupo (integer) em vez de id (uuid)
CREATE OR REPLACE FUNCTION public.list_group_units(p_table_id uuid)
RETURNS TABLE(
  filial text, cod text, loja text, nome text, group_id integer, group_name text, assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pgu.filial,
      pgu.cod,
      pgu.loja,
      sa1.a1_nome::text AS nome,
      pgu.group_id, -- integer
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text) AS group_name,
      pgu.assigned_at
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text    = pgu.cod AND
      sa1.a1_loja::text   = pgu.loja
    )
    JOIN public.protheus_customer_groups pcg 
      ON pcg.id_grupo = pgu.group_id -- corrigido
    WHERE pgu.protheus_table_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  $q$, v_table, p_table_id);
END;
$function$;


-- Fix 3) get_last_group_update_results: JOIN pelo id_grupo (integer)
CREATE OR REPLACE FUNCTION public.get_last_group_update_results(p_table_id uuid)
RETURNS TABLE(
  filial text, cod text, loja text, nome text, action text, group_name text, reason text, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
  v_last_run_id UUID;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  SELECT id INTO v_last_run_id
  FROM public.protheus_group_update_runs
  WHERE protheus_table_id = p_table_id
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_last_run_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pgur.filial,
      pgur.cod,
      pgur.loja,
      sa1.a1_nome::text AS nome,
      pgur.action,
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text) AS group_name,
      pgur.reason,
      pgur.created_at
    FROM public.protheus_group_update_results pgur
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgur.filial AND
      sa1.a1_cod::text    = pgur.cod AND
      sa1.a1_loja::text   = pgur.loja
    )
    JOIN public.protheus_customer_groups pcg 
      ON pcg.id_grupo = pgur.group_id -- corrigido
    WHERE pgur.run_id = %L
    ORDER BY pgur.created_at DESC
  $q$, v_table, v_last_run_id);
END;
$function$;
