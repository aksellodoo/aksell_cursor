-- Limpar todos os registros de aprovações e correções
-- Operação solicitada pelo usuário para reset completo dos dados

-- Deletar todos os tokens de aprovação
DELETE FROM public.approval_tokens;

-- Deletar todas as correções de workflow
DELETE FROM public.workflow_corrections;

-- Deletar todas as aprovações de workflow
DELETE FROM public.workflow_approvals;

-- Log da operação de limpeza
INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
VALUES (
  gen_random_uuid(),
  'bulk_delete_approvals_corrections',
  'all_records',
  'deleted_by_user_request',
  auth.uid(),
  'system_cleanup'
);