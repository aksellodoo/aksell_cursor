-- Create pg_cron job for automated Protheus notifications
-- This replaces the Edge Function scheduler with a more reliable pg_cron approach

SELECT cron.schedule(
  'automated-protheus-notifications',
  '*/2 * * * *', -- Run every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/automated-protheus-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
        body:=concat('{"triggered_by": "cron_automated_notifications", "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);