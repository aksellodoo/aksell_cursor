-- Fix the search path security warning by setting search_path in the existing function
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';