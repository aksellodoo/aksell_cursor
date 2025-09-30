-- Add is_leader flag to pending_access_requests to track team leader intent
ALTER TABLE public.pending_access_requests
  ADD COLUMN IF NOT EXISTS is_leader boolean NOT NULL DEFAULT false;