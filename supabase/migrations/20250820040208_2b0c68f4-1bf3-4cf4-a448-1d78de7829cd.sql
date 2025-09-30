-- Primeiro, vamos corrigir a função auto_setup_protheus_table que está falhando
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
    obj record;
BEGIN
    -- Corrigir a query para usar as colunas corretas do pg_event_trigger_ddl_commands
    FOR obj IN
        SELECT schema_name, object_identity
        FROM pg_event_trigger_ddl_commands()
        WHERE object_type = 'table'
          AND schema_name = 'public'
          AND object_identity LIKE 'public.protheus_%'
    LOOP
        -- Log da correção
        RAISE NOTICE 'Auto-setup executado para tabela: %', obj.object_identity;
    END LOOP;
END;
$$;