
-- Tornar exclusões de usuários seguras limpando referências para perfis

-- 1) Tarefas: assigned_to -> permitir NULL e ON DELETE SET NULL
ALTER TABLE public.tasks
  ALTER COLUMN assigned_to DROP NOT NULL;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 2) Perfis: supervisor_id -> ON DELETE SET NULL (já é NULLable na maioria dos casos)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_supervisor_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_supervisor_id_fkey
  FOREIGN KEY (supervisor_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 3) Chatter: mensagens -> autor pode ficar NULL e limpar ao excluir perfil
ALTER TABLE public.chatter_messages
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.chatter_messages
  DROP CONSTRAINT IF EXISTS chatter_messages_author_id_fkey;

ALTER TABLE public.chatter_messages
  ADD CONSTRAINT chatter_messages_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 4) Chatter: e-mails -> autor pode ficar NULL e limpar ao excluir perfil
ALTER TABLE public.chatter_email_messages
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.chatter_email_messages
  DROP CONSTRAINT IF EXISTS chatter_email_messages_author_id_fkey;

ALTER TABLE public.chatter_email_messages
  ADD CONSTRAINT chatter_email_messages_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 5) Form responses: submitted_by -> ON DELETE SET NULL (campo já é NULLable)
ALTER TABLE public.form_responses
  DROP CONSTRAINT IF EXISTS form_responses_submitted_by_fkey;

ALTER TABLE public.form_responses
  ADD CONSTRAINT form_responses_submitted_by_fkey
  FOREIGN KEY (submitted_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 6) Contatos: created_by -> permitir NULL e ON DELETE SET NULL
ALTER TABLE public.contacts
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_created_by_fkey;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 7) Documentos de funcionário: uploaded_by -> permitir NULL e ON DELETE SET NULL
ALTER TABLE public.employee_documents
  ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE public.employee_documents
  DROP CONSTRAINT IF EXISTS employee_documents_uploaded_by_fkey;

ALTER TABLE public.employee_documents
  ADD CONSTRAINT employee_documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 8) Chatter files: uploaded_by -> permitir NULL e ON DELETE SET NULL
ALTER TABLE public.chatter_files
  ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE public.chatter_files
  DROP CONSTRAINT IF EXISTS chatter_files_uploaded_by_fkey;

ALTER TABLE public.chatter_files
  ADD CONSTRAINT chatter_files_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
