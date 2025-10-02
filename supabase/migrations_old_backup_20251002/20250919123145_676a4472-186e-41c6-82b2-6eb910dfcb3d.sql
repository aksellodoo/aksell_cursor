-- Primeiro, vamos corrigir os dados existentes da configuração do Alex
UPDATE user_protheus_table_notifications 
SET user_id = 'bc49489b-8d8d-4a1d-91c1-7ac9259b4aba'
WHERE user_id = '5c1b0ef7-7e4d-496b-a4cc-8f4671d8a8f5' 
  AND protheus_table_id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

-- Criar função para detectar mudanças e popular a fila de notificações
CREATE OR REPLACE FUNCTION populate_protheus_notification_queue()
RETURNS TRIGGER AS $$
DECLARE
  change_type text;
  table_id uuid;
  record_data jsonb;
BEGIN
  -- Determinar o tipo de mudança
  IF TG_OP = 'INSERT' THEN
    change_type := 'new';
    record_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    change_type := 'updated';
    record_data := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    change_type := 'deleted';
    record_data := to_jsonb(OLD);
  END IF;

  -- Buscar o protheus_table_id baseado no nome da tabela
  SELECT protheus_table_id INTO table_id
  FROM protheus_dynamic_tables
  WHERE supabase_table_name = TG_TABLE_NAME
  LIMIT 1;

  -- Se encontrou a tabela, inserir na fila de notificações
  IF table_id IS NOT NULL THEN
    INSERT INTO protheus_notification_queue (
      protheus_table_id,
      record_type,
      record_data,
      created_at
    ) VALUES (
      table_id,
      change_type,
      record_data,
      now()
    );
  END IF;

  -- Retornar o registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para a tabela SA3010
DROP TRIGGER IF EXISTS protheus_sa3010_notification_trigger ON protheus_sa3010_fc3d70f6;
CREATE TRIGGER protheus_sa3010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa3010_fc3d70f6
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

-- Vamos também criar triggers para outras tabelas dinâmicas existentes
DROP TRIGGER IF EXISTS protheus_sa1010_notification_trigger ON protheus_sa1010_8055dbb9;
CREATE TRIGGER protheus_sa1010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa1010_8055dbb9
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sa2010_notification_trigger ON protheus_sa2010_72a51158;
CREATE TRIGGER protheus_sa2010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa2010_72a51158
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sa4010_notification_trigger ON protheus_sa4010_ea26a13a;
CREATE TRIGGER protheus_sa4010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa4010_ea26a13a
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sa5010_notification_trigger ON protheus_sa5010_1e1b33a6;
CREATE TRIGGER protheus_sa5010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa5010_1e1b33a6
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sb1010_notification_trigger ON protheus_sb1010_e8b9c123;
CREATE TRIGGER protheus_sb1010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sb1010_e8b9c123
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sds010_notification_trigger ON protheus_sds010_a3b2c1d4;
CREATE TRIGGER protheus_sds010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sds010_a3b2c1d4
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

DROP TRIGGER IF EXISTS protheus_sy1010_notification_trigger ON protheus_sy1010_3249e97a;
CREATE TRIGGER protheus_sy1010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sy1010_3249e97a
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

-- Simular uma mudança na SA3010 para testar o sistema
-- Vamos fazer um UPDATE em um registro existente para criar um item na fila
UPDATE protheus_sa3010_fc3d70f6 
SET a3_nome = a3_nome || ' '
WHERE a3_cod = (SELECT a3_cod FROM protheus_sa3010_fc3d70f6 LIMIT 1);

-- Verificar se o item foi criado na fila
-- SELECT * FROM protheus_notification_queue ORDER BY created_at DESC LIMIT 5;