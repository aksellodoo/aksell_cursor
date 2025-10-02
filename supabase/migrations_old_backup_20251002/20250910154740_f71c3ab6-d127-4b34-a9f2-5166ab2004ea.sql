-- Create storage bucket for Protheus binary assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('protheus-blobs', 'protheus-blobs', false)
ON CONFLICT (id) DO NOTHING;

-- Create table for binary asset metadata
CREATE TABLE IF NOT EXISTS public.protheus_binary_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protheus_table_id uuid NOT NULL REFERENCES public.protheus_tables(id) ON DELETE CASCADE,
  supabase_table_name text NOT NULL,
  protheus_id text NOT NULL,
  field_name text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'protheus-blobs',
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  downloaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(protheus_table_id, protheus_id, field_name)
);

-- Add binary fields configuration to protheus_tables
ALTER TABLE public.protheus_tables 
ADD COLUMN IF NOT EXISTS binary_fields_config jsonb DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_protheus_binary_assets_table_id ON public.protheus_binary_assets(protheus_table_id);
CREATE INDEX IF NOT EXISTS idx_protheus_binary_assets_protheus_id ON public.protheus_binary_assets(protheus_id);
CREATE INDEX IF NOT EXISTS idx_protheus_binary_assets_sha256 ON public.protheus_binary_assets(sha256);

-- RLS policies for protheus_binary_assets
ALTER TABLE public.protheus_binary_assets ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on protheus_binary_assets"
ON public.protheus_binary_assets
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Authenticated users can read protheus_binary_assets"
ON public.protheus_binary_assets
FOR SELECT
TO authenticated
USING (true);

-- Storage policies for protheus-blobs bucket
CREATE POLICY "Service role can manage protheus-blobs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'protheus-blobs')
WITH CHECK (bucket_id = 'protheus-blobs');

CREATE POLICY "Authenticated users can read protheus-blobs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'protheus-blobs');

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_protheus_binary_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protheus_binary_assets_updated_at
  BEFORE UPDATE ON public.protheus_binary_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_protheus_binary_assets_updated_at();