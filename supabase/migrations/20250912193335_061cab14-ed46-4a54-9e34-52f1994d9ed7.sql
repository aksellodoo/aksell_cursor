-- Create document_status enum with all required statuses
CREATE TYPE document_status AS ENUM (
  'aprovado',
  'pendente_revisao', 
  'pendente_aprovacao',
  'rejeitado',
  'obsoleto',
  'processing',
  'active',
  'error'
);

-- Add new columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS replacement_document_id uuid REFERENCES public.documents(id),
ADD COLUMN IF NOT EXISTS pending_type text CHECK (pending_type IN ('revisao', 'aprovacao'));

-- First remove the default, then change the type, then set the new default
ALTER TABLE public.documents ALTER COLUMN status DROP DEFAULT;

-- Update documents.status column to use the enum (keeping existing data)
UPDATE public.documents SET status = 'active' WHERE status NOT IN ('aprovado', 'pendente_revisao', 'pendente_aprovacao', 'rejeitado', 'obsoleto', 'processing', 'active', 'error');

-- Change column type to enum
ALTER TABLE public.documents ALTER COLUMN status TYPE document_status USING status::document_status;

-- Set default value
ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT 'active'::document_status;