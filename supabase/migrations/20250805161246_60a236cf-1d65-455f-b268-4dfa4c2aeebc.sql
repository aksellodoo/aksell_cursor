-- Criar função temporária para identificar campos faltantes
CREATE OR REPLACE FUNCTION check_missing_fields()
RETURNS TABLE(missing_field text, discovered_type text) AS $$
DECLARE
    discovered_fields jsonb;
    actual_columns text[];
    field_record jsonb;
    field_name text;
    field_type text;
BEGIN
    -- Buscar estrutura descoberta
    SELECT table_structure->'fields' INTO discovered_fields
    FROM protheus_dynamic_tables 
    WHERE protheus_table_id = '4eb98c2d-7216-4abd-8802-f81568633578';
    
    -- Buscar colunas atuais (excluindo campos de sistema)
    SELECT ARRAY(
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'protheus_sa1010_4eb98c2d' 
        AND table_schema = 'public'
        AND column_name NOT IN ('id', 'created_at', 'updated_at', 'is_new_record')
    ) INTO actual_columns;
    
    -- Comparar e encontrar campos faltantes
    FOR field_record IN SELECT jsonb_array_elements(discovered_fields)
    LOOP
        field_name := field_record->>'name';
        field_type := field_record->>'type';
        
        -- Se o campo não existe na tabela atual, é um campo faltante
        IF field_name != ALL(actual_columns) THEN
            missing_field := field_name;
            discovered_type := field_type;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
SELECT * FROM check_missing_fields();

-- Limpar função temporária
DROP FUNCTION check_missing_fields();