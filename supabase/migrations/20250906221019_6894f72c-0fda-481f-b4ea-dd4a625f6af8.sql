-- Create RPC to count protheus suppliers without unified suppliers
CREATE OR REPLACE FUNCTION count_protheus_without_unified()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
  v_count integer := 0;
BEGIN
  -- Get union of all SA2010 tables
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    RETURN 0;
  END IF;

  -- Count protheus suppliers without unified suppliers
  EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT COUNT(DISTINCT (sa2.a2_filial, sa2.a2_cod, sa2.a2_loja))::integer
    FROM sa2_all sa2
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.purchases_unified_suppliers us
      WHERE us.protheus_filial = sa2.a2_filial
        AND us.protheus_cod = sa2.a2_cod
        AND us.protheus_loja = sa2.a2_loja
    )
  $q$, v_union_sa2) INTO v_count;

  RETURN v_count;
END;
$function$;