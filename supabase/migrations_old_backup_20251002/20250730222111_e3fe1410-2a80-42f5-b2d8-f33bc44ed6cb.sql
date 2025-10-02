-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron jobs para sistema de agendamento automático

-- 1. Job principal: Processar triggers recorrentes (a cada minuto)
SELECT cron.schedule(
  'process-recurring-triggers',
  '* * * * *', -- todo minuto
  $$
  SELECT net.http_post(
    url := 'https://chgkxvzsxtfobxwosfcx.supabase.co/functions/v1/process-recurring-triggers',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ2t4dnpzeHRmb2J4d29zZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTMzNzQsImV4cCI6MjA2OTEyOTM3NH0.XLPGmhCUqV2kvmP1D8bzSECTSFIlBN_R3mOL5JdsDmA"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- 2. Job de monitoramento: Processar triggers de inatividade e acúmulo (a cada 5 minutos)
SELECT cron.schedule(
  'process-monitoring-triggers',
  '*/5 * * * *', -- a cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://chgkxvzsxtfobxwosfcx.supabase.co/functions/v1/process-auto-triggers',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ2t4dnpzeHRmb2J4d29zZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTMzNzQsImV4cCI6MjA2OTEyOTM3NH0.XLPGmhCUqV2kvmP1D8bzSECTSFIlBN_R3mOL5JdsDmA"}'::jsonb,
    body := '{"triggerType": "user_inactive"}'::jsonb
  ) as request_id;
  $$
);

-- 3. Job de processamento da fila: Processar workflows pendentes (a cada 30 segundos)
SELECT cron.schedule(
  'process-pending-workflows',
  '*/1 * * * *', -- a cada minuto (mais conservador que 30s)
  $$
  SELECT net.http_post(
    url := 'https://chgkxvzsxtfobxwosfcx.supabase.co/functions/v1/process-pending-workflows',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ2t4dnpzeHRmb2J4d29zZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTMzNzQsImV4cCI6MjA2OTEyOTM3NH0.XLPGmhCUqV2kvmP1D8bzSECTSFIlBN_R3mOL5JdsDmA"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- 4. Job de limpeza: Limpar execuções antigas e logs (diariamente às 2h)
SELECT cron.schedule(
  'cleanup-old-executions',
  '0 2 * * *', -- diariamente às 2h
  $$
  -- Remover execuções completadas há mais de 30 dias
  DELETE FROM public.workflow_executions 
  WHERE status IN ('completed', 'failed') 
    AND completed_at < now() - INTERVAL '30 days';
  
  -- Remover logs de trigger antigos (mais de 7 dias)
  DELETE FROM public.workflow_trigger_logs 
  WHERE created_at < now() - INTERVAL '7 days';
  $$
);

-- Criar tabela para monitorar jobs (opcional)
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'success',
  details JSONB DEFAULT '{}'
);