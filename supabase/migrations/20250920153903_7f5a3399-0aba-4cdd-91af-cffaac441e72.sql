-- Primeiro remover a coluna gerada existente
ALTER TABLE protheus_sa3010_fc3d70f6 
DROP COLUMN record_status;

-- Recriar com lógica corrigida incluindo deleção
ALTER TABLE protheus_sa3010_fc3d70f6 
ADD COLUMN record_status protheus_record_status 
GENERATED ALWAYS AS (
  CASE
    WHEN pending_deletion = true THEN 'deleted'::protheus_record_status
    WHEN is_new_record = true THEN 'new'::protheus_record_status
    WHEN was_updated_last_sync = true THEN 'updated'::protheus_record_status
    ELSE 'unchanged'::protheus_record_status
  END
) STORED;