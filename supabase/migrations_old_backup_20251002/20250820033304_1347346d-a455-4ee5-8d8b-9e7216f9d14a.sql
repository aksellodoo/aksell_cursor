-- Corrigir o processo de workflow triggers e configurações do TesteJunior

-- 1. Atualizar função process_workflow_triggers para aceitar ambos os formatos de configuração
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
            -- Suporte para formato novo (selectedTableId/selectedStatuses)
            (wat.trigger_config->>'selectedTableId' IS NULL
             OR EXISTS (
               SELECT 1 FROM protheus_dynamic_tables pdt
               WHERE pdt.id::text = wat.trigger_config->>'selectedTableId'
                 AND pdt.supabase_table_name = trigger_data_param->>'table_name'
             ))
            OR
            -- Suporte para formato antigo (table_id/statuses)  
            (wat.trigger_config->>'table_id' IS NULL
             OR EXISTS (
               SELECT 1 FROM protheus_dynamic_tables pdt
               WHERE pdt.id::text = wat.trigger_config->>'table_id'
                 AND pdt.supabase_table_name = trigger_data_param->>'table_name'
             ))
          )
          AND (
            -- Verifica statuses no formato novo
            (wat.trigger_config->'selectedStatuses' IS NULL
             OR trigger_data_param->>'record_status' = ANY(
               SELECT jsonb_array_elements_text(wat.trigger_config->'selectedStatuses')
             ))
            OR
            -- Verifica statuses no formato antigo
            (wat.trigger_config->'statuses' IS NULL
             OR trigger_data_param->>'record_status' = ANY(
               SELECT jsonb_array_elements_text(wat.trigger_config->'statuses')
             ))
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

-- 2. Aplicar triggers em todas as tabelas Protheus existentes
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT supabase_table_name 
        FROM protheus_dynamic_tables 
        WHERE supabase_table_name IS NOT NULL
    LOOP
        -- Aplicar setup do workflow para cada tabela
        PERFORM public.ensure_protheus_workflow_ready(table_record.supabase_table_name);
    END LOOP;
END
$$;

-- 3. Corrigir o workflow TesteJunior para usar "updated" ao invés de "deleted"
UPDATE workflow_auto_triggers 
SET trigger_config = jsonb_set(
  trigger_config, 
  '{statuses}', 
  '["updated"]'::jsonb
)
WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'TesteJunior')
  AND trigger_type = 'protheus_record_change';