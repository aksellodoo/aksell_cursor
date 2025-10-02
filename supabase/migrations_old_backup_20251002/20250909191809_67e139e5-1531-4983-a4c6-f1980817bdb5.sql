-- Enable RLS on documents table and create basic policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to see and manage documents
-- (This matches the current application behavior)
CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" ON public.documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON public.documents
  FOR DELETE USING (auth.uid() IS NOT NULL);