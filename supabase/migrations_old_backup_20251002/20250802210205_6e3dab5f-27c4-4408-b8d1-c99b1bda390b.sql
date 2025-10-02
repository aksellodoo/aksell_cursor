-- Fix RLS policy to allow anonymous access requests
-- Drop existing INSERT policy that requires authentication
DROP POLICY IF EXISTS "Public can create pending requests" ON public.pending_access_requests;

-- Create new policy that allows anonymous users to create access requests
CREATE POLICY "Anonymous users can create access requests" 
ON public.pending_access_requests 
FOR INSERT 
WITH CHECK (
  -- Basic validations for security
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  department IS NOT NULL AND
  role IS NOT NULL AND
  -- Prevent obvious spam/injection attempts
  length(name) > 1 AND length(name) < 200 AND
  length(email) > 5 AND length(email) < 200 AND
  length(department) < 200 AND
  length(role) < 100
);