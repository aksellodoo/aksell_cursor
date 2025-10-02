-- Converter todos os campos da tabela protheus_sa1010_4eb98c2d para TEXT
-- Isso eliminará problemas de incompatibilidade de tipos entre Oracle e PostgreSQL

-- Alterar campos integer para text
ALTER TABLE protheus_sa1010_4eb98c2d 
ALTER COLUMN a1_salfin TYPE TEXT,
ALTER COLUMN a1_vacum TYPE TEXT,
ALTER COLUMN a1_salfinm TYPE TEXT,
ALTER COLUMN a1_salped TYPE TEXT,
ALTER COLUMN a1_titprot TYPE TEXT,
ALTER COLUMN a1_chqdevo TYPE TEXT,
ALTER COLUMN a1_matr TYPE TEXT,
ALTER COLUMN a1_maidupl TYPE TEXT,
ALTER COLUMN a1_saldupm TYPE TEXT,
ALTER COLUMN a1_pagatr TYPE TEXT,
ALTER COLUMN a1_aliqir TYPE TEXT,
ALTER COLUMN a1_nvestn TYPE TEXT,
ALTER COLUMN a1_salpedb TYPE TEXT,
ALTER COLUMN a1_comis TYPE TEXT,
ALTER COLUMN r_e_c_n_o TYPE TEXT,
ALTER COLUMN r_e_c_d_e_l TYPE TEXT,
ALTER COLUMN a1_perfil TYPE TEXT,
ALTER COLUMN a1_desc TYPE TEXT,
ALTER COLUMN a1_lc TYPE TEXT,
ALTER COLUMN a1_lcfin TYPE TEXT,
ALTER COLUMN a1_moedalc TYPE TEXT,
ALTER COLUMN a1_msaldo TYPE TEXT,
ALTER COLUMN a1_mcompra TYPE TEXT,
ALTER COLUMN a1_metr TYPE TEXT,
ALTER COLUMN a1_comage TYPE TEXT,
ALTER COLUMN a1_nrocom TYPE TEXT,
ALTER COLUMN a1_percatm TYPE TEXT,
ALTER COLUMN a1_temvis TYPE TEXT,
ALTER COLUMN a1_perfecp TYPE TEXT,
ALTER COLUMN a1_saldup TYPE TEXT,
ALTER COLUMN a1_diaspag TYPE TEXT,
ALTER COLUMN a1_nropag TYPE TEXT,
ALTER COLUMN a1_salpedl TYPE TEXT,
ALTER COLUMN a1_atr TYPE TEXT;

-- Alterar campo bytea para text
ALTER TABLE protheus_sa1010_4eb98c2d 
ALTER COLUMN a1_prf_obs TYPE TEXT;

-- Atualizar o mapeamento de campos para refletir que todos são TEXT
UPDATE protheus_dynamic_tables 
SET table_structure = jsonb_set(
    table_structure,
    '{field_mappings}',
    (
        SELECT jsonb_agg(
            jsonb_set(
                field_mapping,
                '{postgresType}',
                '"TEXT"'
            )
        )
        FROM jsonb_array_elements(table_structure->'field_mappings') AS field_mapping
    )
),
updated_at = now()
WHERE protheus_table_id = '4eb98c2d-7216-4abd-8802-f81568633578';