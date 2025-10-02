-- Create RPC to automatically create unified suppliers from missing Protheus suppliers
CREATE OR REPLACE FUNCTION create_missing_unified_suppliers_from_protheus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
  v_created_count integer := 0;
  v_processed_count integer := 0;
  v_errors text[] := '{}';
  v_rec record;
BEGIN
  -- Get union of all SA2010 tables
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
    RETURN json_build_object(
      'success', false,
      'message', 'Nenhuma tabela SA2010 encontrada',
      'created_count', 0,
      'processed_count', 0
    );
  END IF;

  -- Find and create missing unified suppliers from Protheus
  FOR v_rec IN EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    missing_protheus AS (
      SELECT DISTINCT
        sa2.a2_filial,
        sa2.a2_cod,
        sa2.a2_loja,
        sa2.a2_nome,
        sa2.a2_nreduz,
        sa2.a2_cgc
      FROM sa2_all sa2
      WHERE NOT EXISTS (
        SELECT 1 
        FROM public.purchases_unified_suppliers us
        WHERE us.protheus_filial = sa2.a2_filial
          AND us.protheus_cod = sa2.a2_cod
          AND us.protheus_loja = sa2.a2_loja
      )
    )
    SELECT * FROM missing_protheus
    ORDER BY a2_filial, a2_cod, a2_loja
  $q$, v_union_sa2)
  LOOP
    BEGIN
      v_processed_count := v_processed_count + 1;
      
      -- Create unified supplier for this Protheus supplier
      INSERT INTO public.purchases_unified_suppliers (
        protheus_filial,
        protheus_cod,
        protheus_loja,
        cnpj,
        created_by
      ) VALUES (
        v_rec.a2_filial,
        v_rec.a2_cod,
        v_rec.a2_loja,
        CASE 
          WHEN v_rec.a2_cgc IS NOT NULL 
          THEN regexp_replace(v_rec.a2_cgc, '[^0-9]', '', 'g')
          ELSE NULL 
        END,
        auth.uid()
      );
      
      v_created_count := v_created_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || format('Erro ao criar unificado para %s-%s-%s: %s', 
          v_rec.a2_filial, v_rec.a2_cod, v_rec.a2_loja, SQLERRM);
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', format('Criados %s fornecedores unificados de %s processados do Protheus', v_created_count, v_processed_count),
    'created_count', v_created_count,
    'processed_count', v_processed_count,
    'errors', v_errors
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro geral: ' || SQLERRM,
      'created_count', v_created_count,
      'processed_count', v_processed_count
    );
END;
$function$;