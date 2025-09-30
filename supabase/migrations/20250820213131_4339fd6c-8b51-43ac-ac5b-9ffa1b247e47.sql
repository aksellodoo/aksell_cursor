-- Force drop the event trigger even if it has dependencies  
DO $$
BEGIN
    -- Try multiple approaches to drop the trigger
    BEGIN
        EXECUTE 'DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE';
    EXCEPTION WHEN OTHERS THEN
        -- If that fails, try without CASCADE
        BEGIN
            EXECUTE 'DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup';
        EXCEPTION WHEN OTHERS THEN
            -- Continue if it doesn't exist
            NULL;
        END;
    END;
END $$;

-- Now drop the function safely
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- Drop auxiliary workflow functions
DROP FUNCTION IF EXISTS public.setup_protheus_table_workflow(text) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_protheus_workflow_ready(text) CASCADE;