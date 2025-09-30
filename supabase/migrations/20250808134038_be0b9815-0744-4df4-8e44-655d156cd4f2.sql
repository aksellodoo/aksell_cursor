-- Add change-tracking columns to all dynamic Protheus tables and supporting indexes/triggers
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      AND table_name LIKE 'protheus\_%'
      AND table_name NOT IN ('protheus_dynamic_tables')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS record_hash TEXT', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS previous_record_hash TEXT', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS was_updated_last_sync BOOLEAN NOT NULL DEFAULT false', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_sync_id UUID', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()', r.table_name);

    -- Helpful indexes for filtering
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (was_updated_last_sync)', 'idx_'||r.table_name||'_was_updated_last_sync', r.table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (is_new_record)', 'idx_'||r.table_name||'_is_new_record', r.table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (last_sync_id)', 'idx_'||r.table_name||'_last_sync_id', r.table_name);

    -- Ensure updated_at trigger exists
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE t.tgname = (r.table_name || '_updated_at')
        AND c.relname = r.table_name
    ) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_protheus_dynamic_tables_updated_at()'
      , r.table_name || '_updated_at', r.table_name);
    END IF;
  END LOOP;
END $$;