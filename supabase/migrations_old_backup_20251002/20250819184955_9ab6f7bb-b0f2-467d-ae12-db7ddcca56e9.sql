-- Add record_status column to SA3010 (vendedores) table
ALTER TABLE public.protheus_sa3010_fc3d70f6 
ADD COLUMN record_status protheus_record_status 
GENERATED ALWAYS AS (
  CASE 
    WHEN is_new_record = true THEN 'new'::protheus_record_status
    WHEN was_updated_last_sync = true THEN 'updated'::protheus_record_status
    ELSE 'unchanged'::protheus_record_status
  END
) STORED;

-- Create trigger on the SA3010 (vendedores) protheus table to emit workflow events
CREATE TRIGGER trigger_emit_protheus_status_change_sa3010
  AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_protheus_status_change();