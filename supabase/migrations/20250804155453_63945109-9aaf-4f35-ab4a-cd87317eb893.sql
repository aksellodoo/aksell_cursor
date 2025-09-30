-- Criar enum para tipos de preenchimento
CREATE TYPE filling_type AS ENUM ('none', 'approval');

-- Adicionar campos para tipos de preenchimento e configuração de aprovação
ALTER TABLE public.task_types 
ADD COLUMN filling_type filling_type NOT NULL DEFAULT 'none',
ADD COLUMN approval_config jsonb DEFAULT '{}';

-- Comentários explicativos
COMMENT ON COLUMN public.task_types.filling_type IS 'Define o tipo de preenchimento da tarefa: none (apenas formulário), approval (configuração de aprovação)';
COMMENT ON COLUMN public.task_types.approval_config IS 'Configurações de aprovação quando filling_type é approval';