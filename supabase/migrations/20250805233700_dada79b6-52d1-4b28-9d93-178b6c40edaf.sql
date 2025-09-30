-- Add oracle_schema field to protheus_config table
ALTER TABLE public.protheus_config 
ADD COLUMN oracle_schema text DEFAULT '';