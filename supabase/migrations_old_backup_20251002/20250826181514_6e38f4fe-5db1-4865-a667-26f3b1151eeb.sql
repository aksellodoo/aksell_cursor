-- Create RPC function to get unit names for a specific group
CREATE OR REPLACE FUNCTION public.get_protheus_group_unit_names(
  p_table_id uuid,
  p_filial text,
  p_cod text
)
RETURNS TABLE(
  unit_name text,
  short_name text,
  vendor text,
  loja text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      a1_nome::text AS unit_name,
      a1_nreduz::text AS short_name,
      a1_vend::text AS vendor,
      a1_loja::text AS loja
    FROM %I
    WHERE a1_filial::text = %L
      AND a1_cod::text = %L
    ORDER BY a1_loja::text
  $q$, v_table, p_filial, p_cod);
END;
$$;