-- Fix update_protheus_customer_groups to use id_grupo consistently and handle missing vendor table
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
  v_has_vendor_table BOOLEAN := false;
BEGIN
  -- Get table name
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  -- Create a new run record
  INSERT INTO public.protheus_group_update_runs (protheus_table_id, triggered_by)
  VALUES (p_table_id, auth.uid())
  RETURNING id INTO v_run_id;

  -- Process each unit (filial, cod, loja) that is not yet assigned to any group
  FOR v_unit IN EXECUTE format('
    SELECT DISTINCT 
      a1_filial::text AS filial,
      a1_cod::text AS cod,
      a1_loja::text AS loja,
      a1_nome::text AS nome
    FROM %I sa1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod = sa1.a1_cod::text
        AND pgu.loja = sa1.a1_loja::text
    )
    ORDER BY a1_filial, a1_cod, a1_loja
  ', v_table, p_table_id)
  LOOP
    -- Check if a group already exists for this filial+cod combination
    SELECT id_grupo INTO v_group_id_grupo
    FROM public.protheus_customer_groups
    WHERE protheus_table_id = p_table_id
      AND filial = v_unit.filial
      AND cod = v_unit.cod
    LIMIT 1;

    v_group_exists := v_group_id_grupo IS NOT NULL;

    -- If no group exists, create one
    IF v_group_id_grupo IS NULL THEN
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
      ) RETURNING id_grupo INTO v_group_id_grupo;
      
      v_new_groups_count := v_new_groups_count + 1;
    END IF;

    -- Assign the unit to the group using id_grupo
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

    -- Log the action
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
      v_group_id_grupo::uuid,
      CASE WHEN v_group_exists THEN 'Associado ao grupo existente' ELSE 'Novo grupo criado' END
    );

    v_new_members_count := v_new_members_count + 1;
  END LOOP;

  -- Count ignored members (those already in groups)
  EXECUTE format('
    SELECT COUNT(*)
    FROM %I sa1
    WHERE EXISTS (
      SELECT 1 FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod = sa1.a1_cod::text
        AND pgu.loja = sa1.a1_loja::text
    )
  ', v_table, p_table_id) INTO v_ignored_members_count;

  -- Update unit counts for all affected groups
  UPDATE public.protheus_customer_groups
  SET unit_count = (
    SELECT COUNT(*)
    FROM public.protheus_customer_group_units pgu
    WHERE pgu.group_id = protheus_customer_groups.id_grupo
  )
  WHERE protheus_table_id = p_table_id;

  -- Update run completion
  UPDATE public.protheus_group_update_runs
  SET 
    finished_at = now(),
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

-- Fix get_customer_groups_with_id to handle missing vendor table
CREATE OR REPLACE FUNCTION public.get_customer_groups_with_id(p_table_id uuid)
 RETURNS TABLE(id_grupo integer, group_id uuid, filial text, cod text, nome_grupo text, nome_grupo_sugerido text, member_count integer, vendor_names text[])
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

  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pcg.id_grupo,
      pcg.id as group_id,
      pcg.filial,
      pcg.cod,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      pcg.nome_grupo_sugerido,
      COUNT(pgu.group_id)::integer as member_count,
      CASE 
        WHEN %L THEN ARRAY_AGG(DISTINCT sa3.a3_nome::text) FILTER (WHERE sa3.a3_nome IS NOT NULL)
        ELSE ARRAY_AGG(DISTINCT sa1.a1_vend::text) FILTER (WHERE sa1.a1_vend IS NOT NULL)
      END as vendor_names
    FROM public.protheus_customer_groups pcg
    LEFT JOIN public.protheus_customer_group_units pgu ON pgu.group_id = pcg.id_grupo
    LEFT JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    %s
    WHERE pcg.protheus_table_id = %L
    GROUP BY pcg.id_grupo, pcg.id, pcg.filial, pcg.cod, pcg.name, pcg.ai_suggested_name, pcg.nome_grupo_sugerido
    ORDER BY pcg.id_grupo
  $q$, 
       v_has_vendor_table, 
       v_table, 
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sa1.a1_vend::text'
            ELSE ''
       END,
       p_table_id);
END;
$function$;

-- Fix get_group_members to handle missing vendor table  
CREATE OR REPLACE FUNCTION public.get_group_members(p_id_grupo integer, p_table_id uuid)
 RETURNS TABLE(filial text, cod text, loja text, nome text, nome_reduzido text, vendor_name text)
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

  -- Check if vendor table exists
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
      END as vendor_name
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
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