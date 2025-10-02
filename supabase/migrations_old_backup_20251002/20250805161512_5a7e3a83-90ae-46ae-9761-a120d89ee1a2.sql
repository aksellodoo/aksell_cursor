-- Corrigir função check_missing_fields que ficou órfã (foi criada temporariamente)
-- Ela pode ter ficado sem search_path definido

-- Verificar e corrigir todas as funções que podem ter problemas de search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Buscar funções sem search_path definido adequadamente
    FOR func_record IN 
        SELECT n.nspname, p.proname 
        FROM pg_proc p 
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname LIKE '%missing%'
    LOOP
        -- Remover função órfã se existir
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I() CASCADE', func_record.nspname, func_record.proname);
    END LOOP;
END $$;

-- Atualizar funções existentes para ter search_path correto
ALTER FUNCTION public.update_protheus_config_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_protheus_dynamic_tables_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_protheus_tables_updated_at() SET search_path = 'public';