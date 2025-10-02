-- Adicionar campos para rastreamento de tarefas duplicadas
-- Suporta o novo tipo de atribuição "Todos" onde cada usuário recebe uma cópia única da tarefa

-- Adicionar campo para rastrear a tarefa pai (quando uma tarefa é duplicada)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Adicionar campo para identificar o tipo de duplicação
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS duplication_type TEXT CHECK (duplication_type IN ('original', 'individual_copy', NULL));

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Comentários para documentação
COMMENT ON COLUMN public.tasks.parent_task_id IS 'ID da tarefa original quando esta é uma cópia (tipo de atribuição "Todos")';
COMMENT ON COLUMN public.tasks.duplication_type IS 'Tipo de duplicação: original (tarefa original), individual_copy (cópia para usuário individual), NULL (não duplicada)';
