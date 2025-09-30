-- Correção definitiva da função generate_password_reset_token
-- Remove a dependência de digest() e usa apenas funções nativas do PostgreSQL

CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  entropy TEXT;
BEGIN
  -- Generate a 32 character random token
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Add timestamp entropy
  entropy := extract(epoch from now())::text || random()::text;
  
  -- Combine and hash using md5 (native PostgreSQL function)
  -- MD5 produces a 32-character hex string which is sufficient for our needs
  RETURN md5(result || entropy);
END;
$function$;