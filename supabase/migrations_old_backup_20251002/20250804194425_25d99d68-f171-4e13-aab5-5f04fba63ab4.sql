-- Configurar cron job para sincronização automática das tabelas Protheus
-- Executa a cada 5 minutos
SELECT cron.schedule(
  'protheus-sync-scheduler',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://chgkxvzsxtfobxwosfcx.supabase.co/functions/v1/process-protheus-sync-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ2t4dnpzeHRmb2J4d29zZmN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU1MzM3NCwiZXhwIjoyMDY5MTI5Mzc0fQ.aR9CrQhMTSaGzw0TFBHOPsEKqXi8VqCh_pHnqXMrZjU"}'::jsonb,
    body := concat('{"scheduled_run": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);