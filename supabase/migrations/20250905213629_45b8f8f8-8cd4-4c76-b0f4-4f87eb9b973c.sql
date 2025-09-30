-- Função para mesclar fornecedor Protheus com fornecedor unificado existente baseado no CNPJ
CREATE OR REPLACE FUNCTION public.merge_unified_supplier_with_protheus(
  p_table_id uuid,
  p_filial text,
  p_cod text,
  p_loja text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table_name text;
  v_supplier_data record;
  v_cnpj_normalized text;
  v_existing_unified record;
  v_result json;
BEGIN
  -- Buscar nome da tabela dinâmica
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tabela dinâmica não encontrada para o table_id fornecido'
    );
  END IF;

  -- Buscar dados do fornecedor Protheus
  EXECUTE format($q$
    SELECT 
      a2_filial::text as filial,
      a2_cod::text as cod,
      a2_loja::text as loja,
      a2_cgc::text as cnpj
    FROM %I
    WHERE a2_filial::text = %L
      AND a2_cod::text = %L
      AND a2_loja::text = %L
    LIMIT 1
  $q$, v_table_name, p_filial, p_cod, p_loja)
  INTO v_supplier_data;

  IF v_supplier_data IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Fornecedor não encontrado na tabela Protheus'
    );
  END IF;

  -- Normalizar CNPJ (apenas dígitos)
  v_cnpj_normalized := regexp_replace(coalesce(v_supplier_data.cnpj, ''), '[^0-9]', '', 'g');

  IF length(v_cnpj_normalized) = 0 THEN
    -- Se não há CNPJ, criar novo registro
    INSERT INTO purchases_unified_suppliers (
      protheus_filial,
      protheus_cod,
      protheus_loja,
      attendance_type,
      status,
      created_by
    ) VALUES (
      v_supplier_data.filial,
      v_supplier_data.cod,
      v_supplier_data.loja,
      'direct',
      'supplier',
      auth.uid()
    );

    RETURN json_build_object(
      'success', true,
      'action', 'created',
      'reason', 'no_cnpj'
    );
  END IF;

  -- Procurar fornecedor unificado existente com mesmo CNPJ
  -- Priorizar: potential_supplier_id IS NOT NULL e protheus_* IS NULL
  SELECT *
  INTO v_existing_unified
  FROM purchases_unified_suppliers
  WHERE regexp_replace(coalesce(cnpj, ''), '[^0-9]', '', 'g') = v_cnpj_normalized
  ORDER BY 
    -- Priorizar registros com potential_supplier_id
    (potential_supplier_id IS NOT NULL)::int DESC,
    -- Priorizar registros sem dados Protheus
    (protheus_filial IS NULL AND protheus_cod IS NULL AND protheus_loja IS NULL)::int DESC,
    -- Em caso de empate, o mais antigo
    created_at ASC
  LIMIT 1;

  IF v_existing_unified IS NOT NULL THEN
    -- Atualizar o registro existente com dados Protheus
    UPDATE purchases_unified_suppliers
    SET 
      protheus_filial = v_supplier_data.filial,
      protheus_cod = v_supplier_data.cod,
      protheus_loja = v_supplier_data.loja,
      updated_at = now()
    WHERE id = v_existing_unified.id;

    RETURN json_build_object(
      'success', true,
      'action', 'merged',
      'unified_id', v_existing_unified.id,
      'had_potential', v_existing_unified.potential_supplier_id IS NOT NULL,
      'had_protheus', v_existing_unified.protheus_filial IS NOT NULL
    );
  ELSE
    -- Criar novo fornecedor unificado
    INSERT INTO purchases_unified_suppliers (
      cnpj,
      protheus_filial,
      protheus_cod,
      protheus_loja,
      attendance_type,
      status,
      created_by
    ) VALUES (
      v_supplier_data.cnpj,
      v_supplier_data.filial,
      v_supplier_data.cod,
      v_supplier_data.loja,
      'direct',
      'supplier',
      auth.uid()
    );

    RETURN json_build_object(
      'success', true,
      'action', 'created',
      'reason', 'no_match'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Função para processar todos os fornecedores SA2010 para mesclagem
CREATE OR REPLACE FUNCTION public.merge_all_sa2010_to_unified(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table_name text;
  v_supplier record;
  v_result json;
  v_merged_count int := 0;
  v_created_count int := 0;
  v_processed_count int := 0;
  v_error_count int := 0;
BEGIN
  -- Buscar nome da tabela dinâmica
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tabela dinâmica não encontrada para o table_id fornecido'
    );
  END IF;

  -- Processar todos os fornecedores da tabela
  FOR v_supplier IN EXECUTE format($q$
    SELECT DISTINCT
      a2_filial::text as filial,
      a2_cod::text as cod,
      a2_loja::text as loja
    FROM %I
    WHERE a2_filial IS NOT NULL
      AND a2_cod IS NOT NULL  
      AND a2_loja IS NOT NULL
  $q$, v_table_name)
  LOOP
    BEGIN
      -- Chamar função de mesclagem para cada fornecedor
      SELECT merge_unified_supplier_with_protheus(
        p_table_id,
        v_supplier.filial,
        v_supplier.cod,
        v_supplier.loja
      ) INTO v_result;

      v_processed_count := v_processed_count + 1;

      -- Contar ações
      IF (v_result->>'success')::boolean THEN
        IF v_result->>'action' = 'merged' THEN
          v_merged_count := v_merged_count + 1;
        ELSIF v_result->>'action' = 'created' THEN
          v_created_count := v_created_count + 1;
        END IF;
      ELSE
        v_error_count := v_error_count + 1;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_processed_count := v_processed_count + 1;
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'merged_count', v_merged_count,
    'created_count', v_created_count,
    'error_count', v_error_count
  );
END;
$function$;

-- Índice para performance na busca por CNPJ normalizado
CREATE INDEX IF NOT EXISTS idx_purchases_unified_suppliers_cnpj_normalized
ON purchases_unified_suppliers USING btree (regexp_replace(coalesce(cnpj, ''), '[^0-9]', '', 'g'))
WHERE cnpj IS NOT NULL;

-- Atualizar política RLS para permitir atualizações em mais casos
DROP POLICY IF EXISTS "Users can update unified suppliers" ON purchases_unified_suppliers;

CREATE POLICY "Users can update unified suppliers"
ON purchases_unified_suppliers
FOR UPDATE
USING (
  -- Criador do registro
  created_by = auth.uid() OR
  -- Registros com created_by NULL (função de claim vai definir)
  created_by IS NULL OR
  -- Admins e diretores
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.role = ANY(ARRAY['admin', 'director'])
  ) OR
  -- Criador do potential supplier vinculado
  (potential_supplier_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM purchases_potential_suppliers ps
    WHERE ps.id = potential_supplier_id 
      AND ps.created_by = auth.uid()
  ))
)
WITH CHECK (
  -- Mesmas condições para o WITH CHECK
  created_by = auth.uid() OR
  created_by IS NULL OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.role = ANY(ARRAY['admin', 'director'])
  ) OR
  (potential_supplier_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM purchases_potential_suppliers ps
    WHERE ps.id = potential_supplier_id 
      AND ps.created_by = auth.uid()
  ))
);