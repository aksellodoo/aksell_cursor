-- Listar e desabilitar temporariamente event triggers problemáticos
DO $$
DECLARE
    et_name text;
BEGIN
    -- Listar event triggers existentes
    FOR et_name IN 
        SELECT evtname 
        FROM pg_event_trigger 
        WHERE evtname LIKE '%protheus%' OR evtname LIKE '%auto_setup%'
    LOOP
        RAISE NOTICE 'Encontrado event trigger: %', et_name;
        EXECUTE 'ALTER EVENT TRIGGER ' || quote_ident(et_name) || ' DISABLE';
        RAISE NOTICE 'Event trigger % desabilitado temporariamente', et_name;
    END LOOP;
END $$;

-- Agora criar nosso trigger na tabela SA3010
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
      AND event_object_table = 'protheus_sa3010_fc3d70f6'
      AND trigger_name = 'protheus_sa3010_fc3d70f6_status_change_trigger'
  ) THEN
    CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger 
      AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6 
      FOR EACH ROW 
      EXECUTE FUNCTION public.emit_protheus_status_change();
    
    RAISE NOTICE 'Trigger criado com sucesso!';
  END IF;
END $$;

-- Reabilitar os event triggers
DO $$
DECLARE
    et_name text;
BEGIN
    FOR et_name IN 
        SELECT evtname 
        FROM pg_event_trigger 
        WHERE evtname LIKE '%protheus%' OR evtname LIKE '%auto_setup%'
    LOOP
        EXECUTE 'ALTER EVENT TRIGGER ' || quote_ident(et_name) || ' ENABLE';
        RAISE NOTICE 'Event trigger % reabilitado', et_name;
    END LOOP;
END $$;