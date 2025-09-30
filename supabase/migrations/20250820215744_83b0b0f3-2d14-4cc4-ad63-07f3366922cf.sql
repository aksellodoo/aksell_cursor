-- Remove auto_setup_protheus_table function and related event trigger
-- This addresses the residual event trigger causing intermittent errors

-- 1. First disable the event trigger if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_event_trigger 
        WHERE evtname = 'protheus_table_auto_setup'
    ) THEN
        ALTER EVENT TRIGGER protheus_table_auto_setup DISABLE;
    END IF;
END $$;

-- 2. Drop the event trigger if it exists
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;

-- 3. Drop the function if it exists (CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- 4. Remove any cron jobs that might call this function
-- Check for cron jobs calling auto_setup_protheus_table and remove them
DO $$
DECLARE
    job_id bigint;
BEGIN
    -- Find and unschedule any cron jobs calling auto_setup_protheus_table
    FOR job_id IN 
        SELECT jobid FROM cron.job 
        WHERE command LIKE '%auto_setup_protheus_table%'
    LOOP
        PERFORM cron.unschedule(job_id);
    END LOOP;
END $$;

-- 5. Clean up any related audit logs or references
DELETE FROM public.field_audit_log 
WHERE field_name = 'auto_setup_protheus_table' 
   OR new_value LIKE '%auto_setup_protheus_table%';

-- 6. Log the cleanup
INSERT INTO public.field_audit_log (
    record_id, 
    field_name, 
    old_value, 
    new_value, 
    changed_by, 
    record_type
) VALUES (
    gen_random_uuid(),
    'cleanup_auto_setup_function',
    'auto_setup_protheus_table_removed',
    'event_trigger_and_function_cleaned',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'system_maintenance'
);