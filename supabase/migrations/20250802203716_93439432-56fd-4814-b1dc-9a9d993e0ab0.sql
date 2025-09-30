-- Remove the existing unique constraint on email
ALTER TABLE public.pending_access_requests DROP CONSTRAINT IF EXISTS pending_access_requests_email_key;

-- Add a new unique constraint that only applies to pending requests
CREATE UNIQUE INDEX pending_access_requests_email_pending_unique 
ON public.pending_access_requests (email) 
WHERE status = 'pending';

-- Add a function to clean up old processed requests (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_processed_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove processed requests older than 90 days
  DELETE FROM public.pending_access_requests 
  WHERE status IN ('approved', 'rejected')
    AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$