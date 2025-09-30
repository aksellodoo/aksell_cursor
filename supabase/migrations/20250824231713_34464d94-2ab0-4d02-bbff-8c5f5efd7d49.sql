
BEGIN;

-- 1) Novo status 'hidden' (idempotente)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.folder_status ADD VALUE IF NOT EXISTS 'hidden';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- 2) Evolução de folders: colunas estruturais (idempotente)
ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acl jsonb NULL,
  ADD COLUMN IF NOT EXISTS path_cache text NULL;

-- FK parent -> folders(id)
DO $$
BEGIN
  ALTER TABLE public.folders
    ADD CONSTRAINT folders_parent_fk
    FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

-- 3) Slugify utilitário (imutável)
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Backfill slug
UPDATE public.folders
SET slug = public.slugify(name)
WHERE slug IS NULL;

-- Garantir slug não vazio
UPDATE public.folders
SET slug = 'folder-' || left(id::text, 8)
WHERE slug IS NULL OR slug = '';

-- Deduplicar slug antes da UNIQUE
WITH dups AS (
  SELECT id, department_id, parent_id, slug,
         ROW_NUMBER() OVER (PARTITION BY department_id, parent_id, slug ORDER BY id) AS rn
  FROM public.folders
)
UPDATE public.folders f
SET slug = f.slug || '-' || (d.rn - 1)
FROM dups d
WHERE f.id = d.id AND d.rn > 1;

-- NOT NULL em slug
ALTER TABLE public.folders
  ALTER COLUMN slug SET NOT NULL;

-- UNIQUE (department_id, parent_id, slug)
DO $$
BEGIN
  ALTER TABLE public.folders
    ADD CONSTRAINT folders_unique_slug_per_parent UNIQUE (department_id, parent_id, slug);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

-- 4) Integridade da árvore: sem self-parent e sem ciclos
DO $$
BEGIN
  ALTER TABLE public.folders
    ADD CONSTRAINT folders_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

CREATE OR REPLACE FUNCTION public.folders_prevent_cycles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  WITH RECURSIVE chain AS (
    SELECT id, parent_id FROM public.folders WHERE id = NEW.parent_id
    UNION ALL
    SELECT f.id, f.parent_id
    FROM public.folders f
    JOIN chain c ON f.id = c.parent_id
  )
  SELECT id INTO v FROM chain WHERE id = NEW.id LIMIT 1;

  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'Operação criaria ciclo na árvore de pastas';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_folders_prevent_cycles ON public.folders;
CREATE TRIGGER trg_folders_prevent_cycles
BEFORE INSERT OR UPDATE OF parent_id ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.folders_prevent_cycles();

-- 5) build_folder_path estável e path_cache
CREATE OR REPLACE FUNCTION public.build_folder_path(p_folder_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
WITH RECURSIVE chain AS (
  SELECT id, parent_id, slug, 1 AS lvl
  FROM public.folders WHERE id = p_folder_id
  UNION ALL
  SELECT f.id, f.parent_id, f.slug, c.lvl + 1
  FROM public.folders f
  JOIN chain c ON f.id = c.parent_id
)
SELECT string_agg(slug, '/' ORDER BY lvl DESC)
FROM chain;
$$;

CREATE OR REPLACE FUNCTION public.refresh_path_cache(p_folder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH RECURSIVE sub AS (
    SELECT id FROM public.folders WHERE id = p_folder_id
    UNION ALL
    SELECT f.id FROM public.folders f
    JOIN sub s ON f.parent_id = s.id
  )
  UPDATE public.folders f
  SET path_cache = public.build_folder_path(f.id)
  FROM sub s
  WHERE f.id = s.id;
END;
$$;

-- Backfill path_cache
UPDATE public.folders f
SET path_cache = public.build_folder_path(f.id)
WHERE path_cache IS NULL;

-- 6) Índices úteis
CREATE INDEX IF NOT EXISTS idx_folders_dept_parent_slug ON public.folders(department_id, parent_id, slug);
CREATE INDEX IF NOT EXISTS idx_folders_dept_parent_order ON public.folders(department_id, parent_id, order_index);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);

-- 7) Documents: colunas e regras de upload
ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS acl_hash text;

CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_id);

CREATE OR REPLACE FUNCTION public.block_insert_on_archived_folder()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  f_status folder_status;
BEGIN
  SELECT status INTO f_status FROM public.folders WHERE id = NEW.folder_id;
  IF f_status IN ('archived','hidden') THEN
    RAISE EXCEPTION 'Uploads não permitidos: a pasta está %.', f_status USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_block_archived ON public.documents;
CREATE TRIGGER trg_documents_block_archived
BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.block_insert_on_archived_folder();

