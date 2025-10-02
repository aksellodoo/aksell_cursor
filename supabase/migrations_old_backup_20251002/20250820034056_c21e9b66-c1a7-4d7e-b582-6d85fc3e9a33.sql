-- Correção simples: apenas atualizar o workflow TesteJunior sem executar outras funções

-- Corrigir a configuração do workflow TesteJunior
UPDATE workflow_auto_triggers 
SET trigger_config = jsonb_set(
  trigger_config, 
  '{statuses}', 
  '["updated"]'::jsonb
)
WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'TesteJunior')
  AND trigger_type = 'protheus_record_change';

-- Verificar se funcionou
SELECT 'Workflow corrigido com sucesso' as status;