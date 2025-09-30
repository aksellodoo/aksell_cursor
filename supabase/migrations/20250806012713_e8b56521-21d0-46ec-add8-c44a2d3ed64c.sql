-- Correção definitiva do erro de sincronização - Identificar e remover campo extra
-- Problema: 246 campos mapeados vs 245 campos válidos (252 - 7 de controle)

DO $$
DECLARE
    protheus_table_id_var UUID := '4eb98c2d-7216-4abd-8802-f81568633578';
    current_mappings JSONB;
    physical_columns TEXT[];
    mapped_columns TEXT[];
    extra_fields TEXT[];
    missing_fields TEXT[];
    corrected_mappings JSONB;
BEGIN
    -- Buscar o mapeamento atual
    SELECT table_structure->'field_mappings' 
    INTO current_mappings 
    FROM protheus_dynamic_tables 
    WHERE protheus_table_id = protheus_table_id_var;
    
    RAISE NOTICE 'Mapeamento atual tem % campos', jsonb_array_length(current_mappings);
    
    -- Obter colunas físicas da tabela (excluindo campos de controle)
    SELECT array_agg(column_name ORDER BY column_name)
    INTO physical_columns
    FROM information_schema.columns 
    WHERE table_name = 'protheus_sa1010_4eb98c2d'
      AND table_schema = 'public'
      AND column_name NOT IN ('id', 'created_at', 'updated_at', 'protheus_id', 'is_new_record', 'record_hash', 'teste_campo');
    
    RAISE NOTICE 'Tabela física tem % campos válidos', array_length(physical_columns, 1);
    
    -- Obter colunas mapeadas
    SELECT array_agg(value->>'sanitizedName' ORDER BY value->>'sanitizedName')
    INTO mapped_columns
    FROM jsonb_array_elements(current_mappings);
    
    -- Identificar campos extras (mapeados mas não existem na tabela)
    SELECT array_agg(col)
    INTO extra_fields
    FROM unnest(mapped_columns) AS col
    WHERE col NOT IN (SELECT unnest(physical_columns));
    
    -- Identificar campos faltantes (existem na tabela mas não mapeados)
    SELECT array_agg(col)
    INTO missing_fields
    FROM unnest(physical_columns) AS col
    WHERE col NOT IN (SELECT unnest(mapped_columns));
    
    RAISE NOTICE 'Campos extras no mapeamento: %', COALESCE(array_to_string(extra_fields, ', '), 'nenhum');
    RAISE NOTICE 'Campos faltantes no mapeamento: %', COALESCE(array_to_string(missing_fields, ', '), 'nenhum');
    
    -- Reconstruir mapeamento correto baseado apenas nos campos que existem fisicamente
    WITH valid_columns AS (
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'protheus_sa1010_4eb98c2d'
          AND table_schema = 'public'
          AND column_name NOT IN ('id', 'created_at', 'updated_at', 'protheus_id', 'is_new_record', 'record_hash', 'teste_campo')
        ORDER BY column_name
    )
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
        )
    ) INTO corrected_mappings
    FROM valid_columns;
    
    RAISE NOTICE 'Novo mapeamento terá % campos', jsonb_array_length(corrected_mappings);
    
    -- Atualizar com o mapeamento corrigido
    UPDATE protheus_dynamic_tables 
    SET table_structure = table_structure || jsonb_build_object('field_mappings', corrected_mappings),
        updated_at = now()
    WHERE protheus_table_id = protheus_table_id_var;
    
    RAISE NOTICE 'Mapeamento corrigido! Campos removidos: %, Campos adicionados: %', 
                 COALESCE(array_length(extra_fields, 1), 0),
                 COALESCE(array_length(missing_fields, 1), 0);
    
    -- Verificação final
    SELECT table_structure->'field_mappings' 
    INTO current_mappings 
    FROM protheus_dynamic_tables 
    WHERE protheus_table_id = protheus_table_id_var;
    
    RAISE NOTICE 'VERIFICAÇÃO FINAL: Mapeamento agora tem % campos (deveria ser 245)', 
                 jsonb_array_length(current_mappings);
    
    IF jsonb_array_length(current_mappings) = 245 THEN
        RAISE NOTICE '✅ SUCESSO: Mapeamento corrigido com exatamente 245 campos!';
    ELSE
        RAISE NOTICE '❌ ERRO: Mapeamento ainda não está correto';
    END IF;
    
END $$;