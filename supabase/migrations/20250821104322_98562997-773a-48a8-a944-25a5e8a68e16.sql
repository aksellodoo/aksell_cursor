-- Criar função para verificar permissões de página específica
CREATE OR REPLACE FUNCTION public.has_page_modify_permission(page_label text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_department_id uuid;
  user_role text;
  permission_level text;
BEGIN
  -- Buscar departamento e role do usuário
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = user_id AND status = 'active';
  
  -- Se não encontrou o usuário ou não tem departamento, retornar false
  IF user_department_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admins e diretores sempre têm acesso
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- Buscar permissão específica do departamento para esta página
  SELECT access_level INTO permission_level
  FROM public.department_permissions dp
  WHERE dp.department_id = user_department_id 
    AND dp.page_name = page_label;
  
  -- Verificar se tem permissão de modificar
  RETURN permission_level = 'ver_modificar';
END;
$function$;

-- Criar função específica para verificar se pode modificar dados do site
CREATE OR REPLACE FUNCTION public.can_modify_site_products(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.has_page_modify_permission('Dados do Site', user_id);
END;
$function$;