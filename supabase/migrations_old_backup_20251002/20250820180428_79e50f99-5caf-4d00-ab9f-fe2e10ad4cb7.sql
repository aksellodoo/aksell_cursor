-- Add pending_deletion columns to all dynamic Protheus tables and backfill deletion data

DO $$
DECLARE
    table_record RECORD;
    sql_cmd TEXT;
BEGIN
    -- Loop through all dynamic tables and add the missing columns
    FOR table_record IN 
        SELECT supabase_table_name 
        FROM public.protheus_dynamic_tables 
        WHERE supabase_table_name IS NOT NULL
    LOOP
        -- Check if pending_deletion column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.supabase_table_name 
            AND column_name = 'pending_deletion'
        ) THEN
            -- Add pending_deletion column
            sql_cmd := format('ALTER TABLE public.%I ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE', table_record.supabase_table_name);
            EXECUTE sql_cmd;
            RAISE NOTICE 'Added pending_deletion column to %', table_record.supabase_table_name;
        END IF;
        
        -- Check if pending_deletion_at column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.supabase_table_name 
            AND column_name = 'pending_deletion_at'
        ) THEN
            -- Add pending_deletion_at column
            sql_cmd := format('ALTER TABLE public.%I ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL', table_record.supabase_table_name);
            EXECUTE sql_cmd;
            RAISE NOTICE 'Added pending_deletion_at column to %', table_record.supabase_table_name;
        END IF;
        
        -- Create index on pending_deletion if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = table_record.supabase_table_name 
            AND indexname = format('%s_pending_deletion_idx', table_record.supabase_table_name)
        ) THEN
            sql_cmd := format('CREATE INDEX %I ON public.%I (pending_deletion)', 
                format('%s_pending_deletion_idx', table_record.supabase_table_name), 
                table_record.supabase_table_name);
            EXECUTE sql_cmd;
            RAISE NOTICE 'Created index on pending_deletion for %', table_record.supabase_table_name;
        END IF;
        
        -- Backfill deletion data from protheus_sync_deletions
        sql_cmd := format('
            UPDATE public.%I 
            SET pending_deletion = TRUE, 
                pending_deletion_at = psd.created_at
            FROM public.protheus_sync_deletions psd
            WHERE psd.supabase_table_name = %L
            AND public.%I.protheus_id = psd.protheus_id
            AND public.%I.pending_deletion = FALSE
        ', table_record.supabase_table_name, table_record.supabase_table_name, 
           table_record.supabase_table_name, table_record.supabase_table_name);
        
        EXECUTE sql_cmd;
        GET DIAGNOSTICS sql_cmd = ROW_COUNT;
        RAISE NOTICE 'Updated % records as pending_deletion in %', sql_cmd, table_record.supabase_table_name;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;