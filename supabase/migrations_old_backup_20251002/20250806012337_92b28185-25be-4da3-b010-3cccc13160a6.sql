-- Correção do mapeamento de campos perdidos na tabela SA1010
-- Este script irá redescobrir os campos do Oracle e atualizar o field_mappings

DO $$
DECLARE
    protheus_table_id_var UUID := '4eb98c2d-7216-4abd-8802-f81568633578';
    current_mappings JSONB;
    current_count INTEGER;
    oracle_fields JSONB;
BEGIN
    -- Buscar o mapeamento atual
    SELECT table_structure->'field_mappings' 
    INTO current_mappings 
    FROM protheus_dynamic_tables 
    WHERE protheus_table_id = protheus_table_id_var;
    
    -- Contar campos atuais
    SELECT jsonb_array_length(current_mappings) INTO current_count;
    
    RAISE NOTICE 'Campos atualmente mapeados: %', current_count;
    
    -- Reconstituir o mapeamento baseado nos campos da tabela física
    WITH oracle_columns AS (
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'protheus_sa1010_4eb98c2d'
          AND table_schema = 'public'
          AND column_name NOT IN ('id', 'created_at', 'updated_at', 'protheus_id', 'is_new_record', 'record_hash')
        ORDER BY ordinal_position
    ),
    reconstructed_mappings AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'originalName', UPPER(REPLACE(column_name, '_', '')),
                'sanitizedName', column_name,
                'postgresType', CASE 
                    WHEN data_type = 'text' THEN 'TEXT'
                    WHEN data_type = 'integer' THEN 'INTEGER'
                    WHEN data_type = 'bytea' THEN 'BYTEA'
                    ELSE 'TEXT'
                END
            ) ORDER BY column_name
        ) as reconstructed
        FROM oracle_columns
    )
    SELECT reconstructed INTO oracle_fields FROM reconstructed_mappings;
    
    RAISE NOTICE 'Campos descobertos da tabela física: %', jsonb_array_length(oracle_fields);
    
    -- Verificar se há diferença e atualizar
    IF jsonb_array_length(oracle_fields) > current_count THEN
        RAISE NOTICE 'Corrigindo mapeamento: de % para % campos', 
                     current_count, jsonb_array_length(oracle_fields);
        
        -- Atualizar o field_mappings com todos os campos descobertos
        UPDATE protheus_dynamic_tables 
        SET table_structure = table_structure || jsonb_build_object('field_mappings', oracle_fields),
            updated_at = now()
        WHERE protheus_table_id = protheus_table_id_var;
        
        RAISE NOTICE 'Mapeamento corrigido com sucesso! Agora temos % campos mapeados', 
                     jsonb_array_length(oracle_fields);
        
    ELSE
        RAISE NOTICE 'Mapeamento já está correto com % campos', current_count;
    END IF;
    
END $$;