-- Fix portal_users security vulnerability
-- The issue is that RLS policies are permissive but don't explicitly deny unauthenticated access
-- We need to ensure no public access is possible

-- Drop existing policies to recreate them more securely
DROP POLICY IF EXISTS "Admins/directors can view active portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Portal owner can view portal users" ON public.portal_users;

-- Create restrictive SELECT policies that explicitly require authentication
CREATE POLICY "Admins/directors can view active portal users" 
ON public.portal_users 
FOR SELECT 
TO authenticated
USING (
  (EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active' 
      AND p.role = ANY (ARRAY['admin', 'director'])
  )) 
  AND is_active = true
);

CREATE POLICY "Portal owner can view portal users" 
ON public.portal_users 
FOR SELECT 
TO authenticated
USING (
  (EXISTS ( 
    SELECT 1
    FROM portals prt
    WHERE prt.id = portal_users.portal_id 
      AND prt.created_by = auth.uid()
  )) 
  AND (EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active'
  )) 
  AND is_active = true
);

-- Ensure all other policies are also restricted to authenticated users only
-- Update INSERT policies to be more explicit about authentication requirements
DROP POLICY IF EXISTS "Admins/directors can insert portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Portal owner can insert portal users" ON public.portal_users;

CREATE POLICY "Admins/directors can insert portal users" 
ON public.portal_users 
FOR INSERT 
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND (EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active' 
      AND p.role = ANY (ARRAY['admin', 'director'])
  ))
);

CREATE POLICY "Portal owner can insert portal users" 
ON public.portal_users 
FOR INSERT 
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND (EXISTS ( 
    SELECT 1
    FROM portals prt
    WHERE prt.id = portal_users.portal_id 
      AND prt.created_by = auth.uid()
  )) 
  AND (EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active'
  ))
);

-- Update UPDATE policies to be more explicit about authentication
DROP POLICY IF EXISTS "Admins/directors can update portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Portal owner can update portal users" ON public.portal_users;

CREATE POLICY "Admins/directors can update portal users" 
ON public.portal_users 
FOR UPDATE 
TO authenticated
USING (
  EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active' 
      AND p.role = ANY (ARRAY['admin', 'director'])
  )
)
WITH CHECK (true);

CREATE POLICY "Portal owner can update portal users" 
ON public.portal_users 
FOR UPDATE 
TO authenticated
USING (
  EXISTS ( 
    SELECT 1
    FROM portals prt
    WHERE prt.id = portal_users.portal_id 
      AND prt.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS ( 
    SELECT 1
    FROM portals prt
    WHERE prt.id = portal_users.portal_id 
      AND prt.created_by = auth.uid()
  )
);

-- Update DELETE policies to be more explicit about authentication  
DROP POLICY IF EXISTS "Admins/directors can delete portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Portal owner can delete portal users" ON public.portal_users;

CREATE POLICY "Admins/directors can delete portal users" 
ON public.portal_users 
FOR DELETE 
TO authenticated
USING (
  EXISTS ( 
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.status = 'active' 
      AND p.role = ANY (ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Portal owner can delete portal users" 
ON public.portal_users 
FOR DELETE 
TO authenticated
USING (
  EXISTS ( 
    SELECT 1
    FROM portals prt
    WHERE prt.id = portal_users.portal_id 
      AND prt.created_by = auth.uid()
  )
);

-- Add a explicit DENY policy for anonymous users as an extra security measure
CREATE POLICY "Deny all access to anonymous users" 
ON public.portal_users 
FOR ALL 
TO anon
USING (false);