-- Fix the create_purchases_economic_group function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.create_purchases_economic_group(p_name text DEFAULT NULL::text)
RETURNS TABLE(id_grupo integer, code text, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_id integer;
  v_final_code text;
  v_final_name text;
BEGIN
  -- Insert new group and capture the generated id
  INSERT INTO public.purchases_economic_groups (name, name_source, created_by)
  VALUES (
    NULLIF(btrim(p_name), ''),
    CASE WHEN p_name IS NOT NULL AND btrim(p_name) <> '' THEN 'manual' ELSE NULL END,
    auth.uid()
  )
  RETURNING purchases_economic_groups.id_grupo INTO v_new_id;

  -- Get the final values after trigger execution
  SELECT 
    g.code,
    COALESCE(g.name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0'))
  INTO v_final_code, v_final_name
  FROM public.purchases_economic_groups g
  WHERE g.id_grupo = v_new_id;

  -- Return the result
  RETURN QUERY SELECT v_new_id, v_final_code, v_final_name;
END;
$function$;