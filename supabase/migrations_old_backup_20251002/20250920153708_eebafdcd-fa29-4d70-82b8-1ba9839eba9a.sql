-- Primeiro corrigir o registro existente que está em pending_deletion mas sem record_status
UPDATE protheus_sa3010_fc3d70f6 
SET record_status = 'deleted' 
WHERE pending_deletion = true 
  AND (record_status IS NULL OR record_status != 'deleted');