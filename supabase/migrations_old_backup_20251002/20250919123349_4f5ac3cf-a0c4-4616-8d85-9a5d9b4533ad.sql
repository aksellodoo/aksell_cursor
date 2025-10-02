-- Primeiro, vamos corrigir os dados existentes da configuração do Alex
UPDATE user_protheus_table_notifications 
SET user_id = 'bc49489b-8d8d-4a1d-91c1-7ac9259b4aba'
WHERE user_id = '5c1b0ef7-7e4d-496b-a4cc-8f4671d8a8f5' 
  AND protheus_table_id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

-- Criar função para detectar mudanças e popular a fila de notificações
CREATE OR REPLACE FUNCTION populate_protheus_notification_queue()
RETURNS TRIGGER AS $$
DECLARE
  change_status text;
  table_id uuid;
  record_id_value text;
  record_data jsonb;
  previous_data jsonb := null;
BEGIN
  -- Determinar o tipo de mudança
  IF TG_OP = 'INSERT' THEN
    change_status := 'new';
    record_data := to_jsonb(NEW);
    record_id_value := COALESCE(NEW.a3_filial::text, '') || '|' || COALESCE(NEW.a3_cod::text, '');
  ELSIF TG_OP = 'UPDATE' THEN
    change_status := 'updated';
    record_data := to_jsonb(NEW);
    previous_data := to_jsonb(OLD);
    record_id_value := COALESCE(NEW.a3_filial::text, '') || '|' || COALESCE(NEW.a3_cod::text, '');
  ELSIF TG_OP = 'DELETE' THEN
    change_status := 'deleted';
    record_data := to_jsonb(OLD);
    record_id_value := COALESCE(OLD.a3_filial::text, '') || '|' || COALESCE(OLD.a3_cod::text, '');
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
      record_id,
      record_status,
      record_data,
      previous_data,
      detected_at,
      status,
      retry_count,
      created_at
    ) VALUES (
      table_id,
      record_id_value,
      change_status,
      record_data,
      previous_data,
      now(),
      'pending',
      0,
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

-- Criar trigger apenas para a tabela SA3010 que sabemos que existe
DROP TRIGGER IF EXISTS protheus_sa3010_notification_trigger ON protheus_sa3010_fc3d70f6;
CREATE TRIGGER protheus_sa3010_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON protheus_sa3010_fc3d70f6
  FOR EACH ROW EXECUTE FUNCTION populate_protheus_notification_queue();

-- Simular uma mudança na SA3010 para testar o sistema
UPDATE protheus_sa3010_fc3d70f6 
SET a3_nome = TRIM(REPLACE(a3_nome, ' [TESTE]', '')) || ' [TESTE NOTIF]'
WHERE a3_cod = (SELECT a3_cod FROM protheus_sa3010_fc3d70f6 LIMIT 1);