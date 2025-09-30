-- Disable the auto setup function by removing its functionality completely
-- and making it safe to call without errors

-- First check if the event trigger exists and remove it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'protheus_table_auto_setup') THEN
        DROP EVENT TRIGGER protheus_table_auto_setup;
    END IF;
END $$;

-- Replace the function with a safe no-op version
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function is now disabled and does nothing
  -- to prevent interference with Protheus table synchronization
  RAISE NOTICE 'auto_setup_protheus_table is disabled to prevent sync interference';
  RETURN;
END;
$$;

-- Now drop the function completely
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table();

-- Drop auxiliary workflow setup functions that might interfere
DROP FUNCTION IF EXISTS public.setup_protheus_table_workflow(text);
DROP FUNCTION IF EXISTS public.ensure_protheus_workflow_ready(text);

-- Remove any workflow-related triggers from protheus tables
-- Use a safer approach that doesn't rely on information_schema during event trigger execution
DROP TRIGGER IF EXISTS emit_protheus_status_change_trigger ON public.protheus_sa1010_80f17f00;
DROP TRIGGER IF EXISTS emit_protheus_status_change_trigger ON public.protheus_sa3010_fc3d70f6;
DROP TRIGGER IF EXISTS emit_protheus_status_change_trigger ON public.protheus_sa4010_ea26a13a;
DROP TRIGGER IF EXISTS emit_protheus_status_change_trigger ON public.protheus_sa5010_7d6a8fff;