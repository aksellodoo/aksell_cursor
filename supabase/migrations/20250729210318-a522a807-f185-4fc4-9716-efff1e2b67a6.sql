-- Adicionar coluna supervisor_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_profiles_supervisor_id ON public.profiles(supervisor_id);

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.supervisor_id IS 'Referência ao supervisor imediato do usuário';