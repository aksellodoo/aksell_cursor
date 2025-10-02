-- Safely remove existing cron jobs if they exist
DO $$
BEGIN
  -- Try to unschedule jobs, ignore errors if they don't exist
  BEGIN
    PERFORM cron.unschedule('protheus-sync-scheduler');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, ignore
  END;
  
  BEGIN
    PERFORM cron.unschedule('protheus_sync_scheduler');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, ignore
  END;
  
  BEGIN
    PERFORM cron.unschedule('protheus-sync-monitor');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, ignore
  END;
  
  BEGIN
    PERFORM cron.unschedule('protheus_sync_monitor');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, ignore
  END;
END $$;

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

-- Test immediate execution to verify the fix
SELECT net.http_post(
  url := 'https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA7MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg'
  ),
  body := jsonb_build_object('triggered_by', 'migration_test')
) as immediate_test;