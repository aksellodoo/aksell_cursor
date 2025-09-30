-- Adicionar campo supervisor_id na tabela pending_access_requests
ALTER TABLE public.pending_access_requests 
ADD COLUMN supervisor_id UUID REFERENCES public.profiles(id) NULL;