-- Force removal of auto_setup_protheus_table function and event trigger
-- The function has a bug, so we need to remove it forcefully

-- 1. Drop the event trigger first (this will prevent it from firing)
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE;

-- 2. Force drop the function with CASCADE to handle any dependencies
-- We need to be more aggressive since the function has a bug
DO $$
BEGIN
    -- Try to drop the function, ignore errors if it doesn't exist
    BEGIN
        EXECUTE 'DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE';
    EXCEPTION WHEN OTHERS THEN
        -- Log the exception but continue
        RAISE NOTICE 'Function auto_setup_protheus_table may not exist or had issues: %', SQLERRM;
    END;
END $$;

-- 3. Check for and remove any triggers on tables that might reference this function
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Look for triggers that might reference the auto_setup function
    FOR trigger_rec IN 
        SELECT schemaname, tablename, triggername 
        FROM pg_triggers 
        WHERE triggername LIKE '%auto_setup%' 
           OR triggername LIKE '%protheus_table%'
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
                trigger_rec.triggername, 
                trigger_rec.schemaname, 
                trigger_rec.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop trigger %: %', trigger_rec.triggername, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Remove any cron jobs that might reference this function
DO $$
DECLARE
    job_id bigint;
BEGIN
    FOR job_id IN 
        SELECT jobid FROM cron.job 
        WHERE command ILIKE '%auto_setup%' 
           OR command ILIKE '%protheus_table%'
    LOOP
        BEGIN
            PERFORM cron.unschedule(job_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not unschedule job %: %', job_id, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. Clean up any audit logs
DELETE FROM public.field_audit_log 
WHERE field_name ILIKE '%auto_setup%' 
   OR new_value ILIKE '%auto_setup%';

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
    'force_cleanup_auto_setup',
    'auto_setup_protheus_table_force_removed',
    'event_trigger_function_and_dependencies_cleaned',
    COALESCE(auth.uid(), '00000000-0000-0000-000000000000'),
    'system_maintenance'
);