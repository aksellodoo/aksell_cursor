
-- 1) Garantir que o schema de extensões existe
create schema if not exists extensions;

-- 2) Ativar extensões necessárias para agendamentos e chamadas HTTP
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- 3) (Re)criar o agendamento do Scheduler a cada 5 minutos
-- Se já existir, removemos e criamos novamente
select cron.unschedule('protheus_sync_scheduler');

select
  cron.schedule(
    'protheus_sync_scheduler',
    '*/5 * * * *',  -- a cada 5 minutos
    $$
    select
      net.http_post(
          url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
          body:=jsonb_build_object('source','pg_cron','scheduled_at', now())
      ) as request_id;
    $$
  );

-- 4) (Opcional) Agendar monitor de saúde a cada 30 minutos
select cron.unschedule('protheus_sync_monitor');

select
  cron.schedule(
    'protheus_sync_monitor',
    '*/30 * * * *',  -- a cada 30 minutos
    $$
    select
      net.http_post(
          url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/protheus-sync-monitor',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
          body:=jsonb_build_object('source','pg_cron','scheduled_at', now())
      ) as request_id;
    $$
  );
