-- Add RLS policies for authenticated users to access Protheus-related tables

-- Enable RLS and create policies for protheus_tables
ALTER TABLE public.protheus_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read protheus_tables" 
ON public.protheus_tables 
FOR SELECT 
TO authenticated 
USING (true);

-- Enable RLS and create policies for protheus_dynamic_tables
ALTER TABLE public.protheus_dynamic_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read protheus_dynamic_tables" 
ON public.protheus_dynamic_tables 
FOR SELECT 
TO authenticated 
USING (true);

-- Enable RLS and create policies for protheus_sync_logs
ALTER TABLE public.protheus_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read protheus_sync_logs" 
ON public.protheus_sync_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- Enable RLS and create policies for protheus_sync_deletions
ALTER TABLE public.protheus_sync_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read protheus_sync_deletions" 
ON public.protheus_sync_deletions 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policies for all existing dynamic tables that start with 'protheus_'
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'protheus_%'
        AND tablename NOT IN ('protheus_tables', 'protheus_dynamic_tables', 'protheus_sync_logs', 'protheus_sync_deletions')
    LOOP
        -- Enable RLS for each dynamic table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        
        -- Create SELECT policy for authenticated users
        EXECUTE format('CREATE POLICY "Authenticated users can read %I" ON public.%I FOR SELECT TO authenticated USING (true)', 
                      table_record.tablename, table_record.tablename);
    END LOOP;
END $$;