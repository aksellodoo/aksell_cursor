-- Corrigir security warning da função is_test_user
CREATE OR REPLACE FUNCTION public.is_test_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (
      email ILIKE '%test%' 
      OR name ILIKE '%[TEST]%'
    )
  );
$$;