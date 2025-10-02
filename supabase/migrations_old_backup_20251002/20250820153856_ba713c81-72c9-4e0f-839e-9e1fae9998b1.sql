-- Disable the problematic trigger temporarily, add enum value, then re-enable
DROP TRIGGER IF EXISTS auto_setup_protheus_table_trigger ON pg_event_trigger;
DROP FUNCTION IF EXISTS auto_setup_protheus_table();

-- Add 'deleted' to the protheus_record_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'protheus_record_status' AND e.enumlabel = 'deleted'
    ) THEN
        ALTER TYPE protheus_record_status ADD VALUE 'deleted';
    END IF;
END $$;