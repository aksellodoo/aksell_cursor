-- Fix the JOIN mismatch in get_last_group_update_results function
CREATE OR REPLACE FUNCTION public.get_last_group_update_results(p_table_id uuid)
 RETURNS TABLE(filial text, cod text, loja text, nome text, action text, group_name text, reason text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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

  -- Get the last run ID
  SELECT id INTO v_last_run_id
  FROM public.protheus_group_update_runs
  WHERE protheus_table_id = p_table_id
  ORDER BY started_at DESC
  LIMIT 1;

  -- If no runs found, return empty result
  IF v_last_run_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format('
    SELECT 
      pgur.filial,
      pgur.cod,
      pgur.loja,
      sa1.a1_nome::text AS nome,
      pgur.action,
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text, ''Grupo não encontrado'') AS group_name,
      pgur.reason,
      pgur.created_at
    FROM public.protheus_group_update_results pgur
    LEFT JOIN %I sa1 ON (
      sa1.a1_filial::text = pgur.filial AND
      sa1.a1_cod::text = pgur.cod AND
      sa1.a1_loja::text = pgur.loja
    )
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id = pgur.group_id
    WHERE pgur.run_id = %L
    ORDER BY pgur.created_at DESC
  ', v_table, v_last_run_id);
END;
$function$