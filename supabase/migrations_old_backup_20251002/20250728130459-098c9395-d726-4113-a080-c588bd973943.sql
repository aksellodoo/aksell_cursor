-- Verificar e recriar o trigger de audit para profiles se necessário
-- Primeiro, vamos garantir que o trigger existe e está funcionando

-- Recriar o trigger para profiles (caso tenha sido perdido)
DROP TRIGGER IF EXISTS profiles_audit_trigger ON public.profiles;

CREATE TRIGGER profiles_audit_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profiles_changes();

-- Criar tabela para arquivos do chatter
CREATE TABLE IF NOT EXISTS public.chatter_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    record_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatter_files ENABLE ROW LEVEL SECURITY;

-- Create policies for chatter_files
CREATE POLICY "Users can view chatter files for accessible records" 
ON public.chatter_files 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload chatter files" 
ON public.chatter_files 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own chatter files" 
ON public.chatter_files 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create trigger for timestamps
CREATE TRIGGER update_chatter_files_updated_at
    BEFORE UPDATE ON public.chatter_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage policies for the employee-files bucket if they don't exist
INSERT INTO storage.objects (bucket_id, name, owner, metadata) 
VALUES ('employee-files', '.keep', null, '{}') 
ON CONFLICT DO NOTHING;

-- Create policies for chatter files in storage
CREATE POLICY "Users can view chatter files in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-files');

CREATE POLICY "Users can upload chatter files to storage" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their chatter files from storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'employee-files' AND auth.uid()::text = (storage.foldername(name))[1]);