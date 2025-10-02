-- Remover trigger obsoleto de notificação
DROP TRIGGER IF EXISTS protheus_sa3010_notification_trigger ON protheus_sa3010_fc3d70f6;

-- Remover função obsoleta de notificação
DROP FUNCTION IF EXISTS populate_protheus_notification_queue();

-- Verificar e consolidar triggers duplicados de status change
-- Primeiro, vamos remover os triggers duplicados e manter apenas um
DROP TRIGGER IF EXISTS protheus_sa3010_status_change_trigger ON protheus_sa3010_fc3d70f6;
DROP TRIGGER IF EXISTS protheus_sa3010_status_change_trigger_2 ON protheus_sa3010_fc3d70f6;
DROP TRIGGER IF EXISTS protheus_sa3010_status_change_trigger_3 ON protheus_sa3010_fc3d70f6;

-- Recriar apenas um trigger de status change se necessário
-- (mantendo apenas se a função ainda existir e for necessária)
-- CREATE TRIGGER protheus_sa3010_status_change_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON protheus_sa3010_fc3d70f6
--   FOR EACH ROW EXECUTE FUNCTION handle_protheus_status_change();

-- Remover a tabela obsoleta de notificações se existir
DROP TABLE IF EXISTS protheus_notification_queue;