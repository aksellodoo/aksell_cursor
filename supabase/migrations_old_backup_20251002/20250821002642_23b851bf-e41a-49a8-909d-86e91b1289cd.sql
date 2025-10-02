BEGIN;

-- 1) Snapshot & disable ALL event triggers
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

-- 2) STUB every function named auto_setup_protheus_table (any schema/signature)
DO $$
DECLARE f record; body text;
BEGIN
  FOR f IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS arg_types, p.prorettype
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'auto_setup_protheus_table'
  LOOP
    IF f.prorettype = 'pg_catalog.event_trigger'::regtype THEN
      body := format($b$
        CREATE OR REPLACE FUNCTION %I.%I(%s)
        RETURNS event_trigger LANGUAGE plpgsql AS $fn$
        BEGIN RETURN; END $fn$;
      $b$, f.schema_name, f.func_name, f.arg_types);
    ELSIF f.prorettype = 'pg_catalog.trigger'::regtype THEN
      body := format($b$
        CREATE OR REPLACE FUNCTION %I.%I(%s)
        RETURNS trigger LANGUAGE plpgsql AS $fn$
        BEGIN IF TG_LEVEL='ROW' THEN RETURN NEW; ELSE RETURN NULL; END IF; END $fn$;
      $b$, f.schema_name, f.func_name, f.arg_types);
    ELSE
      CONTINUE;
    END IF;
    EXECUTE body;
  END LOOP;
END $$;

-- 3) Drop EVENT TRIGGERS that reference those functions (by evtfoid)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT et.evtname
    FROM pg_event_trigger et
    JOIN pg_proc p ON p.oid = et.evtfoid
    WHERE p.proname = 'auto_setup_protheus_table'
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname);  -- sem CASCADE
  END LOOP;
END $$;

-- 3.1) Drop EVENT TRIGGERS by definition text match (extra sweep)
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT et.evtname
    FROM pg_event_trigger et
    WHERE pg_get_event_triggerdef(et.oid) ILIKE '%auto_setup_protheus_table%'
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname);  -- sem CASCADE
  END LOOP;
END $$;

-- 3.5) Drop TABLE triggers (pg_trigger) that use the function
DO $$
DECLARE trg record;
BEGIN
  FOR trg IN
    SELECT n.nspname  AS schema_name,
           c.relname  AS table_name,
           t.tgname   AS trigger_name
    FROM pg_trigger t
    JOIN pg_proc p       ON p.oid = t.tgfoid
    JOIN pg_class c      ON c.oid = t.tgrelid
    JOIN pg_namespace n  ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND p.proname = 'auto_setup_protheus_table'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I',
                   trg.trigger_name, trg.schema_name, trg.table_name); -- sem CASCADE
  END LOOP;
END $$;

-- 4) Drop ALL functions named auto_setup_protheus_table that return event_trigger OR trigger
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS arg_types
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'auto_setup_protheus_table'
      AND p.prorettype IN ('pg_catalog.event_trigger'::regtype, 'pg_catalog.trigger'::regtype)
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) RESTRICT',
                   f.schema_name, f.func_name, f.arg_types); -- RESTRICT
  END LOOP;
END $$;

-- 4.5) Safety check: nenhuma TABLE trigger ainda referenciando a função
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal AND p.proname = 'auto_setup_protheus_table'
  ) THEN
    RAISE EXCEPTION 'Residual TABLE triggers referencing auto_setup_protheus_table still exist';
  END IF;
END $$;

-- 5) Safety checks: no residuals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='auto_setup_protheus_table') THEN
    RAISE EXCEPTION 'Residual functions named auto_setup_protheus_table still exist';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_event_trigger et
    WHERE pg_get_event_triggerdef(et.oid) ILIKE '%auto_setup_protheus_table%'
       OR et.evtfoid IN (SELECT oid FROM pg_proc WHERE proname='auto_setup_protheus_table')
  ) THEN
    RAISE EXCEPTION 'Residual event triggers referencing auto_setup_protheus_table still exist';
  END IF;
END $$;

-- 6) SA3010 hotfix (soft-delete columns + backfill)
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
WHERE d.table_name = 'SA3010'
  AND d.protheus_id = t.protheus_id
  AND NOT t.pending_deletion;

-- 7) Reload PostgREST and restore original event trigger states
PERFORM pg_notify('pgrst','reload schema');

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