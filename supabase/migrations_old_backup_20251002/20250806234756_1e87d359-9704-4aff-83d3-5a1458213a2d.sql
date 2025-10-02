-- Fix Function Search Path Mutable warnings
-- Update update_task_types_updated_at function with proper search path
CREATE OR REPLACE FUNCTION public.update_task_types_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_protheus_queries_updated_at function with proper search path
CREATE OR REPLACE FUNCTION public.update_protheus_queries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_task_types_updated_at() IS 'Trigger function to update updated_at timestamp - Fixed search path for security';
COMMENT ON FUNCTION public.update_protheus_queries_updated_at() IS 'Trigger function to update updated_at timestamp - Fixed search path for security';