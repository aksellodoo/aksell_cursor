
-- 1) Remove the event trigger and setup/installer functions (idempotent)
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;

DROP FUNCTION IF EXISTS public.auto_setup_protheus_table();
DROP FUNCTION IF EXISTS public.setup_protheus_table_workflow(text);
DROP FUNCTION IF EXISTS public.ensure_protheus_workflow_ready(text);

-- 2) Drop all table triggers on public.protheus_% that use public.emit_protheus_status_change
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      t.tgname AS trigger_name,
      n.nspname AS schema_name,
      c.relname AS table_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE NOT t.tgisinternal
      AND n.nspname = 'public'
      AND c.relname LIKE 'protheus\_%'
      AND p.proname = 'emit_protheus_status_change'
      AND pn.nspname = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.trigger_name, r.schema_name, r.table_name);
  END LOOP;
END $$;

-- 3) Drop the workflow trigger function used by Protheus tables (idempotent)
DROP FUNCTION IF EXISTS public.emit_protheus_status_change();
