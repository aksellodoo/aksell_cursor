-- Create unified customer groups functions (no table_id dependency)

CREATE OR REPLACE FUNCTION public.get_unified_customer_groups()
 RETURNS TABLE(id_grupo integer, group_id uuid, nome_grupo text, member_count integer, vendor_names text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
    select 
      pcg.id_grupo,
      pcg.id as group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      (
        select count(*)::int
        from public.unified_accounts ua
        where ua.economic_group_id = pcg.id_grupo
      ) as member_count,
      (
        select array_agg(distinct sl.assigned_vendor_cod) filter (where sl.assigned_vendor_cod is not null)
        from public.unified_accounts ua2
        left join public.sales_leads sl on sl.id = ua2.lead_id
        where ua2.economic_group_id = pcg.id_grupo
      ) as vendor_names
    from public.protheus_customer_groups pcg
    order by pcg.id_grupo;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_unified_group_members(p_id_grupo integer)
 RETURNS TABLE(unified_id uuid, display_name text, short_name text, vendor_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
    select 
      ua.id as unified_id,
      coalesce(sl.trade_name, sl.legal_name, 'Cliente ' || ua.protheus_cod) as display_name,
      coalesce(sl.trade_name, sl.legal_name, 'Cliente ' || ua.protheus_cod) as short_name,
      sl.assigned_vendor_cod as vendor_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja
    from public.unified_accounts ua
    left join public.sales_leads sl on sl.id = ua.lead_id
    where ua.economic_group_id = p_id_grupo
    order by display_name;
end;
$function$;

CREATE OR REPLACE FUNCTION public.search_unified_accounts_for_groups_simple(p_search_term text)
 RETURNS TABLE(unified_id uuid, display_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text, current_group_id integer, current_group_name text, vendor_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_term text;
begin
  -- Escapar curinga/escape
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');

  return query
    select
      ua.id as unified_id,
      coalesce(sl.trade_name, sl.legal_name, 'Cliente ' || ua.protheus_cod) as display_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja,
      ua.economic_group_id as current_group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      sl.assigned_vendor_cod as vendor_name
    from public.unified_accounts ua
    left join public.protheus_customer_groups pcg on pcg.id_grupo = ua.economic_group_id
    left join public.sales_leads sl on sl.id = ua.lead_id
    where 
      (
        sl.trade_name ilike '%' || v_term || '%' escape '\' or
        sl.legal_name ilike '%' || v_term || '%' escape '\' or
        coalesce(ua.protheus_cod,'') ilike '%' || v_term || '%' escape '\' or
        coalesce(ua.protheus_loja,'') ilike '%' || v_term || '%' escape '\'
      )
    order by display_name
    limit 50;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_economic_group(p_nome_grupo text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_group_id integer;
  v_uuid uuid;
begin
  insert into public.protheus_customer_groups (name, name_source, created_by)
  values (p_nome_grupo, 'manual', auth.uid())
  returning id_grupo, id into v_group_id, v_uuid;

  return json_build_object(
    'success', true,
    'group_id', v_group_id,
    'uuid', v_uuid
  );
end;
$function$;