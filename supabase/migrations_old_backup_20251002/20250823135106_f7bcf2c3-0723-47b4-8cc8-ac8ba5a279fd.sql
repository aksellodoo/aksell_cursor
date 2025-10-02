
-- Unschedule any previous variants to avoid duplicates
select cron.unschedule('protheus-sync-scheduler');
select cron.unschedule('protheus_sync_scheduler');
select cron.unschedule('protheus-sync-monitor');
select cron.unschedule('protheus_sync_monitor');

-- Schedule the Protheus sync scheduler to run every minute
select
  cron.schedule(
    'protheus-sync-scheduler',
    '* * * * *', -- every minute
    $$
    select
      net.http_post(
          url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
          body:='{"triggered_by":"cron_scheduler"}'::jsonb
      ) as request_id;
    $$
  );

-- Optionally, keep the monitor every 15 minutes (recreate cleanly)
select
  cron.schedule(
    'protheus-sync-monitor',
    '*/15 * * * *', -- every 15 minutes
    $$
    select
      net.http_post(
          url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/protheus-sync-monitor',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
          body:='{"triggered_by":"cron_monitor"}'::jsonb
      ) as request_id;
    $$
  );

-- Trigger one immediate run to test after scheduling
select
  net.http_post(
      url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
      body:='{"triggered_by":"manual_activation"}'::jsonb
  ) as immediate_request_id;
