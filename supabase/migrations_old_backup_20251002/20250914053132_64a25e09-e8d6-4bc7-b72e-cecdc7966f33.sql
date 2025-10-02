-- Fix the default status value in documents table to use a valid constraint value
ALTER TABLE public.documents 
ALTER COLUMN status SET DEFAULT 'Processando';

-- Update any existing documents with 'active' status to a valid status
UPDATE public.documents 
SET status = 'Processando' 
WHERE status = 'active';