-- 8) ACL/RAG utilitários
ALTER TABLE IF EXISTS public.doc_chunks
  ADD COLUMN IF NOT EXISTS acl_hash text;

CREATE OR REPLACE FUNCTION public.compute_acl_hash(p_department_id uuid, p_folder_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT md5(
    coalesce(p_department_id::text,'') || ':' ||
    coalesce((SELECT acl::text FROM public.folders WHERE id = p_folder_id), '')
  )
$$;

CREATE OR REPLACE FUNCTION public.recompute_acl_hash_for_subtree(p_root_folder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH RECURSIVE sub AS (
    SELECT id FROM public.folders WHERE id = p_root_folder_id
    UNION ALL
    SELECT f.id FROM public.folders f JOIN sub s ON f.parent_id = s.id
  )
  UPDATE public.documents d
     SET acl_hash = public.compute_acl_hash(d.department_id, d.folder_id)
   WHERE d.folder_id IN (SELECT id FROM sub);

  -- doc_chunks é opcional; só atualiza se existir
  IF to_regclass('public.doc_chunks') IS NOT NULL THEN
    UPDATE public.doc_chunks c
       SET acl_hash = public.compute_acl_hash(d.department_id, d.folder_id)
      FROM public.documents d
     WHERE c.document_id = d.id
       AND d.folder_id IN (SELECT id FROM sub);
  END IF;
END;
$$;

-- 9) Triggers automáticos para move/mudar departamento
-- Sincroniza department_id ao mover para outro pai (mesmo antes do AFTER)
CREATE OR REPLACE FUNCTION public.folders_sync_department_on_move()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_dept uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT department_id INTO v_dept FROM public.folders WHERE id = NEW.parent_id;
    IF v_dept IS NOT NULL AND NEW.department_id IS DISTINCT FROM v_dept THEN
      NEW.department_id := v_dept;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_folders_sync_dept_on_move ON public.folders;
CREATE TRIGGER trg_folders_sync_dept_on_move
BEFORE UPDATE OF parent_id ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.folders_sync_department_on_move();

-- AFTER: atualiza path_cache, propaga dept p/ descendentes se mudou, e recalcula ACL hash
CREATE OR REPLACE FUNCTION public.after_folders_update_maint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_path_cache(NEW.id);

    IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
      WITH RECURSIVE sub AS (
        SELECT id FROM public.folders WHERE id = NEW.id
        UNION ALL
        SELECT f.id FROM public.folders f JOIN sub s ON f.parent_id = s.id
      )
      UPDATE public.folders f
      SET department_id = NEW.department_id
      FROM sub s
      WHERE f.id = s.id;

      WITH RECURSIVE sub2 AS (
        SELECT id FROM public.folders WHERE id = NEW.id
        UNION ALL
        SELECT f.id FROM public.folders f JOIN sub2 s ON f.parent_id = s.id
      )
      UPDATE public.documents d
      SET department_id = NEW.department_id
      WHERE d.folder_id IN (SELECT id FROM sub2);
    END IF;

    PERFORM public.recompute_acl_hash_for_subtree(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_folders_after_update_maint ON public.folders;
CREATE TRIGGER trg_folders_after_update_maint
AFTER UPDATE OF parent_id, department_id ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.after_folders_update_maint();

-- 10) Contagem incluindo descendentes (nova view)
DROP VIEW IF EXISTS public.folder_descendant_counts;
CREATE VIEW public.folder_descendant_counts AS
WITH RECURSIVE sub_tree AS (
  SELECT id AS root_id, id
  FROM public.folders
  UNION ALL
  SELECT st.root_id, f.id
  FROM public.folders f
  JOIN sub_tree st ON f.parent_id = st.id
)
SELECT
  st.root_id AS folder_id,
  COUNT(d.id)::bigint AS doc_count
FROM sub_tree st
LEFT JOIN public.documents d ON d.folder_id = st.id
GROUP BY st.root_id;

-- 11) RLS para doc_chunks: somente backend (se existir)
DO $$
BEGIN
  IF to_regclass('public.doc_chunks') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.doc_chunks ENABLE ROW LEVEL SECURITY';
    -- Remover política padrão (se existir e tiver esse nome)
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "doc_chunks read" ON public.doc_chunks';
    EXCEPTION WHEN others THEN
      NULL;
    END;
    -- Policies restritas ao service_role
    BEGIN
      EXECUTE 'CREATE POLICY "doc_chunks service read" ON public.doc_chunks FOR SELECT TO service_role USING (true)';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      EXECUTE 'CREATE POLICY "doc_chunks service insert" ON public.doc_chunks FOR INSERT TO service_role WITH CHECK (true)';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END$$;

COMMIT;
