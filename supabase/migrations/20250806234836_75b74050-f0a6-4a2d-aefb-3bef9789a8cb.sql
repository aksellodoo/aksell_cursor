-- Fix Extension in Public warning by moving pg_net to extensions schema
-- First check if http_request_queue is empty (required for safe migration)
DO $$
DECLARE
    queue_count INTEGER;
BEGIN
    -- Check if the queue is empty
    SELECT COUNT(*) INTO queue_count FROM net.http_request_queue;
    
    IF queue_count > 0 THEN
        RAISE EXCEPTION 'Cannot migrate pg_net extension: http_request_queue is not empty. Please wait for pending requests to complete or contact support.';
    END IF;
    
    -- Drop and recreate pg_net extension in extensions schema
    DROP EXTENSION IF EXISTS pg_net CASCADE;
    CREATE EXTENSION pg_net SCHEMA extensions;
    
    -- Log the successful migration
    RAISE NOTICE 'Successfully moved pg_net extension to extensions schema';
END $$;