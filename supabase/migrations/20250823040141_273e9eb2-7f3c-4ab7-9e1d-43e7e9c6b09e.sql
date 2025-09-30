-- Reativar sincronização automática com pg_cron
-- Remover jobs existentes primeiro para evitar duplicatas
SELECT cron.unschedule('protheus-sync-scheduler');
SELECT cron.unschedule('protheus-sync-monitor');

-- Agendar process-protheus-sync-scheduler a cada 5 minutos
SELECT cron.schedule(
  'protheus-sync-scheduler',
  '*/5 * * * *', -- a cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
        body:='{"triggered_by": "cron_scheduler"}'::jsonb
    ) as request_id;
  $$
);

-- Agendar protheus-sync-monitor a cada 15 minutos para monitoramento
SELECT cron.schedule(
  'protheus-sync-monitor',
  '*/15 * * * *', -- a cada 15 minutos
  $$
  SELECT
    net.http_post(
        url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/protheus-sync-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
        body:='{"triggered_by": "cron_monitor"}'::jsonb
    ) as request_id;
  $$
);

-- Executar uma invocação imediata do scheduler para testar
SELECT
  net.http_post(
      url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
      body:='{"triggered_by": "manual_activation"}'::jsonb
  ) as immediate_request_id;