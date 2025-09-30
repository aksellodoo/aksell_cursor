-- Solução definitiva: remover função problemática e fazer apenas os ajustes necessários

-- 1. Desabilitar e remover completamente o event trigger problemático
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE;

-- 2. Forçar remoção da função problemática
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- 3. Fazer apenas a correção do workflow TesteJunior (sem executar outras funções)
UPDATE workflow_auto_triggers 
SET trigger_config = jsonb_set(
  trigger_config, 
  '{statuses}', 
  '["updated"]'::jsonb
)
WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'TesteJunior')
  AND trigger_type = 'protheus_record_change';

-- 4. Verificar se a configuração foi aplicada
SELECT 
  w.name, 
  wat.trigger_config 
FROM workflows w 
JOIN workflow_auto_triggers wat ON wat.workflow_id = w.id 
WHERE w.name = 'TesteJunior';