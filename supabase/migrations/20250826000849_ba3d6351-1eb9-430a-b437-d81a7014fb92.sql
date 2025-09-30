-- Fix SB1010 table data type issues
-- Convert BIGINT columns that came from Oracle NUMBER to NUMERIC to handle decimal conversion

DO $$
DECLARE
    target_table_name text := 'protheus_sb1010_eaf19807';
    col_record record;
    alter_sql text;
BEGIN
    -- Check if table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_table_name AND table_schema = 'public') THEN
        -- Find BIGINT columns that might be causing issues
        FOR col_record IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = target_table_name 
            AND table_schema = 'public' 
            AND data_type = 'bigint'
            AND column_name NOT IN ('id') -- Keep ID as bigint
        LOOP
            -- Convert BIGINT to NUMERIC for each problematic column
            alter_sql := format('ALTER TABLE public.%I ALTER COLUMN %I TYPE NUMERIC USING %I::NUMERIC', 
                               target_table_name, 
                               col_record.column_name, 
                               col_record.column_name);
            
            EXECUTE alter_sql;
            
            RAISE NOTICE 'Converted column % from BIGINT to NUMERIC', col_record.column_name;
        END LOOP;
        
        RAISE NOTICE 'Successfully updated table % column types', target_table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist', target_table_name;
    END IF;
END $$;