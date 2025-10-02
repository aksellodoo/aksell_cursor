-- Create function to check if user can modify a specific page based on department permissions
CREATE OR REPLACE FUNCTION public.user_can_modify_page(p_page_name text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  user_dept uuid;
  permission_level permission_level;
BEGIN
  -- Get user's role and department
  SELECT role, department_id INTO user_role, user_dept
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Admins and directors can always modify
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- If no department, deny access
  IF user_dept IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get permission level for the user's role and department
  SELECT 
    CASE 
      WHEN user_role = 'hr' THEN dp.hr_permission
      WHEN user_role = 'user' AND EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_leader = true) THEN dp.leader_permission
      WHEN user_role = 'user' THEN dp.user_permission
      ELSE 'bloquear_acesso'::permission_level
    END INTO permission_level
  FROM public.department_permissions dp
  WHERE dp.department_id = user_dept AND dp.page_name = p_page_name;
  
  -- Return true if permission allows modification
  RETURN COALESCE(permission_level = 'ver_modificar', false);
END;
$$;

-- Update RLS policies for site_products
DROP POLICY IF EXISTS "Users can view all site products" ON public.site_products;
DROP POLICY IF EXISTS "Users can insert site products" ON public.site_products;
DROP POLICY IF EXISTS "Users can update site products" ON public.site_products;
DROP POLICY IF EXISTS "Users can delete site products" ON public.site_products;

CREATE POLICY "Authenticated users can view site products" 
ON public.site_products FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert site products with permissions" 
ON public.site_products FOR INSERT 
WITH CHECK (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can update site products with permissions" 
ON public.site_products FOR UPDATE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can delete site products with permissions" 
ON public.site_products FOR DELETE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

-- Update RLS policies for site_product_segments_map
DROP POLICY IF EXISTS "Users can view product segments" ON public.site_product_segments_map;
DROP POLICY IF EXISTS "Users can insert product segments" ON public.site_product_segments_map;
DROP POLICY IF EXISTS "Users can update product segments" ON public.site_product_segments_map;
DROP POLICY IF EXISTS "Users can delete product segments" ON public.site_product_segments_map;

CREATE POLICY "Authenticated users can view product segments" 
ON public.site_product_segments_map FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert product segments with permissions" 
ON public.site_product_segments_map FOR INSERT 
WITH CHECK (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can update product segments with permissions" 
ON public.site_product_segments_map FOR UPDATE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can delete product segments with permissions" 
ON public.site_product_segments_map FOR DELETE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

-- Update RLS policies for site_product_applications_map
DROP POLICY IF EXISTS "Users can view product applications" ON public.site_product_applications_map;
DROP POLICY IF EXISTS "Users can insert product applications" ON public.site_product_applications_map;
DROP POLICY IF EXISTS "Users can update product applications" ON public.site_product_applications_map;
DROP POLICY IF EXISTS "Users can delete product applications" ON public.site_product_applications_map;

CREATE POLICY "Authenticated users can view product applications" 
ON public.site_product_applications_map FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert product applications with permissions" 
ON public.site_product_applications_map FOR INSERT 
WITH CHECK (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can update product applications with permissions" 
ON public.site_product_applications_map FOR UPDATE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can delete product applications with permissions" 
ON public.site_product_applications_map FOR DELETE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

-- Update RLS policies for site_product_groups_map
DROP POLICY IF EXISTS "Users can view product groups" ON public.site_product_groups_map;
DROP POLICY IF EXISTS "Users can insert product groups" ON public.site_product_groups_map;
DROP POLICY IF EXISTS "Users can update product groups" ON public.site_product_groups_map;
DROP POLICY IF EXISTS "Users can delete product groups" ON public.site_product_groups_map;

CREATE POLICY "Authenticated users can view product groups" 
ON public.site_product_groups_map FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert product groups with permissions" 
ON public.site_product_groups_map FOR INSERT 
WITH CHECK (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can update product groups with permissions" 
ON public.site_product_groups_map FOR UPDATE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

CREATE POLICY "Users can delete product groups with permissions" 
ON public.site_product_groups_map FOR DELETE 
USING (public.user_can_modify_page('Dados do Site', auth.uid()));