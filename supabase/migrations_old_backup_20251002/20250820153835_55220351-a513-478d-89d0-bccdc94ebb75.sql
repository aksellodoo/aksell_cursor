-- Simply add 'deleted' to the protheus_record_status enum
DO $$ 
BEGIN
    -- Check if 'deleted' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'protheus_record_status' AND e.enumlabel = 'deleted'
    ) THEN
        -- Add 'deleted' value to the enum
        ALTER TYPE protheus_record_status ADD VALUE 'deleted';
    END IF;
END $$;