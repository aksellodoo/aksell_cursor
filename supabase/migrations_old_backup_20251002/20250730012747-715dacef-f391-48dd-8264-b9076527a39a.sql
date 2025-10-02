-- Fix the function search path mutable warning properly
CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  token TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate a 64 character token using random characters
  FOR i IN 1..64 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Add some entropy using timestamp
  token := result || extract(epoch from clock_timestamp())::text;
  
  -- Hash it to ensure consistent length and format - use fully qualified function names
  RETURN encode(public.digest(token, 'sha256'), 'hex');
END;
$function$;