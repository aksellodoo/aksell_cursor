-- Criar bucket para arquivos de formulários
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-files', 'form-files', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualizar arquivos do bucket
CREATE POLICY "Anyone can view form files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'form-files');

-- Política para upload de arquivos
CREATE POLICY "Authenticated users can upload form files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'form-files' AND auth.role() = 'authenticated');