
-- Tabela unificada de Representantes Comerciais (Vendas e Compras)
CREATE TABLE IF NOT EXISTS public.commercial_representatives (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        text NOT NULL,
  company_city        text,
  company_state       text,
  -- Flags de atuação
  is_sales            boolean NOT NULL DEFAULT false,
  is_purchases        boolean NOT NULL DEFAULT false,
  -- Vínculo opcional ao Protheus (SA2010 - Fornecedores)
  is_registered_in_protheus boolean NOT NULL DEFAULT false,
  protheus_table_id   uuid REFERENCES public.protheus_tables(id),
  supplier_filial     text,
  supplier_cod        text,
  supplier_loja       text,
  supplier_key        text GENERATED ALWAYS AS (
    coalesce(supplier_filial,'') || '|' || coalesce(supplier_cod,'') || '|' || coalesce(supplier_loja,'')
  ) STORED,
  notes               text,
  created_by          uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_commercial_reps_company_name ON public.commercial_representatives(company_name);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_city ON public.commercial_representatives(company_city);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_state ON public.commercial_representatives(company_state);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_is_sales ON public.commercial_representatives(is_sales);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_is_purchases ON public.commercial_representatives(is_purchases);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_supplier_key ON public.commercial_representatives(supplier_key);
CREATE INDEX IF NOT EXISTS idx_commercial_reps_created_at ON public.commercial_representatives(created_at);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tg_commercial_reps_set_updated_at'
  ) THEN
    CREATE TRIGGER tg_commercial_reps_set_updated_at
    BEFORE UPDATE ON public.commercial_representatives
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END$$;

-- Validação condicional via trigger
CREATE OR REPLACE FUNCTION public.validate_commercial_rep()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sa2010 uuid := '72a51158-05c5-4e7d-82c6-94f78f7166b3'; -- SA2010_FORNECEDORES
BEGIN
  -- Pelo menos um tipo deve ser marcado
  IF COALESCE(NEW.is_sales,false) = false AND COALESCE(NEW.is_purchases,false) = false THEN
    RAISE EXCEPTION 'Marque pelo menos um tipo: vendas e/ou compras';
  END IF;

  -- Se vinculado ao Protheus, exigir chaves e garantir tabela SA2010
  IF COALESCE(NEW.is_registered_in_protheus,false) = true THEN
    IF NEW.protheus_table_id IS NULL 
       OR NEW.supplier_filial IS NULL 
       OR NEW.supplier_cod IS NULL 
       OR NEW.supplier_loja IS NULL THEN
      RAISE EXCEPTION 'Para reps vinculados ao Protheus, protheus_table_id, filial, cod e loja são obrigatórios';
    END IF;

    IF NEW.protheus_table_id <> v_sa2010 THEN
      RAISE EXCEPTION 'Somente fornecedores (SA2010) podem ser vinculados';
    END IF;
  ELSE
    -- Se não vinculado, limpar chaves para consistência
    NEW.protheus_table_id := NULL;
    NEW.supplier_filial := NULL;
    NEW.supplier_cod := NULL;
    NEW.supplier_loja := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tg_validate_commercial_rep'
  ) THEN
    CREATE TRIGGER tg_validate_commercial_rep
    BEFORE INSERT OR UPDATE ON public.commercial_representatives
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_commercial_rep();
  END IF;
END$$;

-- Habilitar RLS
ALTER TABLE public.commercial_representatives ENABLE ROW LEVEL SECURITY;

-- SELECT: todos autenticados podem ler
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Reps viewable by authenticated users'
  ) THEN
    CREATE POLICY "Reps viewable by authenticated users"
      ON public.commercial_representatives
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- INSERT: admins/diretores ou o próprio criador (created_by = auth.uid())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Admins/directors can insert reps'
  ) THEN
    CREATE POLICY "Admins/directors can insert reps"
      ON public.commercial_representatives
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Creators can insert own reps'
  ) THEN
    CREATE POLICY "Creators can insert own reps"
      ON public.commercial_representatives
      FOR INSERT
      WITH CHECK (created_by = auth.uid());
  END IF;
END$$;

-- UPDATE: admins/diretores ou o próprio criador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Admins/directors can update reps'
  ) THEN
    CREATE POLICY "Admins/directors can update reps"
      ON public.commercial_representatives
      FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Creators can update own reps'
  ) THEN
    CREATE POLICY "Creators can update own reps"
      ON public.commercial_representatives
      FOR UPDATE
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END$$;

-- DELETE: admins/diretores ou o próprio criador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Admins/directors can delete reps'
  ) THEN
    CREATE POLICY "Admins/directors can delete reps"
      ON public.commercial_representatives
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='commercial_representatives' 
      AND policyname='Creators can delete own reps'
  ) THEN
    CREATE POLICY "Creators can delete own reps"
      ON public.commercial_representatives
      FOR DELETE
      USING (created_by = auth.uid());
  END IF;
END$$;
