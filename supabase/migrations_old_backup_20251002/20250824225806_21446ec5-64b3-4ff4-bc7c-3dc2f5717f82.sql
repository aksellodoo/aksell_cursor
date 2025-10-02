
-- 1) Enum de status das pastas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'folder_status') THEN
    CREATE TYPE public.folder_status AS ENUM ('active', 'archived');
  END IF;
END$$;

-- 2) Tabela folders
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  parent_folder_id UUID NULL REFERENCES public.folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status public.folder_status NOT NULL DEFAULT 'active',
  is_root BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_folders_department ON public.folders(department_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_folder_id);

-- Garantir apenas 1 pasta raiz por departamento
CREATE UNIQUE INDEX IF NOT EXISTS uniq_folders_root_per_department
ON public.folders(department_id)
WHERE is_root = true;

-- 3) Tabela documents (genérica para contar por pasta)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NULL,
  file_size INTEGER NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_department ON public.documents(department_id);

-- 4) Alterar tabela departments (colunas de gestão de documentos)
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS document_root_enabled BOOLEAN NOT NULL DEFAULT false;

-- Primeiro adiciona coluna sem FK (em alguns casos, a FK falha se a ordem for trocada)
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS document_root_folder_id UUID NULL;

-- Agora adiciona a FK apontando para folders.id (idempotente com verificação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'departments_document_root_folder_id_fkey'
  ) THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT departments_document_root_folder_id_fkey
      FOREIGN KEY (document_root_folder_id)
      REFERENCES public.folders(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 5) Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6) Trigger em folders para updated_at
DROP TRIGGER IF EXISTS set_timestamp_on_folders ON public.folders;
CREATE TRIGGER set_timestamp_on_folders
BEFORE UPDATE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) RLS & Policies

-- folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- SELECT: membros do mesmo departamento OU admin/director/hr
DROP POLICY IF EXISTS "Folders selectable by dept members or admins" ON public.folders;
CREATE POLICY "Folders selectable by dept members or admins"
  ON public.folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin','director','hr')
          OR p.department_id = folders.department_id
        )
    )
  );

-- INSERT/UPDATE/DELETE: admin/director/hr
DROP POLICY IF EXISTS "Folders managed by admins" ON public.folders;
CREATE POLICY "Folders managed by admins"
  ON public.folders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','director','hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','director','hr')
    )
  );

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT: membros do mesmo departamento OU admin/director/hr
DROP POLICY IF EXISTS "Documents selectable by dept members or admins" ON public.documents;
CREATE POLICY "Documents selectable by dept members or admins"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin','director','hr')
          OR p.department_id = documents.department_id
        )
    )
  );

-- INSERT/UPDATE/DELETE: admin/director/hr
DROP POLICY IF EXISTS "Documents managed by admins" ON public.documents;
CREATE POLICY "Documents managed by admins"
  ON public.documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','director','hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','director','hr')
    )
  );

-- 8) View para contagem de documentos por pasta (usada na UI)
DROP VIEW IF EXISTS public.folder_document_counts;
CREATE VIEW public.folder_document_counts AS
SELECT
  d.folder_id,
  COUNT(*)::bigint AS doc_count
FROM public.documents d
GROUP BY d.folder_id;
