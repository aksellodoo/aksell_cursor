-- Update get_customer_groups_with_id to include leads in member_count
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
      (
        -- Count Protheus units
        (SELECT COUNT(*) FROM public.protheus_customer_group_units pgu WHERE pgu.group_id = pcg.id_grupo)::int +
        -- Count leads linked to this group  
        (SELECT COUNT(*) FROM public.sales_leads sl WHERE sl.economic_group_id = pcg.id_grupo)::int
      ) as member_count,
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

-- Function to add lead to economic group
CREATE OR REPLACE FUNCTION public.add_lead_to_group(p_id_grupo integer, p_lead_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_group_id integer;
  v_old_group_member_count integer;
  v_old_group_lead_count integer;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if lead already belongs to another group
    SELECT economic_group_id INTO v_old_group_id
    FROM public.sales_leads
    WHERE id = p_lead_id;

    -- If lead belongs to another group, check if old group will become empty
    IF v_old_group_id IS NOT NULL AND v_old_group_id != p_id_grupo THEN
      -- Count remaining members in old group (excluding this lead)
      SELECT COUNT(*) INTO v_old_group_member_count
      FROM public.protheus_customer_group_units
      WHERE group_id = v_old_group_id;
      
      -- Count remaining leads in old group (excluding this lead)
      SELECT COUNT(*) INTO v_old_group_lead_count
      FROM public.sales_leads
      WHERE economic_group_id = v_old_group_id AND id != p_lead_id;

      -- If old group will be empty, delete it
      IF v_old_group_member_count = 0 AND v_old_group_lead_count = 0 THEN
        DELETE FROM public.protheus_customer_groups
        WHERE id_grupo = v_old_group_id;
      END IF;
    END IF;

    -- Update lead with new group
    UPDATE public.sales_leads
    SET economic_group_id = p_id_grupo
    WHERE id = p_lead_id;

    RETURN json_build_object(
      'success', true,
      'old_group_deleted', (v_old_group_member_count = 0 AND v_old_group_lead_count = 0),
      'old_group_id', v_old_group_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$function$;

-- Function to remove lead from economic group
CREATE OR REPLACE FUNCTION public.remove_lead_from_group(p_id_grupo integer, p_lead_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_remaining_members integer;
  v_remaining_leads integer;
BEGIN
  -- Remove lead from group
  UPDATE public.sales_leads
  SET economic_group_id = NULL
  WHERE id = p_lead_id AND economic_group_id = p_id_grupo;

  -- Check if group is now empty
  SELECT COUNT(*) INTO v_remaining_members
  FROM public.protheus_customer_group_units
  WHERE group_id = p_id_grupo;
  
  SELECT COUNT(*) INTO v_remaining_leads
  FROM public.sales_leads
  WHERE economic_group_id = p_id_grupo;

  -- Delete group if empty
  IF v_remaining_members = 0 AND v_remaining_leads = 0 THEN
    DELETE FROM public.protheus_customer_groups
    WHERE id_grupo = p_id_grupo;
    
    RETURN json_build_object(
      'success', true,
      'group_deleted', true
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'group_deleted', false
  );
END;
$function$;

-- Function to get leads in a group
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
    LEFT JOIN public.cities c ON c.id = sl.city_id
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

-- Function to search leads for groups
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
    LEFT JOIN public.cities c ON c.id = sl.city_id
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