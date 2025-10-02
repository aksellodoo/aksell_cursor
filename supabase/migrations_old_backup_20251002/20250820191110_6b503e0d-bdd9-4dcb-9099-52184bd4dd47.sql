-- Add pending deletion columns to all Protheus tables and backfill data
DO $$
DECLARE
    table_record RECORD;
    deletion_record RECORD;
    sql_text TEXT;
BEGIN
    -- Add columns and indexes to all protheus_ tables
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'protheus_%'
    LOOP
        -- Add pending_deletion column if it doesn't exist
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE', table_record.tablename);
            RAISE NOTICE 'Added pending_deletion column to %', table_record.tablename;
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Column pending_deletion already exists in %', table_record.tablename;
        END;
        
        -- Add pending_deletion_at column if it doesn't exist
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL', table_record.tablename);
            RAISE NOTICE 'Added pending_deletion_at column to %', table_record.tablename;
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Column pending_deletion_at already exists in %', table_record.tablename;
        END;
        
        -- Create index if it doesn't exist
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion)', 
                table_record.tablename || '_pending_deletion_idx', 
                table_record.tablename);
            RAISE NOTICE 'Created index on pending_deletion for %', table_record.tablename;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Index creation failed or already exists for %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Backfill deletion data from protheus_sync_deletions
    FOR deletion_record IN 
        SELECT DISTINCT supabase_table_name 
        FROM protheus_sync_deletions 
        WHERE supabase_table_name IS NOT NULL
    LOOP
        -- Check if the table exists
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = deletion_record.supabase_table_name
        ) THEN
            -- Update records that have deletions logged
            sql_text := format('
                UPDATE public.%I 
                SET pending_deletion = TRUE, 
                    pending_deletion_at = psd.created_at
                FROM protheus_sync_deletions psd
                WHERE %I.protheus_id = psd.protheus_id 
                AND psd.supabase_table_name = %L
                AND %I.pending_deletion = FALSE',
                deletion_record.supabase_table_name,
                deletion_record.supabase_table_name,
                deletion_record.supabase_table_name,
                deletion_record.supabase_table_name
            );
            
            EXECUTE sql_text;
            
            GET DIAGNOSTICS sql_text = ROW_COUNT;
            RAISE NOTICE 'Updated % records in % table with deletion status', sql_text, deletion_record.supabase_table_name;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping backfill', deletion_record.supabase_table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed adding pending deletion columns and backfilling data for all Protheus tables';
END
$$;