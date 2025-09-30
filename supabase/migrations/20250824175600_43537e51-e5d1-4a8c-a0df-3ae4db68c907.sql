
BEGIN;

-- 1) Colunas que devem aceitar NULL (para permitir ON DELETE SET NULL)
ALTER TABLE public.chatter_messages      ALTER COLUMN author_id   DROP NOT NULL;
ALTER TABLE public.task_comments         ALTER COLUMN author_id   DROP NOT NULL;
ALTER TABLE public.task_attachments      ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.employee_documents    ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.field_audit_log       ALTER COLUMN changed_by  DROP NOT NULL;
ALTER TABLE public.access_rejections     ALTER COLUMN rejected_by DROP NOT NULL;
-- Opcional (para a limpeza da edge function funcionar sem erro):
ALTER TABLE public.chatter_email_messages ALTER COLUMN author_id  DROP NOT NULL;

-- 2) Recriar FKs para perfis com comportamentos adequados

-- Logs e conteúdo: manter registros, mas limpar a autoria
ALTER TABLE public.field_audit_log
  DROP CONSTRAINT IF EXISTS field_audit_log_changed_by_fkey,
  ADD  CONSTRAINT field_audit_log_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.chatter_messages
  DROP CONSTRAINT IF EXISTS chatter_messages_author_id_fkey,
  ADD  CONSTRAINT chatter_messages_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.task_comments
  DROP CONSTRAINT IF EXISTS task_comments_author_id_fkey,
  ADD  CONSTRAINT task_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.task_attachments
  DROP CONSTRAINT IF EXISTS task_attachments_uploaded_by_fkey,
  ADD  CONSTRAINT task_attachments_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.employee_documents
  DROP CONSTRAINT IF EXISTS employee_documents_uploaded_by_fkey,
  ADD  CONSTRAINT employee_documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.access_rejections
  DROP CONSTRAINT IF EXISTS access_rejections_rejected_by_fkey,
  ADD  CONSTRAINT access_rejections_rejected_by_fkey
    FOREIGN KEY (rejected_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Relacionamentos de supervisor
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_supervisor_id_fkey,
  ADD  CONSTRAINT profiles_supervisor_id_fkey
    FOREIGN KEY (supervisor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.pending_access_requests
  DROP CONSTRAINT IF EXISTS pending_access_requests_supervisor_id_fkey,
  ADD  CONSTRAINT pending_access_requests_supervisor_id_fkey
    FOREIGN KEY (supervisor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Workflow: manter execução, limpar "triggered_by"
ALTER TABLE public.workflow_executions
  DROP CONSTRAINT IF EXISTS workflow_executions_triggered_by_fkey,
  ADD  CONSTRAINT workflow_executions_triggered_by_fkey
    FOREIGN KEY (triggered_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Templates/Tipos de tarefa: manter registro, limpar "created_by"
ALTER TABLE public.task_templates
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.task_templates
  DROP CONSTRAINT IF EXISTS task_templates_created_by_fkey,
  ADD  CONSTRAINT task_templates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.task_types
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.task_types
  DROP CONSTRAINT IF EXISTS task_types_created_by_fkey,
  ADD  CONSTRAINT task_types_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Registros dependentes do usuário: apagar junto (CASCADE)
ALTER TABLE public.email_draft_shares
  DROP CONSTRAINT IF EXISTS email_draft_shares_user_id_fkey,
  ADD  CONSTRAINT email_draft_shares_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.form_response_drafts
  DROP CONSTRAINT IF EXISTS form_response_drafts_user_id_fkey,
  ADD  CONSTRAINT form_response_drafts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.protheus_config
  DROP CONSTRAINT IF EXISTS protheus_config_user_id_fkey,
  ADD  CONSTRAINT protheus_config_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
