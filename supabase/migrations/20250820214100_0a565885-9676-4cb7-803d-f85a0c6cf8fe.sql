-- Remove the problematic event trigger completely
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE;

-- Remove all remaining instances of the function
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;