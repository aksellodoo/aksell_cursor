-- Create table to log deletions during Protheus syncs
CREATE TABLE IF NOT EXISTS public.protheus_sync_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protheus_table_id UUID NOT NULL,
  supabase_table_name TEXT NOT NULL,
  protheus_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_log_id UUID NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.protheus_sync_deletions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'protheus_sync_deletions' AND policyname = 'System can insert deletion logs'
  ) THEN
    CREATE POLICY "System can insert deletion logs"
    ON public.protheus_sync_deletions
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'protheus_sync_deletions' AND policyname = 'Users can view deletion logs'
  ) THEN
    CREATE POLICY "Users can view deletion logs"
    ON public.protheus_sync_deletions
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_protheus_sync_deletions_table ON public.protheus_sync_deletions (protheus_table_id);
CREATE INDEX IF NOT EXISTS idx_protheus_sync_deletions_pid ON public.protheus_sync_deletions (protheus_id);
