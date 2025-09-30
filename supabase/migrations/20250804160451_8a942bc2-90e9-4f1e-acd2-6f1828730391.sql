-- Limpar todos os registros de aprovações e correções
-- Operação solicitada pelo usuário para reset completo dos dados

-- Deletar todos os tokens de aprovação
DELETE FROM public.approval_tokens;

-- Deletar todas as correções de workflow
DELETE FROM public.workflow_corrections;

-- Deletar todas as aprovações de workflow
DELETE FROM public.workflow_approvals;