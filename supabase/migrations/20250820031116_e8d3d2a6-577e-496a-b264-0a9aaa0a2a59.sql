-- Corrigir warnings de segurança: definir search_path nas funções

-- Corrigir função setup_protheus_table_workflow
CREATE OR REPLACE FUNCTION public.setup_protheus_table_workflow(table_name_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se a tabela tem as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'is_new_record'
  ) THEN
    RAISE NOTICE 'Tabela % não possui coluna is_new_record, pulando...', table_name_param;
    RETURN;
  END IF;

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
    RAISE NOTICE 'Coluna record_status adicionada à tabela %', table_name_param;
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
    RAISE NOTICE 'Trigger criado para tabela %', table_name_param;
  END IF;
END;
$$;

-- Corrigir função auto_setup_protheus_table
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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