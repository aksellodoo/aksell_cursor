-- Create enum for protheus record status
CREATE TYPE protheus_record_status AS ENUM ('new', 'updated', 'unchanged');

-- Create function to emit protheus status change events for workflows
CREATE OR REPLACE FUNCTION public.emit_protheus_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only emit events for meaningful status changes (new or updated records)
  IF NEW.record_status IN ('new', 'updated') THEN
    -- Process workflow triggers for protheus record changes
    PERFORM public.process_workflow_triggers(
      'protheus_record_change',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'record_id', NEW.id,
        'protheus_id', NEW.protheus_id,
        'record_status', NEW.record_status,
        'is_new_record', NEW.is_new_record,
        'was_updated_last_sync', NEW.was_updated_last_sync,
        'last_synced_at', NEW.last_synced_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add record_status column to existing protheus table (example with SA1010)
-- This will be applied as a template for all protheus tables
ALTER TABLE public.protheus_sa1010_80f17f00 
ADD COLUMN record_status protheus_record_status 
GENERATED ALWAYS AS (
  CASE 
    WHEN is_new_record = true THEN 'new'::protheus_record_status
    WHEN was_updated_last_sync = true THEN 'updated'::protheus_record_status
    ELSE 'unchanged'::protheus_record_status
  END
) STORED;

-- Create trigger on the protheus table to emit workflow events
CREATE TRIGGER trigger_emit_protheus_status_change_sa1010
  AFTER INSERT OR UPDATE ON public.protheus_sa1010_80f17f00
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_protheus_status_change();