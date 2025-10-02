-- Remove the problematic auto_setup_protheus_table function directly by name
-- The function has a bug in its code that references non-existent column "object_name"

-- First, check and remove any event triggers that might use this function
DO $$
DECLARE
    trigger_name text;
BEGIN
    -- Get all event triggers that reference auto_setup_protheus_table
    FOR trigger_name IN 
        SELECT evtname 
        FROM pg_event_trigger e
        JOIN pg_proc p ON e.evtfoid = p.oid
        WHERE p.proname = 'auto_setup_protheus_table'
    LOOP
        EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I CASCADE', trigger_name);
        RAISE NOTICE 'Dropped event trigger: %', trigger_name;
    END LOOP;
END $$;

-- Now drop the problematic function itself
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- Clean up any related cron jobs
DO $$
DECLARE
    job_id bigint;
    command_text text;
BEGIN
    FOR job_id, command_text IN 
        SELECT jobid, command FROM cron.job 
        WHERE command ILIKE '%auto_setup_protheus_table%'
    LOOP
        PERFORM cron.unschedule(job_id);
        RAISE NOTICE 'Unscheduled cron job % with command: %', job_id, command_text;
    END LOOP;
END $$;

-- Log the successful cleanup
INSERT INTO public.field_audit_log (
    record_id, 
    field_name, 
    old_value, 
    new_value, 
    changed_by, 
    record_type
) VALUES (
    gen_random_uuid(),
    'auto_setup_function_removal',
    'buggy_auto_setup_protheus_table_function',
    'successfully_removed_function_and_triggers',
    COALESCE(auth.uid(), '00000000-0000-0000-000000000000'),
    'system_maintenance'
);