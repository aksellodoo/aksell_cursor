-- Clean up any remaining auto_setup_protheus_table functions and event triggers
DROP FUNCTION IF EXISTS auto_setup_protheus_table() CASCADE;

-- Remove any remaining event triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'protheus_table_setup_trigger') THEN
        DROP EVENT TRIGGER protheus_table_setup_trigger;
    END IF;
END $$;