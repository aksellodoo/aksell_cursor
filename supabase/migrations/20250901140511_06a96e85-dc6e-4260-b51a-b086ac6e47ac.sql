-- Create unified account segments mapping table
CREATE TABLE public.unified_account_segments_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  segment_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_account_segment UNIQUE (account_id, segment_id)
);

-- Add foreign key constraints
ALTER TABLE public.unified_account_segments_map 
ADD CONSTRAINT fk_account_segments_account 
FOREIGN KEY (account_id) REFERENCES public.unified_accounts(id) ON DELETE CASCADE;

ALTER TABLE public.unified_account_segments_map 
ADD CONSTRAINT fk_account_segments_segment 
FOREIGN KEY (segment_id) REFERENCES public.site_product_segments(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_unified_account_segments_account_id ON public.unified_account_segments_map(account_id);
CREATE INDEX idx_unified_account_segments_segment_id ON public.unified_account_segments_map(segment_id);

-- Enable Row Level Security
ALTER TABLE public.unified_account_segments_map ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view segment mappings
CREATE POLICY "Authenticated users can view unified account segments" 
ON public.unified_account_segments_map 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policy: Account creators and admins can insert segment mappings
CREATE POLICY "Account creators and admins can insert unified account segments" 
ON public.unified_account_segments_map 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (
      SELECT 1 FROM public.unified_accounts ua 
      WHERE ua.id = account_id AND ua.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'director')
    )
  )
);

-- Policy: Account creators and admins can delete segment mappings
CREATE POLICY "Account creators and admins can delete unified account segments" 
ON public.unified_account_segments_map 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.unified_accounts ua 
    WHERE ua.id = account_id AND ua.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'director')
  )
);