-- Add processing configuration columns to documents table
ALTER TABLE public.documents 
ADD COLUMN processing_mode text,
ADD COLUMN processing_language_hints text[],
ADD COLUMN processing_auto_detect_language boolean DEFAULT false,
ADD COLUMN processing_custom_language text;