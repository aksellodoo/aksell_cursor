-- Criar bucket para arquivos de funcionários
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-files', 'employee-files', true);

-- Criar políticas para o bucket employee-files
CREATE POLICY "Employee files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-files');

CREATE POLICY "Authenticated users can upload employee files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update employee files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete employee files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);