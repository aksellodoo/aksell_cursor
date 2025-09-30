-- Atualizar a coluna gerada record_status para incluir lógica de deleção
ALTER TABLE protheus_sa3010_fc3d70f6 
ALTER COLUMN record_status 
SET GENERATED ALWAYS AS (
  CASE
    WHEN pending_deletion = true THEN 'deleted'::protheus_record_status
    WHEN is_new_record = true THEN 'new'::protheus_record_status
    WHEN was_updated_last_sync = true THEN 'updated'::protheus_record_status
    ELSE 'unchanged'::protheus_record_status
  END
) STORED;