-- Remover constraint atual do campo status
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;

-- Migrar dados existentes para valores humanizados
UPDATE public.documents 
SET status = CASE 
  WHEN status = 'processing' THEN 'Processando'
  WHEN status = 'active' THEN 'Aprovado'
  WHEN status = 'error' THEN 'Rejeitado'
  WHEN status = 'archived' THEN 'Obsoleto'
  WHEN status = 'hidden' THEN 'Obsoleto'
  ELSE 'Pendente de Aprovação'
END;

-- Criar novo constraint com valores humanizados
ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_humanized_check 
CHECK (status IN ('Aprovado', 'Pendente de Revisão', 'Pendente de Aprovação', 'Rejeitado', 'Obsoleto', 'Processando'));