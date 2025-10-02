BEGIN;

-- 0) Disable ONLY the offending EVENT TRIGGERS first (no other DDL before this)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT evtname
    FROM pg_event_trigger
    WHERE evtfoid IN (SELECT oid FROM pg_proc WHERE proname = 'auto_setup_protheus_table')
  LOOP
    EXECUTE format('ALTER EVENT TRIGGER %I DISABLE', t.evtname);
  END LOOP;
END $$;

-- 1) Drop those event triggers (now disabled)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT evtname
    FROM pg_event_trigger
    WHERE evtfoid IN (SELECT oid FROM pg_proc WHERE proname = 'auto_setup_protheus_table')
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname); -- no CASCADE
  END LOOP;
END $$;

-- 2) Drop any TABLE triggers that still call the function (defensive)
DO $$
DECLARE trg record;
BEGIN
  FOR trg IN
    SELECT n.nspname, c.relname, t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND p.proname = 'auto_setup_protheus_table'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', trg.tgname, trg.nspname, trg.relname);
  END LOOP;
END $$;

-- 3) Drop the function(s) (any schema/signature) with RESTRICT
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT n.nspname AS schema_name,
           p.proname  AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'auto_setup_protheus_table'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) RESTRICT', f.schema_name, f.func_name, f.args);
  END LOOP;
END $$;

-- 4) Sanity check: no residuals
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='auto_setup_protheus_table') THEN
    RAISE EXCEPTION 'Residual function still exists';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_event_trigger et
    JOIN pg_proc p ON p.oid = et.evtfoid
    WHERE p.proname='auto_setup_protheus_table'
  ) THEN
    RAISE EXCEPTION 'Residual event trigger still exists';
  END IF;
END $$;

-- 5) SA3010: add columns, index, update structure, backfill (using supabase_table_name)
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;

UPDATE protheus_dynamic_tables t
SET table_structure = jsonb_set(
  t.table_structure,'{columns}',
  (SELECT jsonb_agg(DISTINCT c)
     FROM jsonb_array_elements(
          coalesce(t.table_structure->'columns','[]'::jsonb)
          || jsonb_build_array(
               jsonb_build_object('name','pending_deletion','type','boolean'),
               jsonb_build_object('name','pending_deletion_at','type','timestamptz')
             )
     ) AS c), true)
WHERE t.id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.supabase_table_name = 'protheus_sa3010_fc3d70f6'
  AND d.protheus_id = t.protheus_id
  AND t.pending_deletion IS DISTINCT FROM true;

-- 6) Reload PostgREST
SELECT pg_notify('pgrst','reload schema');

COMMIT;