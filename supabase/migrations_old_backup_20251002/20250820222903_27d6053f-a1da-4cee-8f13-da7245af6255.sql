
BEGIN;

DO $$
DECLARE
  trigger_rec RECORD;
  func_rec RECORD;
  original_trigger_state RECORD;
  cleanup_count INTEGER := 0;
BEGIN
  -- Step 1: Snapshot current event trigger state and disable all
  DROP TABLE IF EXISTS temp_event_trigger_state;
  CREATE TEMP TABLE temp_event_trigger_state
  ON COMMIT DROP
  AS
  SELECT evtname, evtenabled
  FROM pg_event_trigger;

  FOR trigger_rec IN
    SELECT evtname FROM pg_event_trigger WHERE evtenabled <> 'D'
  LOOP
    EXECUTE format('ALTER EVENT TRIGGER %I DISABLE', trigger_rec.evtname);
  END LOOP;

  RAISE NOTICE 'Event triggers disabled for cleanup';

  -- Step 2: Drop event triggers that reference auto_setup_protheus_table by function OID
  FOR trigger_rec IN
    SELECT et.evtname, et.evtfoid
    FROM pg_event_trigger et
    JOIN pg_proc p ON et.evtfoid = p.oid
    WHERE p.proname = 'auto_setup_protheus_table'
      AND p.prorettype = 'pg_catalog.event_trigger'::regtype
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', trigger_rec.evtname);
    cleanup_count := cleanup_count + 1;
    RAISE NOTICE 'Dropped event trigger % (OID reference)', trigger_rec.evtname;
  END LOOP;

  -- Step 3: Drop event triggers by definition text match (use pg_get_event_triggerdef)
  FOR trigger_rec IN
    SELECT evtname
    FROM pg_event_trigger
    WHERE pg_get_event_triggerdef(oid) ILIKE '%auto_setup_protheus_table%'
  LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', trigger_rec.evtname);
    cleanup_count := cleanup_count + 1;
    RAISE NOTICE 'Dropped event trigger % (text reference)', trigger_rec.evtname;
  END LOOP;

  -- Step 4: Drop all functions returning event_trigger (any schema/signature) with RESTRICT
  FOR func_rec IN
    SELECT n.nspname AS schema_name,
           p.proname  AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'auto_setup_protheus_table'
      AND p.prorettype = 'pg_catalog.event_trigger'::regtype
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) RESTRICT',
                   func_rec.schema_name, func_rec.function_name, func_rec.args);
    cleanup_count := cleanup_count + 1;
    RAISE NOTICE 'Dropped function %.%(%)', func_rec.schema_name, func_rec.function_name, func_rec.args;
  END LOOP;

  -- Step 5: Safety checks - no residuals in pg_proc or pg_event_trigger
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'auto_setup_protheus_table'
  ) THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: residual functions named auto_setup_protheus_table in pg_proc';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger et
    WHERE pg_get_event_triggerdef(et.oid) ILIKE '%auto_setup_protheus_table%'
       OR et.evtfoid IN (SELECT oid FROM pg_proc WHERE proname = 'auto_setup_protheus_table')
  ) THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: residual event triggers referencing auto_setup_protheus_table';
  END IF;

  -- Step 6: Restore original event trigger states
  FOR original_trigger_state IN
    SELECT evtname, evtenabled FROM temp_event_trigger_state
  LOOP
    IF EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = original_trigger_state.evtname) THEN
      IF original_trigger_state.evtenabled = 'O' THEN
        EXECUTE format('ALTER EVENT TRIGGER %I ENABLE', original_trigger_state.evtname);
      ELSIF original_trigger_state.evtenabled = 'R' THEN
        EXECUTE format('ALTER EVENT TRIGGER %I ENABLE REPLICA', original_trigger_state.evtname);
      ELSIF original_trigger_state.evtenabled = 'A' THEN
        EXECUTE format('ALTER EVENT TRIGGER %I ENABLE ALWAYS', original_trigger_state.evtname);
      END IF;
    END IF;
  END LOOP;

  -- Step 7: Refresh PostgREST schema cache
  PERFORM pg_notify('pgrst', 'reload schema');

  RAISE NOTICE 'Cleanup completed successfully. Removed % items. PostgREST schema reloaded.', cleanup_count;
END $$;

COMMIT;
