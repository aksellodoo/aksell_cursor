BEGIN;

-- A) Snapshot + disable all EVENT TRIGGERS
DROP TABLE IF EXISTS temp_event_trigger_state;
CREATE TEMP TABLE temp_event_trigger_state
ON COMMIT DROP
AS SELECT evtname, evtenabled FROM pg_event_trigger;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT evtname FROM pg_event_trigger LOOP
    EXECUTE format('ALTER EVENT TRIGGER %I DISABLE', r.evtname);
  END LOOP;
END $$;

-- B) Drop event triggers that reference the function (by evtfoid)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT et.evtname
    FROM pg_event_trigger et
    JOIN pg_proc p ON p.oid = et.evtfoid
    WHERE p.proname = 'auto_setup_protheus_table'
      AND p.prorettype = 'pg_catalog.event_trigger'::regtype
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname);
  END LOOP;
END $$;

-- C) Drop event triggers whose definition mentions the function (text match)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT et.evtname
    FROM pg_event_trigger et
    WHERE pg_get_event_triggerdef(et.oid) ILIKE '%auto_setup_protheus_table%'
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname);
  END LOOP;
END $$;

-- D) Drop ALL functions named auto_setup_protheus_table that return event_trigger (any schema/signature)
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
      AND p.prorettype = 'pg_catalog.event_trigger'::regtype
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) RESTRICT',
                   f.schema_name, f.func_name, f.args);
  END LOOP;
END $$;

-- E) Safety check (no residuals)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_setup_protheus_table') THEN
    RAISE EXCEPTION 'Residual functions named auto_setup_protheus_table still exist.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_event_trigger et
    WHERE pg_get_event_triggerdef(et.oid) ILIKE '%auto_setup_protheus_table%'
       OR et.evtfoid IN (SELECT oid FROM pg_proc WHERE proname='auto_setup_protheus_table')
  ) THEN
    RAISE EXCEPTION 'Residual event triggers referencing auto_setup_protheus_table still exist.';
  END IF;
END $$;

-- F) SA3010 hotfix: create soft-delete columns, update structure, backfill
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;

UPDATE protheus_dynamic_tables t
SET table_structure = jsonb_set(
  t.table_structure,
  '{columns}',
  (
    SELECT jsonb_agg(DISTINCT c)
    FROM jsonb_array_elements(
           coalesce(t.table_structure->'columns','[]'::jsonb)
           || jsonb_build_array(
                jsonb_build_object('name','pending_deletion','type','boolean'),
                jsonb_build_object('name','pending_deletion_at','type','timestamptz')
              )
         ) AS c
  ),
  true
)
WHERE t.id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.table_name = 'SA3010'
  AND d.protheus_id = t.protheus_id
  AND NOT t.pending_deletion;

-- G) Reload PostgREST schema
PERFORM pg_notify('pgrst', 'reload schema');

-- H) Restore original EVENT TRIGGER states
DO $$
DECLARE r record; cmd text;
BEGIN
  FOR r IN SELECT evtname, evtenabled FROM temp_event_trigger_state LOOP
    IF EXISTS (SELECT 1 FROM pg_event_trigger e WHERE e.evtname = r.evtname) THEN
      cmd := CASE r.evtenabled
        WHEN 'O' THEN 'ENABLE'
        WHEN 'R' THEN 'ENABLE REPLICA'
        WHEN 'A' THEN 'ENABLE ALWAYS'
        ELSE NULL
      END;
      IF cmd IS NOT NULL THEN
        EXECUTE format('ALTER EVENT TRIGGER %I %s', r.evtname, cmd);
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;