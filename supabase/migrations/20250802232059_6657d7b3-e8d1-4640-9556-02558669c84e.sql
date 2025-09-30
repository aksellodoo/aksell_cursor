-- Remove the old version of process_access_request_approval function to resolve overload conflict
DROP FUNCTION IF EXISTS public.process_access_request_approval(uuid, boolean, text, uuid, jsonb);