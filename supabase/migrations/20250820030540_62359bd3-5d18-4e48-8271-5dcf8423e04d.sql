-- Plano completo: Configurar workflows para todas as tabelas Protheus

-- 1) Garantir que o enum tenha todos os valores necessários (idempotente)
DO $$
BEGIN
  -- Adicionar 'deleted' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'protheus_record_status' AND e.enumlabel = 'deleted'
  ) THEN
    ALTER TYPE protheus_record_status ADD VALUE 'deleted';
  END IF;
END $$;

-- 2) Função para configurar tabela Protheus (coluna + trigger)
CREATE OR REPLACE FUNCTION public.setup_protheus_table_workflow(table_name_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Adicionar coluna record_status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'record_status'
  ) THEN
    EXECUTE format('
      ALTER TABLE public.%I
      ADD COLUMN record_status protheus_record_status
      GENERATED ALWAYS AS (
        CASE
          WHEN is_new_record = true THEN ''new''::protheus_record_status
          WHEN was_updated_last_sync = true THEN ''updated''::protheus_record_status
          ELSE ''unchanged''::protheus_record_status
        END
      ) STORED', table_name_param);
  END IF;

  -- Criar trigger se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = table_name_param
      AND trigger_name = table_name_param || '_status_change_trigger'
  ) THEN
    EXECUTE format('
      CREATE TRIGGER %I_status_change_trigger
        AFTER INSERT OR UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.emit_protheus_status_change()', 
      table_name_param, table_name_param);
  END IF;
END;
$$;

-- 3) Configurar todas as tabelas Protheus existentes
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'protheus_%'
      AND table_type = 'BASE TABLE'
  LOOP
    PERFORM public.setup_protheus_table_workflow(rec.table_name);
  END LOOP;
END $$;

-- 4) Event trigger para futuras tabelas Protheus
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT schema_name, object_name
    FROM pg_event_trigger_ddl_commands()
    WHERE object_type = 'table'
      AND schema_name = 'public'
      AND object_name LIKE 'protheus_%'
  LOOP
    -- Aguardar um pouco para garantir que a tabela foi criada completamente
    PERFORM pg_sleep(0.1);
    
    -- Verificar se a tabela tem as colunas necessárias antes de configurar
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = rec.object_name 
        AND column_name = 'is_new_record'
    ) THEN
      PERFORM public.setup_protheus_table_workflow(rec.object_name);
    END IF;
  END LOOP;
END;
$$;

-- Criar o event trigger
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;
CREATE EVENT TRIGGER protheus_table_auto_setup
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_setup_protheus_table();

-- 5) Melhorar função process_workflow_triggers para logs mais claros
CREATE OR REPLACE FUNCTION public.process_workflow_triggers(
  trigger_type_param text,
  trigger_data_param jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workflow_record RECORD;
  execution_id uuid;
  trigger_log_id uuid;
  triggered_count integer := 0;
  total_workflows integer := 0;
BEGIN
  -- Log do trigger recebido
  INSERT INTO workflow_trigger_logs (
    workflow_id, trigger_type, trigger_data, status
  ) VALUES (
    NULL, trigger_type_param, trigger_data_param, 'processing'
  ) RETURNING id INTO trigger_log_id;

  -- Buscar workflows ativos com triggers compatíveis
  FOR workflow_record IN
    SELECT w.id, w.name, w.workflow_definition
    FROM workflows w
    JOIN workflow_auto_triggers wat ON wat.workflow_id = w.id
    WHERE w.is_active = true 
      AND wat.trigger_type = trigger_type_param
      AND (
        wat.trigger_config IS NULL 
        OR wat.trigger_config = '{}'::jsonb
        OR (
          trigger_type_param = 'protheus_record_change' 
          AND (
            wat.trigger_config->>'selectedTableId' IS NULL
            OR EXISTS (
              SELECT 1 FROM protheus_dynamic_tables pdt
              WHERE pdt.id::text = wat.trigger_config->>'selectedTableId'
                AND pdt.supabase_table_name = trigger_data_param->>'table_name'
            )
          )
          AND (
            wat.trigger_config->>'selectedStatuses' IS NULL
            OR trigger_data_param->>'record_status' = ANY(
              SELECT jsonb_array_elements_text(wat.trigger_config->'selectedStatuses')
            )
          )
        )
      )
  LOOP
    total_workflows := total_workflows + 1;
    
    -- Criar execução do workflow
    INSERT INTO workflow_executions (
      workflow_id, trigger_data, status, record_type, record_id
    ) VALUES (
      workflow_record.id,
      trigger_data_param,
      'pending',
      trigger_data_param->>'table_name',
      (trigger_data_param->>'record_id')::uuid
    ) RETURNING id INTO execution_id;

    -- Atualizar log do trigger
    UPDATE workflow_trigger_logs 
    SET execution_id = execution_id, status = 'triggered'
    WHERE id = trigger_log_id;

    triggered_count := triggered_count + 1;
  END LOOP;

  -- Se nenhum workflow foi encontrado, marcar como não processado
  IF triggered_count = 0 THEN
    UPDATE workflow_trigger_logs 
    SET status = 'no_workflows_matched'
    WHERE id = trigger_log_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'triggered_workflows', triggered_count,
    'total_active_workflows', total_workflows,
    'trigger_log_id', trigger_log_id,
    'trigger_type', trigger_type_param
  );
EXCEPTION WHEN OTHERS THEN
  -- Log do erro
  UPDATE workflow_trigger_logs 
  SET status = 'error', trigger_data = trigger_data_param || jsonb_build_object('error', SQLERRM)
  WHERE id = trigger_log_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'trigger_log_id', trigger_log_id
  );
END;
$$;