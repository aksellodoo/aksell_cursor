-- Fix create_economic_group function to handle required NOT NULL constraints
CREATE OR REPLACE FUNCTION public.create_economic_group(p_nome_grupo text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_group_id integer;
  v_uuid uuid;
  v_default_table_id uuid := '80f17f00-0960-44ac-b810-6f8f1a36ccdc'; -- SA1010_CLIENTES as default
  v_unique_cod text;
begin
  -- Generate unique code using epoch timestamp
  v_unique_cod := 'EG_' || extract(epoch from now())::bigint::text;

  insert into public.protheus_customer_groups (
    protheus_table_id, 
    filial, 
    cod, 
    name, 
    name_source
  )
  values (
    v_default_table_id,
    'UN', -- Unified groups filial
    v_unique_cod,
    p_nome_grupo, 
    'manual'
  )
  returning id_grupo, id into v_group_id, v_uuid;

  return json_build_object(
    'success', true,
    'group_id', v_group_id,
    'uuid', v_uuid
  );
end;
$function$