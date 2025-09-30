-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron jobs for protheus sync
SELECT cron.unschedule('protheus-sync-scheduler') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'protheus-sync-scheduler'
);

SELECT cron.unschedule('invoke-protheus-sync-scheduler') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'invoke-protheus-sync-scheduler'
);

-- Remove any reference to non-existent protheus-sync-monitor
SELECT cron.unschedule('protheus-sync-monitor') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'protheus-sync-monitor'
);

-- Schedule the protheus sync scheduler to run every 5 minutes
SELECT cron.schedule(
  'protheus-sync-scheduler',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/process-protheus-sync-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
        body:='{"source": "cron", "triggered_at": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Add next_due_at column to protheus_tables for better sync prediction
ALTER TABLE public.protheus_tables 
ADD COLUMN IF NOT EXISTS next_due_at timestamp with time zone;

-- Create index for performance on next_due_at queries
CREATE INDEX IF NOT EXISTS idx_protheus_tables_next_due_at 
ON public.protheus_tables(next_due_at) 
WHERE is_active = true;