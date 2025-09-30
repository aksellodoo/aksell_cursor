-- Fix Function Search Path Mutable warning
-- Update clean_message_preview function to have secure search_path
CREATE OR REPLACE FUNCTION public.clean_message_preview(message_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Remove menções de UUID (@uuid) e outros padrões técnicos
  RETURN regexp_replace(
    regexp_replace(message_text, '@[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '', 'g'),
    '\s+', ' ', 'g'
  );
END;
$function$;