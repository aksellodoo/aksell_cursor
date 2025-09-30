-- Adicionar nova opção 'task_usage' ao status dos formulários
ALTER TABLE public.forms 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('draft', 'published_internal', 'published_external', 'published_mixed', 'archived', 'task_usage'));

ALTER TABLE public.forms 
ADD CONSTRAINT check_valid_publication_status 
CHECK (publication_status IN ('draft', 'published_internal', 'published_external', 'published_mixed', 'archived', 'task_usage'));