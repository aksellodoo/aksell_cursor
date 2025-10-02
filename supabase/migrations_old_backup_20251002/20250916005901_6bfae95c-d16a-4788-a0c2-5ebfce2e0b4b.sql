-- Adicionar campos faltantes na tabela documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS reviewers UUID[],
ADD COLUMN IF NOT EXISTS review_department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS approval_mode TEXT CHECK (approval_mode IN ('single', 'any', 'all')),
ADD COLUMN IF NOT EXISTS approvers UUID[];

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON public.documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_review_department ON public.documents(review_department_id);

-- Comentários para documentar os campos
COMMENT ON COLUMN public.documents.description IS 'Descrição do documento inserida durante o processo de importação';
COMMENT ON COLUMN public.documents.file_type IS 'Tipo de arquivo selecionado na etapa 2 do wizard (pdf, word, excel, etc)';
COMMENT ON COLUMN public.documents.reviewers IS 'Array de UUIDs dos usuários selecionados como revisores';
COMMENT ON COLUMN public.documents.review_department_id IS 'ID do departamento selecionado para revisão';
COMMENT ON COLUMN public.documents.approval_mode IS 'Modo de aprovação: single (um aprovador), any (qualquer aprovador), all (todos os aprovadores)';
COMMENT ON COLUMN public.documents.approvers IS 'Array de UUIDs dos usuários selecionados como aprovadores';