-- Add service_type and representative_id columns to unified_accounts table
ALTER TABLE public.unified_accounts 
ADD COLUMN service_type text NOT NULL DEFAULT 'direct' CHECK (service_type IN ('direct', 'representative'));

ALTER TABLE public.unified_accounts 
ADD COLUMN representative_id uuid NULL REFERENCES public.commercial_representatives(id);

-- Add constraint to ensure representative_id is required when service_type is 'representative'
ALTER TABLE public.unified_accounts 
ADD CONSTRAINT unified_accounts_service_rep_check 
CHECK (
  (service_type = 'direct' AND representative_id IS NULL) OR 
  (service_type = 'representative' AND representative_id IS NOT NULL)
);