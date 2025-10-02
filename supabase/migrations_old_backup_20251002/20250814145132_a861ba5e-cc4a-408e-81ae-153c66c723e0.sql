-- LIMPEZA DEFINITIVA: Primeiro buscar todas as versões existentes
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    -- Buscar todas as funções check_device_trust_anonymous
    FOR func_rec IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'check_device_trust_anonymous'
    LOOP
        -- Dropar cada função com sua assinatura específica
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s)', func_rec.proname, func_rec.args);
        RAISE LOG 'Dropped function: public.%(%)', func_rec.proname, func_rec.args;
    END LOOP;
END
$$;

-- Agora criar a função limpa
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Log para debug
  RAISE LOG 'check_device_trust_anonymous called with fingerprint: %', LEFT(device_fingerprint_param, 10);
  
  -- Verificar se existe dispositivo confiável
  SELECT EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE device_fingerprint = device_fingerprint_param
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  RAISE LOG 'Device trust check result: %', is_trusted;
  
  RETURN is_trusted;
END;
$function$;