
-- 1) Atualizar a função de validação para exigir vínculo via Lead OU (Filial+Código+Loja), sem protheus_table_id
CREATE OR REPLACE FUNCTION public.validate_unified_account_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Pelo menos um vínculo é obrigatório:
  -- (a) lead_id preenchido, ou
  -- (b) cliente Protheus completo (filial, cod, loja)
  IF NEW.lead_id IS NULL
     AND (NEW.protheus_filial IS NULL OR NEW.protheus_cod IS NULL OR NEW.protheus_loja IS NULL)
  THEN
    RAISE EXCEPTION 'Informe um Lead ou um Cliente do Protheus (filial, código e loja) para criar/atualizar o cliente unificado';
  END IF;

  -- Se algum campo Protheus for informado, exigir todos os três (filial, cod e loja)
  IF NEW.protheus_filial IS NOT NULL
     OR NEW.protheus_cod IS NOT NULL
     OR NEW.protheus_loja IS NOT NULL
  THEN
    IF NEW.protheus_filial IS NULL
       OR NEW.protheus_cod IS NULL
       OR NEW.protheus_loja IS NULL
    THEN
      RAISE EXCEPTION 'Para vincular Cliente do Protheus, preencha filial, código e loja';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Remover a FK (se existir) e a coluna protheus_table_id da tabela unified_accounts
ALTER TABLE public.unified_accounts
  DROP CONSTRAINT IF EXISTS unified_accounts_protheus_table_id_fkey;

ALTER TABLE public.unified_accounts
  DROP COLUMN IF EXISTS protheus_table_id;

-- 3) Garantir que o trigger exista apontando para a função atualizada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.unified_accounts'::regclass
      AND tgname = 'validate_unified_account_links_trg'
  ) THEN
    CREATE TRIGGER validate_unified_account_links_trg
    BEFORE INSERT OR UPDATE ON public.unified_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_unified_account_links();
  END IF;
END $$;
