-- Add 'deleted' to the protheus_record_status enum
DO $$ 
BEGIN
    -- Add 'deleted' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'protheus_record_status' AND e.enumlabel = 'deleted'
    ) THEN
        ALTER TYPE protheus_record_status ADD VALUE 'deleted';
    END IF;
END $$;

-- Create function to calculate record status based on flags
CREATE OR REPLACE FUNCTION calculate_protheus_record_status(
    pending_deletion boolean,
    is_new_record boolean,
    was_updated_last_sync boolean
) RETURNS protheus_record_status AS $$
BEGIN
    -- Priority 1: If pending deletion, return 'deleted'
    IF pending_deletion = true THEN
        RETURN 'deleted'::protheus_record_status;
    END IF;
    
    -- Priority 2: If new record, return 'new'
    IF is_new_record = true THEN
        RETURN 'new'::protheus_record_status;
    END IF;
    
    -- Priority 3: If was updated in last sync, return 'updated'
    IF was_updated_last_sync = true THEN
        RETURN 'updated'::protheus_record_status;
    END IF;
    
    -- Default: unchanged
    RETURN 'unchanged'::protheus_record_status;
END;
$$ LANGUAGE plpgsql IMMUTABLE;