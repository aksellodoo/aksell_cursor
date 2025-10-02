-- Adicionar campos para vincular tarefas a tipos e dados de aprovação
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_type_id UUID REFERENCES public.task_types(id),
ADD COLUMN IF NOT EXISTS approval_title TEXT,
ADD COLUMN IF NOT EXISTS approval_description TEXT;