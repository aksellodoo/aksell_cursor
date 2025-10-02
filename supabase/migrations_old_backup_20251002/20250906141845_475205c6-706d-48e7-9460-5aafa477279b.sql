-- Create RPC function to set group material types (bypass RLS)
CREATE OR REPLACE FUNCTION public.set_purchases_group_material_types(
  p_group_id integer,
  p_material_type_ids text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted_count integer := 0;
  v_deleted_count integer := 0;
BEGIN
  -- Delete all existing material types for this group
  DELETE FROM public.purchases_economic_group_material_types
  WHERE group_id = p_group_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Insert new material types if provided
  IF p_material_type_ids IS NOT NULL AND array_length(p_material_type_ids, 1) > 0 THEN
    INSERT INTO public.purchases_economic_group_material_types (group_id, material_type_id, created_by)
    SELECT 
      p_group_id,
      mt.id,
      auth.uid()
    FROM public.purchases_material_types mt
    WHERE mt.id = ANY(p_material_type_ids::uuid[]);
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'inserted_count', v_inserted_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create RPC function to set unified supplier material types (bypass RLS)
CREATE OR REPLACE FUNCTION public.set_unified_supplier_material_types(
  p_supplier_id uuid,
  p_material_type_ids text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted_count integer := 0;
  v_deleted_count integer := 0;
BEGIN
  -- Delete all existing material types for this supplier
  DELETE FROM public.purchases_unified_supplier_material_types
  WHERE supplier_id = p_supplier_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Insert new material types if provided
  IF p_material_type_ids IS NOT NULL AND array_length(p_material_type_ids, 1) > 0 THEN
    INSERT INTO public.purchases_unified_supplier_material_types (supplier_id, material_type_id, created_by)
    SELECT 
      p_supplier_id,
      mt.id,
      auth.uid()
    FROM public.purchases_material_types mt
    WHERE mt.id = ANY(p_material_type_ids::uuid[]);
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'inserted_count', v_inserted_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;