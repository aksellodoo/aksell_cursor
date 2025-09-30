-- Adicionar coluna task_code com sequência automática
CREATE SEQUENCE IF NOT EXISTS tasks_code_seq START WITH 1 INCREMENT BY 1;

-- Adicionar coluna task_code
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_code INTEGER NOT NULL DEFAULT nextval('tasks_code_seq');

-- Criar índice único para performance e integridade
CREATE UNIQUE INDEX IF NOT EXISTS tasks_task_code_unique ON public.tasks(task_code);

-- Atualizar códigos para tarefas existentes (ordem por data de criação)
WITH ordered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_code
  FROM public.tasks
)
UPDATE public.tasks t
SET task_code = ot.new_code
FROM ordered_tasks ot
WHERE t.id = ot.id;

-- Ajustar a sequência para começar após o último código existente
SELECT setval('tasks_code_seq', (SELECT COALESCE(MAX(task_code), 0) + 1 FROM public.tasks), false);