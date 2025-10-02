
-- 1) Novas colunas em purchases_unified_suppliers
ALTER TABLE public.purchases_unified_suppliers
  ADD COLUMN IF NOT EXISTS attendance_type text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS representative_id uuid NULL,
  ADD COLUMN IF NOT EXISTS assigned_buyer_cod text NULL,
  ADD COLUMN IF NOT EXISTS assigned_buyer_filial text NULL;

-- Restringe os valores permitidos para attendance_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchases_unified_suppliers_attendance_type_chk'
  ) THEN
    ALTER TABLE public.purchases_unified_suppliers
      ADD CONSTRAINT purchases_unified_suppliers_attendance_type_chk
      CHECK (attendance_type IN ('direct','representative'));
  END IF;
END$$;

-- FK opcional para representante comercial
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchases_unified_suppliers_representative_id_fkey'
  ) THEN
    ALTER TABLE public.purchases_unified_suppliers
      ADD CONSTRAINT purchases_unified_suppliers_representative_id_fkey
      FOREIGN KEY (representative_id)
      REFERENCES public.commercial_representatives(id)
      ON UPDATE RESTRICT
      ON DELETE SET NULL;
  END IF;
END$$;

-- 2) Validação: representante obrigatório quando attendance_type='representative'
CREATE OR REPLACE FUNCTION public.purchases_unified_suppliers_validate_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.attendance_type = 'representative' THEN
    IF NEW.representative_id IS NULL THEN
      RAISE EXCEPTION 'representative_id is required when attendance_type = representative';
    END IF;
  ELSE
    -- Para atendimento direto, garantimos representative_id nulo
    NEW.representative_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_attendance ON public.purchases_unified_suppliers;
CREATE TRIGGER trg_validate_attendance
BEFORE INSERT OR UPDATE ON public.purchases_unified_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.purchases_unified_suppliers_validate_attendance();

-- 3) Tabela de tags para fornecedores unificados
CREATE TABLE IF NOT EXISTS public.purchases_unified_supplier_tags (
  supplier_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (supplier_id, tag_id),
  CONSTRAINT purchases_unified_supplier_tags_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES public.purchases_unified_suppliers(id) ON DELETE CASCADE,
  CONSTRAINT purchases_unified_supplier_tags_tag_id_fkey
    FOREIGN KEY (tag_id) REFERENCES public.email_tags(id) ON DELETE CASCADE
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_pu_supplier_tags_supplier_id ON public.purchases_unified_supplier_tags (supplier_id);
CREATE INDEX IF NOT EXISTS idx_pu_supplier_tags_tag_id ON public.purchases_unified_supplier_tags (tag_id);

-- 4) RLS da tabela de tags
ALTER TABLE public.purchases_unified_supplier_tags ENABLE ROW LEVEL SECURITY;

-- Leitura por usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'purchases_unified_supplier_tags' 
      AND policyname = 'Unified supplier tags viewable by authenticated'
  ) THEN
    CREATE POLICY "Unified supplier tags viewable by authenticated"
      ON public.purchases_unified_supplier_tags
      FOR SELECT
      USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Inserir somente se for o criador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'purchases_unified_supplier_tags' 
      AND policyname = 'Unified supplier tags insert by creator'
  ) THEN
    CREATE POLICY "Unified supplier tags insert by creator"
      ON public.purchases_unified_supplier_tags
      FOR INSERT
      WITH CHECK (created_by = auth.uid());
  END IF;
END$$;

-- Atualizar somente se for o criador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'purchases_unified_supplier_tags' 
      AND policyname = 'Unified supplier tags update by creator'
  ) THEN
    CREATE POLICY "Unified supplier tags update by creator"
      ON public.purchases_unified_supplier_tags
      FOR UPDATE
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END$$;

-- Excluir somente se for o criador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'purchases_unified_supplier_tags' 
      AND policyname = 'Unified supplier tags delete by creator'
  ) THEN
    CREATE POLICY "Unified supplier tags delete by creator"
      ON public.purchases_unified_supplier_tags
      FOR DELETE
      USING (created_by = auth.uid());
  END IF;
END$$;
