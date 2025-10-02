BEGIN;
WITH tf AS (SELECT oid FROM pg_proc WHERE proname='auto_setup_protheus_table')
UPDATE pg_event_trigger SET evtenabled='D' WHERE evtfoid IN (SELECT oid FROM tf);
DELETE FROM pg_event_trigger WHERE evtfoid IN (SELECT oid FROM tf);

DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT oid::regprocedure::text FROM pg_proc WHERE proname='auto_setup_protheus_table' LOOP
    EXECUTE 'DROP FUNCTION '||fn||' RESTRICT';
  END LOOP;
END $$;
COMMIT;

-- Sanity checks (should return 0 rows)
SELECT 1 FROM pg_proc WHERE proname='auto_setup_protheus_table';
SELECT 1 FROM pg_event_trigger et JOIN pg_proc p ON p.oid=et.evtfoid
 WHERE p.proname='auto_setup_protheus_table';