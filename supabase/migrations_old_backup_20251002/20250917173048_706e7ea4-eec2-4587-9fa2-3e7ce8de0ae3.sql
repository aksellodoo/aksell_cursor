-- Add processing_status to documents table
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Add processing_status column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS processing_status processing_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS error_message text;

-- Update existing documents to set appropriate processing_status
UPDATE public.documents 
SET processing_status = CASE 
  WHEN status = 'Rejeitado' AND error_message IS NULL THEN 'failed'
  WHEN vectorized = true THEN 'completed'
  ELSE 'pending'
END;

-- Reset documents that were wrongly marked as "Rejeitado" due to processing errors
-- These should go back to their intended status based on wizard selection
UPDATE public.documents 
SET status = 'Pendente'
WHERE status = 'Rejeitado' 
  AND created_at > NOW() - INTERVAL '7 days'  -- Only recent imports
  AND (error_message IS NOT NULL OR processing_status = 'failed');