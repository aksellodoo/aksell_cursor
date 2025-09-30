-- Remove existing cron jobs to avoid conflicts
SELECT cron.unschedule('protheus-sync-scheduler');
SELECT cron.unschedule('protheus_sync_scheduler');
SELECT cron.unschedule('protheus-sync-monitor');
SELECT cron.unschedule('protheus_sync_monitor');

-- Create new cron job that runs every minute with proper JSON construction
SELECT cron.schedule(
  'protheus-sync-scheduler',
  '* * * * *', -- every minute
  $$
  SELECT net.http_post(
    url := 'https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg'
    ),
    body := jsonb_build_object('triggered_by', 'cron_scheduler')
  ) as request_id;
  $$
);

-- Create sync monitor every 15 minutes
SELECT cron.schedule(
  'protheus-sync-monitor',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/protheus-sync-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg'
    ),
    body := jsonb_build_object('triggered_by', 'cron_monitor')
  ) as request_id;
  $$
);

-- Test immediate execution
SELECT net.http_post(
  url := 'https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg'
  ),
  body := jsonb_build_object('triggered_by', 'manual_test')
) as immediate_test;