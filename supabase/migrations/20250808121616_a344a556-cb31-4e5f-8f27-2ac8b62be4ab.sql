-- Add computed field metadata to extra fields table
ALTER TABLE public.protheus_table_extra_fields
ADD COLUMN IF NOT EXISTS compute_mode text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS compute_expression text,
ADD COLUMN IF NOT EXISTS compute_separator text DEFAULT '',
ADD COLUMN IF NOT EXISTS compute_options jsonb NOT NULL DEFAULT '{}'::jsonb;
