-- Add versioning and validity fields to documents table
ALTER TABLE public.documents 
ADD COLUMN effective_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN expiry_date DATE,
ADD COLUMN version_number INTEGER DEFAULT 1,
ADD COLUMN version_notes TEXT;