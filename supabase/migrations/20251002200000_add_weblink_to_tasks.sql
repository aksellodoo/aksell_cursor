-- Adicionar coluna weblink para armazenar links externos relacionados à tarefa
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS weblink TEXT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.tasks.weblink IS 'Link externo (URL) relacionado à tarefa - opcional';

-- Criar índice para melhorar performance de buscas por tarefas com weblink
CREATE INDEX IF NOT EXISTS idx_tasks_weblink ON public.tasks(weblink)
WHERE weblink IS NOT NULL;

-- Adicionar constraint de validação básica para garantir que se weblink for informado, não seja vazio
ALTER TABLE public.tasks
ADD CONSTRAINT check_weblink_not_empty
CHECK (weblink IS NULL OR length(trim(weblink)) > 0);
