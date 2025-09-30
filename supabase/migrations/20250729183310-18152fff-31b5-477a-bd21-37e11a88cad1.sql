-- Corrigir o search_path das funções para atender ao linter de segurança
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(ip_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Contar solicitações do mesmo IP nas últimas 24 horas
  SELECT COUNT(*) INTO request_count
  FROM public.pending_access_requests
  WHERE request_ip_hash = ip_hash
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Retornar true se estiver dentro do limite (≤20)
  RETURN request_count < 20;
END;
$$;

-- Corrigir o search_path da função de limpeza
CREATE OR REPLACE FUNCTION public.cleanup_old_access_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover solicitações antigas (aprovadas/rejeitadas há mais de 30 dias)
  DELETE FROM public.pending_access_requests 
  WHERE status IN ('approved', 'rejected')
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;