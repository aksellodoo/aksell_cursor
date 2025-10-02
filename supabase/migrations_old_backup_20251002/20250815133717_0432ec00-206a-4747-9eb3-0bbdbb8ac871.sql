-- Add new columns for enhanced sync configuration
ALTER TABLE public.protheus_tables
ADD COLUMN sync_type TEXT DEFAULT 'interval' CHECK (sync_type IN ('interval', 'schedule', 'cron')),
ADD COLUMN sync_schedule JSONB DEFAULT '[]'::jsonb,
ADD COLUMN cron_expression TEXT DEFAULT NULL;