
-- 1) Função robusta que emite eventos de mudança de status do Protheus
CREATE OR REPLACE FUNCTION public.emit_protheus_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  should_emit boolean := false;
  table_name text := TG_TABLE_NAME;
  operation text := TG_OP;
BEGIN
  -- Critérios para emitir evento
  IF TG_OP = 'INSERT' THEN
    should_emit := COALESCE(NEW.record_status IN ('new','updated'), false)
                OR COALESCE(NEW.is_new_record, false)
                OR COALESCE(NEW.was_updated_last_sync, false);
  ELSIF TG_OP = 'UPDATE' THEN
    should_emit := COALESCE(NEW.record_status IN ('new','updated'), false)
                OR COALESCE(NEW.was_updated_last_sync, false) IS DISTINCT FROM COALESCE(OLD.was_updated_last_sync, false)
                OR NEW.record_hash IS DISTINCT FROM OLD.record_hash
                OR NEW.last_synced_at IS DISTINCT FROM OLD.last_synced_at;
  END IF;

  IF should_emit THEN
    -- 1. Log para diagnóstico
    INSERT INTO public.workflow_trigger_logs (workflow_id, trigger_data, execution_id, trigger_type, status)
    VALUES (
      NULL,
      jsonb_build_object(
        'table_name', table_name,
        'record_id', NEW.id,
        'protheus_id', COALESCE(NEW.protheus_id, NULL),
        'record_status', COALESCE(NEW.record_status, NULL),
        'is_new_record', COALESCE(NEW.is_new_record, NULL),
        'was_updated_last_sync', COALESCE(NEW.was_updated_last_sync, NULL),
        'last_synced_at', COALESCE(NEW.last_synced_at, NULL),
        'operation', operation
      ),
      NULL,
      'protheus_record_change',
      'triggered'
    );

    -- 2. Disparar workflows
    PERFORM public.process_workflow_triggers(
      'protheus_record_change',
      jsonb_build_object(
        'table_name', table_name,
        'record_id', NEW.id,
        'protheus_id', COALESCE(NEW.protheus_id, NULL),
        'record_status', COALESCE(NEW.record_status, NULL),
        'is_new_record', COALESCE(NEW.is_new_record, NULL),
        'was_updated_last_sync', COALESCE(NEW.was_updated_last_sync, NULL),
        'last_synced_at', COALESCE(NEW.last_synced_at, NULL),
        'operation', operation
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Recriar triggers em todas as tabelas SA3010 e SA1010 existentes
DO $block$
DECLARE
  rec RECORD;
  trg_main text;
BEGIN
  FOR rec IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        table_name LIKE 'protheus_sa3010_%'
        OR table_name LIKE 'protheus_sa1010_%'
      )
  LOOP
    trg_main := rec.table_name || '_status_change_trigger';

    -- Remover triggers antigos (nomes conhecidos e genéricos)
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trg_main, rec.table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'protheus_sa3010_status_change_trigger', rec.table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'protheus_sa1010_status_change_trigger', rec.table_name);

    -- Criar novo trigger padronizado
    EXECUTE format(
      'CREATE TRIGGER %I
       AFTER INSERT OR UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.emit_protheus_status_change()',
      trg_main, rec.table_name
    );
    RAISE NOTICE 'Trigger criado em %', rec.table_name;
  END LOOP;
END $block$;
