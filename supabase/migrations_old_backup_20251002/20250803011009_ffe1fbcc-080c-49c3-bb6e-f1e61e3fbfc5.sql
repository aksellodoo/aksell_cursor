-- Corrigir a foreign key da tabela access_rejections para apontar para profiles em vez de auth.users
ALTER TABLE public.access_rejections 
DROP CONSTRAINT IF EXISTS access_rejections_rejected_by_fkey;

-- Adicionar nova foreign key para profiles
ALTER TABLE public.access_rejections 
ADD CONSTRAINT access_rejections_rejected_by_fkey 
FOREIGN KEY (rejected_by) REFERENCES public.profiles(id) ON DELETE SET NULL;