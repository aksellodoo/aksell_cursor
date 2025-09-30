
-- 1) Atualizar a função process_workflow_triggers para aceitar formatos antigo e novo
DROP FUNCTION IF EXISTS public.process_workflow_triggers(text, jsonb);

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
    SELECT w.id, w.name
    FROM workflows w
    JOIN workflow_auto_triggers wat ON wat.workflow_id = w.id
    WHERE w.is_active = true
      AND w.deleted_at IS NULL
      AND wat.is_active = true
      AND wat.trigger_type = trigger_type_param
      AND (
        trigger_type_param <> 'protheus_record_change'
        OR (
          -- Formato antigo: table_id + statuses (usa protheus_tables.id)
          (
            wat.trigger_config ? 'table_id'
            AND EXISTS (
              SELECT 1 FROM protheus_dynamic_tables pdt
              WHERE (
                pdt.protheus_table_id::text = wat.trigger_config->>'table_id'
                OR pdt.id::text = wat.trigger_config->>'table_id'
              )
              AND pdt.supabase_table_name = trigger_data_param->>'table_name'
            )
            AND (
              NOT (wat.trigger_config ? 'statuses')
              OR (trigger_data_param->>'record_status') = ANY(
                SELECT jsonb_array_elements_text(wat.trigger_config->'statuses')
              )
            )
          )
          OR
          -- Formato novo: selectedTableId + selectedStatuses
          (
            wat.trigger_config ? 'selectedTableId'
            AND EXISTS (
              SELECT 1 FROM protheus_dynamic_tables pdt
              WHERE (
                pdt.id::text = wat.trigger_config->>'selectedTableId'
                OR pdt.protheus_table_id::text = wat.trigger_config->>'selectedTableId'
              )
              AND pdt.supabase_table_name = trigger_data_param->>'table_name'
            )
            AND (
              NOT (wat.trigger_config ? 'selectedStatuses')
              OR (trigger_data_param->>'record_status') = ANY(
                SELECT jsonb_array_elements_text(wat.trigger_config->'selectedStatuses')
              )
            )
          )
          OR wat.trigger_config = '{}'::jsonb
          OR wat.trigger_config IS NULL
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
      NULLIF(trigger_data_param->>'record_id','')::uuid
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

-- 2) Criar o trigger na tabela SA3010 se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = 'protheus_sa3010_fc3d70f6'
      AND trigger_name = 'protheus_sa3010_fc3d70f6_status_change_trigger'
  ) THEN
    EXECUTE '
      CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger
      AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_protheus_status_change()
    ';
  END IF;
END $$;

-- 3) Normalizar configs antigas para também conter o formato novo
UPDATE public.workflow_auto_triggers AS wat
SET trigger_config = wat.trigger_config
  || jsonb_build_object(
       'selectedTableId', pdt.id::text,
       'selectedStatuses', COALESCE(wat.trigger_config->'statuses', '["updated"]'::jsonb)
     )
FROM protheus_dynamic_tables pdt
WHERE wat.trigger_type = 'protheus_record_change'
  AND wat.is_active = true
  AND wat.trigger_config ? 'table_id'
  AND (pdt.protheus_table_id::text = wat.trigger_config->>'table_id');
