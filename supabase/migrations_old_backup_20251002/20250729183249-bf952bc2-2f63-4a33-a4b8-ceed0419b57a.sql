-- Adicionar colunas para rate limiting por IP
ALTER TABLE public.pending_access_requests 
ADD COLUMN request_ip_hash TEXT,
ADD COLUMN request_user_agent TEXT;

-- Criar índice para performance nas consultas de rate limiting
CREATE INDEX idx_pending_requests_ip_hash_created ON public.pending_access_requests(request_ip_hash, created_at);

-- Função para verificar rate limiting por IP
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(ip_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Função para limpar registros antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_access_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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