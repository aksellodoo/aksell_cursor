-- Remove workflow-related triggers and functions that interfere with Protheus table sync

-- Drop the auto setup event trigger
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;

-- Drop the auto setup function
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table();

-- Drop auxiliary workflow setup functions
DROP FUNCTION IF EXISTS public.setup_protheus_table_workflow(text);
DROP FUNCTION IF EXISTS public.ensure_protheus_workflow_ready(text);

-- Remove emit_protheus_status_change triggers from all protheus tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'protheus_%'
        AND table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS emit_protheus_status_change_trigger ON public.%I', table_record.table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Continue if trigger doesn't exist
            NULL;
        END;
    END LOOP;
END $$;

-- Keep the general workflow engine but remove protheus-specific interference
-- The emit_protheus_status_change function can stay but won't be automatically triggered