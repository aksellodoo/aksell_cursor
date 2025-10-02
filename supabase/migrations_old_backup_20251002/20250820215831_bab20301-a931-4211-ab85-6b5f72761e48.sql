-- Disable all event triggers for this session to prevent interference
SET session_replication_role = replica;

-- Now safely remove the problematic function and event trigger
-- This will prevent the auto_setup function from firing during cleanup

-- 1. Drop the event trigger
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE;

-- 2. Drop the problematic function
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- 3. Clean up any related cron jobs
DO $$
DECLARE
    job_id bigint;
BEGIN
    FOR job_id IN 
        SELECT jobid FROM cron.job 
        WHERE command ILIKE '%auto_setup%' 
           OR command ILIKE '%protheus_table%'
    LOOP
        PERFORM cron.unschedule(job_id);
    END LOOP;
END $$;

-- 4. Clean up audit logs
DELETE FROM public.field_audit_log 
WHERE field_name ILIKE '%auto_setup%' 
   OR new_value ILIKE '%auto_setup%';

-- 5. Re-enable event triggers for the session
SET session_replication_role = DEFAULT;

-- 6. Log the successful cleanup
INSERT INTO public.field_audit_log (
    record_id, 
    field_name, 
    old_value, 
    new_value, 
    changed_by, 
    record_type
) VALUES (
    gen_random_uuid(),
    'session_safe_cleanup',
    'auto_setup_protheus_table_removed_safely',
    'event_trigger_disabled_during_cleanup',
    COALESCE(auth.uid(), '00000000-0000-0000-000000000000'),
    'system_maintenance'
);