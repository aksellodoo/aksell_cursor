-- Add 'deleted' to protheus_record_status enum
ALTER TYPE protheus_record_status ADD VALUE 'deleted';

-- Create function to check if a protheus event matches trigger configuration
CREATE OR REPLACE FUNCTION public.matches_protheus_trigger(trigger_config jsonb, event_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  configured_table_id UUID;
  configured_statuses TEXT[];
  event_table_name TEXT;
  event_status TEXT;
BEGIN
  -- Extract configuration
  configured_table_id := (trigger_config->>'table_id')::UUID;
  configured_statuses := ARRAY(SELECT jsonb_array_elements_text(trigger_config->'statuses'));
  
  -- Extract event data
  event_table_name := event_data->>'table_name';
  event_status := event_data->>'record_status';
  
  -- Check if table matches (by looking up table name from protheus_tables)
  IF NOT EXISTS (
    SELECT 1 FROM protheus_tables pt 
    WHERE pt.id = configured_table_id 
    AND 'protheus_' || LOWER(pt.table_name) || '_' || SUBSTRING(pt.id::text, 1, 8) = event_table_name
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if status matches
  IF event_status = ANY(configured_statuses) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Update process_workflow_triggers to handle protheus triggers with configuration
CREATE OR REPLACE FUNCTION public.process_workflow_triggers(p_trigger_type text, p_trigger_data jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(workflow_id uuid, execution_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trigger_rec RECORD;
  new_execution_id UUID;
BEGIN
  -- Buscar workflows com triggers automáticos ativos para o tipo especificado
  FOR trigger_rec IN 
    SELECT wat.workflow_id, wat.trigger_config
    FROM public.workflow_auto_triggers wat
    JOIN public.workflows w ON w.id = wat.workflow_id
    WHERE wat.trigger_type = p_trigger_type
      AND wat.is_active = true
      AND w.is_active = true
      AND w.deleted_at IS NULL
  LOOP
    -- Para triggers de protheus, verificar se o evento corresponde à configuração
    IF p_trigger_type = 'protheus_record_change' THEN
      IF NOT public.matches_protheus_trigger(trigger_rec.trigger_config, p_trigger_data) THEN
        CONTINUE; -- Skip this trigger if configuration doesn't match
      END IF;
    END IF;
    
    -- Criar nova execução
    INSERT INTO public.workflow_executions (workflow_id, trigger_data, status)
    VALUES (trigger_rec.workflow_id, p_trigger_data, 'pending')
    RETURNING id INTO new_execution_id;
    
    -- Log do trigger
    INSERT INTO public.workflow_trigger_logs (
      workflow_id, 
      trigger_type, 
      trigger_data, 
      execution_id,
      status
    )
    VALUES (
      trigger_rec.workflow_id,
      p_trigger_type,
      p_trigger_data,
      new_execution_id,
      'triggered'
    );
    
    -- Atualizar timestamp do último trigger
    UPDATE public.workflow_auto_triggers 
    SET last_triggered_at = now()
    WHERE workflow_id = trigger_rec.workflow_id 
      AND trigger_type = p_trigger_type;
    
    -- Retornar resultado
    workflow_id := trigger_rec.workflow_id;
    execution_id := new_execution_id;
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- Function to automatically add record_status and triggers to existing protheus data tables
DO $$
DECLARE
  table_rec RECORD;
  trigger_name_var TEXT;
BEGIN
  -- Loop through all protheus data tables (those that have is_new_record column)
  FOR table_rec IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE 'protheus_%'
    AND t.table_name != 'protheus_tables'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' 
      AND c.table_name = t.table_name 
      AND c.column_name = 'is_new_record'
    )
  LOOP
    trigger_name_var := 'trigger_emit_protheus_status_change_' || REPLACE(table_rec.table_name, 'protheus_', '');
    
    -- Add record_status column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_rec.table_name 
      AND column_name = 'record_status'
    ) THEN
      EXECUTE format('
        ALTER TABLE %I 
        ADD COLUMN record_status protheus_record_status 
        GENERATED ALWAYS AS (
          CASE 
            WHEN is_new_record = true THEN ''new''::protheus_record_status
            WHEN was_updated_last_sync = true THEN ''updated''::protheus_record_status
            ELSE ''unchanged''::protheus_record_status
          END
        ) STORED', table_rec.table_name);
      
      RAISE NOTICE 'Added record_status column to %', table_rec.table_name;
    END IF;
    
    -- Add trigger if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
      AND event_object_table = table_rec.table_name 
      AND information_schema.triggers.trigger_name = trigger_name_var
    ) THEN
      EXECUTE format('
        CREATE TRIGGER %I
          AFTER INSERT OR UPDATE ON %I
          FOR EACH ROW
          EXECUTE FUNCTION public.emit_protheus_status_change()', trigger_name_var, table_rec.table_name);
      
      RAISE NOTICE 'Added trigger % to %', trigger_name_var, table_rec.table_name;
    END IF;
  END LOOP;
END $$;