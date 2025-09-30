-- Fix existing data: Clear is_new_record for records not from the latest sync
-- Get the latest sync log for protheus_sa3010_fc3d70f6 table and clear old new flags

-- Clear is_new_record for records that don't belong to the latest sync
WITH latest_sync AS (
  SELECT psl.id as latest_sync_id
  FROM protheus_sync_logs psl
  JOIN protheus_tables pt ON pt.id = psl.protheus_table_id
  JOIN protheus_dynamic_tables pdt ON pdt.protheus_table_id = pt.id
  WHERE pdt.supabase_table_name = 'protheus_sa3010_fc3d70f6'
  ORDER BY psl.finished_at DESC NULLS LAST
  LIMIT 1
)
UPDATE protheus_sa3010_fc3d70f6 
SET is_new_record = false
WHERE is_new_record = true 
  AND (last_sync_id IS DISTINCT FROM (SELECT latest_sync_id FROM latest_sync) OR last_sync_id IS NULL);

-- Also ensure records with pending_deletion have correct record_status
UPDATE protheus_sa3010_fc3d70f6 
SET record_status = 'deleted'::protheus_record_status
WHERE pending_deletion = true AND record_status != 'deleted';