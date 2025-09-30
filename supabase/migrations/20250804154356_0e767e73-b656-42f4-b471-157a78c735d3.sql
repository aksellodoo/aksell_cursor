-- Adicionar campo para definir se tarefa vai para listagem de tarefas pendentes
ALTER TABLE public.task_types 
ADD COLUMN goes_to_pending_list boolean NOT NULL DEFAULT false;

-- Comentário explicativo do campo
COMMENT ON COLUMN public.task_types.goes_to_pending_list IS 'Define se tarefas deste tipo vão para a listagem "Tarefas Pendentes" (true) ou para as visualizações normais como Kanban, Lista, etc (false)';