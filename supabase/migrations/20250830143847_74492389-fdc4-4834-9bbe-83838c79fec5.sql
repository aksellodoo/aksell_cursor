-- Fix get_group_leads function to use correct table name
CREATE OR REPLACE FUNCTION public.get_group_leads(p_id_grupo integer)
 RETURNS TABLE(lead_id uuid, trade_name text, legal_name text, assigned_vendor_cod text, vendor_name text, cnpj text, city_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_vendor_table BOOLEAN := false;
BEGIN
  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sl.id as lead_id,
      sl.trade_name::text,
      sl.legal_name::text,
      sl.assigned_vendor_cod::text,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sl.assigned_vendor_cod::text 
      END as vendor_name,
      sl.cnpj::text,
      c.name::text as city_name
    FROM public.sales_leads sl
    LEFT JOIN public.site_cities c ON c.id = sl.city_id
    %s
    WHERE sl.economic_group_id = %L
    ORDER BY sl.trade_name
  $q$, 
       v_has_vendor_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sl.assigned_vendor_cod::text'
            ELSE ''
       END,
       p_id_grupo);
END;
$function$;

-- Fix search_leads_for_groups function to use correct table name
CREATE OR REPLACE FUNCTION public.search_leads_for_groups(p_search_term text)
 RETURNS TABLE(lead_id uuid, trade_name text, legal_name text, cnpj text, assigned_vendor_cod text, vendor_name text, current_group_id integer, current_group_name text, city_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_escaped_search TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  -- Escape search term
  v_escaped_search := replace(replace(replace(p_search_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sl.id as lead_id,
      sl.trade_name::text,
      sl.legal_name::text,
      sl.cnpj::text,
      sl.assigned_vendor_cod::text,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sl.assigned_vendor_cod::text 
      END as vendor_name,
      sl.economic_group_id as current_group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      c.name::text as city_name
    FROM public.sales_leads sl
    LEFT JOIN public.site_cities c ON c.id = sl.city_id
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = sl.economic_group_id
    %s
    WHERE (
      sl.trade_name::text ILIKE %L ESCAPE '\' OR
      sl.legal_name::text ILIKE %L ESCAPE '\' OR
      sl.cnpj::text ILIKE %L ESCAPE '\'
    )
    ORDER BY sl.trade_name
    LIMIT 50
  $q$, 
       v_has_vendor_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sl.assigned_vendor_cod::text'
            ELSE ''
       END,
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%');
END;
$function$;

-- Create delete_economic_group function
CREATE OR REPLACE FUNCTION public.delete_economic_group(p_id_grupo integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_member_count integer;
  v_lead_count integer;
BEGIN
  -- Check if group has members or leads
  SELECT COUNT(*) INTO v_member_count
  FROM public.protheus_customer_group_units
  WHERE group_id = p_id_grupo;
  
  SELECT COUNT(*) INTO v_lead_count
  FROM public.sales_leads
  WHERE economic_group_id = p_id_grupo;
  
  -- If group has members or leads, remove them first
  IF v_member_count > 0 THEN
    DELETE FROM public.protheus_customer_group_units
    WHERE group_id = p_id_grupo;
  END IF;
  
  IF v_lead_count > 0 THEN
    UPDATE public.sales_leads
    SET economic_group_id = NULL
    WHERE economic_group_id = p_id_grupo;
  END IF;
  
  -- Delete the group
  DELETE FROM public.protheus_customer_groups
  WHERE id_grupo = p_id_grupo;
  
  RETURN json_build_object(
    'success', true,
    'removed_members', v_member_count,
    'removed_leads', v_lead_count
  );
END;
$function$;