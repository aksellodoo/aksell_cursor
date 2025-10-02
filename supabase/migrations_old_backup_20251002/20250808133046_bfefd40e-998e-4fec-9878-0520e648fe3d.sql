
DO $$
DECLARE
  r RECORD;
  idx_name TEXT;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE 'protheus\_%' ESCAPE '\'
  LOOP
    -- last_sync_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.table_name AND column_name = 'last_sync_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN last_sync_id uuid NULL;', r.table_name);
    END IF;

    -- last_synced_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.table_name AND column_name = 'last_synced_at'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN last_synced_at timestamptz NULL;', r.table_name);
    END IF;

    -- was_updated_last_sync
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.table_name AND column_name = 'was_updated_last_sync'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN was_updated_last_sync boolean NOT NULL DEFAULT false;', r.table_name);
    END IF;

    -- previous_record_hash
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.table_name AND column_name = 'previous_record_hash'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN previous_record_hash text NULL;', r.table_name);
    END IF;

    -- protheus_id (garantia; pode já existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.table_name AND column_name = 'protheus_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN protheus_id text NULL;', r.table_name);
    END IF;

    -- Indexes (nomes encurtados + hash do nome para evitar exceder limite)
    idx_name := 'idx_'||left(r.table_name, 40)||'_lsid_'||substr(md5(r.table_name),1,6);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (last_sync_id);', idx_name, r.table_name);

    idx_name := 'idx_'||left(r.table_name, 40)||'_new_'||substr(md5(r.table_name),1,6);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (is_new_record);', idx_name, r.table_name);

    idx_name := 'idx_'||left(r.table_name, 40)||'_upd_'||substr(md5(r.table_name),1,6);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (was_updated_last_sync);', idx_name, r.table_name);

    -- Trigger de updated_at (opcional, só se quiser manter sempre atualizado via trigger)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = r.table_name
        AND t.tgname = r.table_name || '_set_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_protheus_dynamic_tables_updated_at();',
        r.table_name || '_set_updated_at', r.table_name
      );
    END IF;
  END LOOP;
END
$$;
