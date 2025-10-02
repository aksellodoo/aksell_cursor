-- Minimal migration: add metadata columns for initial status
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS replacement_document_id uuid REFERENCES public.documents(id),
ADD COLUMN IF NOT EXISTS pending_type text;