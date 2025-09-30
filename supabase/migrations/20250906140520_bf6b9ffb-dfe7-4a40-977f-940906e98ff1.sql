-- Função de sincronização única para dados existentes
CREATE OR REPLACE FUNCTION public.sync_existing_unified_to_potential_material_types()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_synced_count integer := 0;
  v_cleaned_count integer := 0;
BEGIN
  -- 1) Limpar tipos de materiais do potencial que não existem no unificado
  WITH to_clean AS (
    DELETE FROM public.purchases_potential_supplier_material_types psmt
    WHERE EXISTS (
      SELECT 1 
      FROM public.purchases_unified_suppliers us
      WHERE us.potential_supplier_id = psmt.supplier_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.purchases_unified_supplier_material_types usmt
      JOIN public.purchases_unified_suppliers us2 ON us2.id = usmt.supplier_id
      WHERE us2.potential_supplier_id = psmt.supplier_id
        AND usmt.material_type_id = psmt.material_type_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_cleaned_count FROM to_clean;

  -- 2) Sincronizar tipos do unificado para o potencial
  WITH to_sync AS (
    INSERT INTO public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
    SELECT 
      us.potential_supplier_id,
      usmt.material_type_id,
      usmt.created_by
    FROM public.purchases_unified_supplier_material_types usmt
    JOIN public.purchases_unified_suppliers us ON us.id = usmt.supplier_id
    WHERE us.potential_supplier_id IS NOT NULL
    ON CONFLICT (supplier_id, material_type_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_synced_count FROM to_sync;

  RETURN json_build_object(
    'success', true,
    'synced_count', v_synced_count,
    'cleaned_count', v_cleaned_count,
    'message', format('Sincronização concluída: %s tipos adicionados, %s tipos removidos', v_synced_count, v_cleaned_count)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro durante a sincronização'
    );
END;
$$;

-- Executar a sincronização
SELECT public.sync_existing_unified_to_potential_material_types();