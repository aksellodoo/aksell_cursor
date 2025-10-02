-- Solução final: forçar remoção e correções

-- Remover tudo relacionado ao auto_setup problemático (ignorando erros)
DO $$
BEGIN
    -- Tentar dropar event trigger
    BEGIN
        DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao dropar event trigger: %', SQLERRM;
    END;
    
    -- Tentar dropar função
    BEGIN
        DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao dropar função: %', SQLERRM;
    END;
END $$;

-- Aplicar correções essenciais diretamente:

-- 1. Atualizar o TesteJunior para usar "updated" ao invés de "deleted"
UPDATE workflow_auto_triggers 
SET trigger_config = jsonb_set(
  trigger_config, 
  '{statuses}', 
  '["updated"]'::jsonb
)
WHERE workflow_id = (SELECT id FROM workflows WHERE name = 'TesteJunior')
  AND trigger_type = 'protheus_record_change';

-- 2. Verificar se os triggers existem nas tabelas e aplicar se necessário
DO $$
BEGIN
    -- Aplicar trigger na tabela SA3010 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'emit_protheus_status_change_trigger' 
        AND event_object_table = 'protheus_sa3010_fc3d70f6'
    ) THEN
        EXECUTE format('
            CREATE TRIGGER emit_protheus_status_change_trigger
            AFTER INSERT OR UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.emit_protheus_status_change()', 
            'protheus_sa3010_fc3d70f6');
    END IF;
    
    -- Aplicar trigger na tabela SA1010 se não existir  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'emit_protheus_status_change_trigger' 
        AND event_object_table = 'protheus_sa1010_80f17f00'
    ) THEN
        EXECUTE format('
            CREATE TRIGGER emit_protheus_status_change_trigger
            AFTER INSERT OR UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.emit_protheus_status_change()', 
            'protheus_sa1010_80f17f00');
    END IF;
END $$;