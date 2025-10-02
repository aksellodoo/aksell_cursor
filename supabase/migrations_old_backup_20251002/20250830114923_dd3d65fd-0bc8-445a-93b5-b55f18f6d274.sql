
-- 1) Remover colunas solicitadas
ALTER TABLE public.unified_accounts
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS cnpj,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS uf,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS vendor;

-- 2) Criar sequência e coluna numérica sequencial para o cliente unificado
CREATE SEQUENCE IF NOT EXISTS public.unified_accounts_seq START 1;

ALTER TABLE public.unified_accounts
  ADD COLUMN IF NOT EXISTS seq_id bigint NOT NULL DEFAULT nextval('public.unified_accounts_seq');

CREATE UNIQUE INDEX IF NOT EXISTS unified_accounts_seq_id_idx
  ON public.unified_accounts(seq_id);

-- 3) Chaves estrangeiras (vínculos)

-- 3.1) lead_id -> sales_leads(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unified_accounts_lead_id_fkey'
  ) THEN
    ALTER TABLE public.unified_accounts
      ADD CONSTRAINT unified_accounts_lead_id_fkey
      FOREIGN KEY (lead_id)
      REFERENCES public.sales_leads (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3.2) protheus_table_id -> protheus_tables(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unified_accounts_protheus_table_id_fkey'
  ) THEN
    ALTER TABLE public.unified_accounts
      ADD CONSTRAINT unified_accounts_protheus_table_id_fkey
      FOREIGN KEY (protheus_table_id)
      REFERENCES public.protheus_tables (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Trigger para exigir pelo menos um vínculo (lead OU cliente do Protheus completo)
CREATE OR REPLACE FUNCTION public.validate_unified_account_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Pelo menos um vínculo é obrigatório:
  -- (a) lead_id preenchido, ou
  -- (b) cliente Protheus completo (table_id, filial, cod, loja)
  IF NEW.lead_id IS NULL
     AND (NEW.protheus_table_id IS NULL OR NEW.protheus_filial IS NULL OR NEW.protheus_cod IS NULL OR NEW.protheus_loja IS NULL)
  THEN
    RAISE EXCEPTION 'Informe um Lead ou um Cliente do Protheus para criar/atualizar o cliente unificado';
  END IF;

  -- Se algum campo Protheus for informado, exigir todos
  IF NEW.protheus_table_id IS NOT NULL
     OR NEW.protheus_filial IS NOT NULL
     OR NEW.protheus_cod IS NOT NULL
     OR NEW.protheus_loja IS NOT NULL
  THEN
    IF NEW.protheus_table_id IS NULL
       OR NEW.protheus_filial IS NULL
       OR NEW.protheus_cod IS NULL
       OR NEW.protheus_loja IS NULL
    THEN
      RAISE EXCEPTION 'Para vincular Cliente do Protheus, preencha protheus_table_id, protheus_filial, protheus_cod e protheus_loja';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_unified_account_links_trg'
  ) THEN
    CREATE TRIGGER validate_unified_account_links_trg
    BEFORE INSERT OR UPDATE ON public.unified_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_unified_account_links();
  END IF;
END $$;
