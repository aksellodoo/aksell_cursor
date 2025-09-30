
-- 1) Criar o tipo enum (protegendo contra recriação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'lead_source_channel'
  ) THEN
    CREATE TYPE public.lead_source_channel AS ENUM (
      'referral',         -- Indicação
      'website',          -- Site oficial
      'social',           -- Redes sociais
      'organic_search',   -- Google / Pesquisa orgânica (SEO)
      'paid_search',      -- Google Ads / Links patrocinados
      'event',            -- Eventos / Feiras / Palestras
      'outbound',         -- Contato ativo da equipe (prospecção, cold call, cold email)
      'marketplace',      -- Marketplace / Plataforma parceira
      'other'             -- Outro (especificar)
    );
  END IF;
END
$$;

-- 2) Adicionar colunas ao sales_leads (todas opcionais para não quebrar dados existentes)
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS source_channel public.lead_source_channel NULL,
  ADD COLUMN IF NOT EXISTS source_subchannel text NULL,
  ADD COLUMN IF NOT EXISTS referral_name text NULL;

COMMENT ON COLUMN public.sales_leads.source_channel IS 'Canal principal de origem do lead';
COMMENT ON COLUMN public.sales_leads.source_subchannel IS 'Subcanal/detalhe da origem (ex: Instagram, “especifique” para Outro, etc.)';
COMMENT ON COLUMN public.sales_leads.referral_name IS 'Nome de quem indicou (se canal = Indicação)';

-- 3) Função de validação condicional
CREATE OR REPLACE FUNCTION public.sales_leads_validate_source()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se for indicação, exigir nome de quem indicou
  IF NEW.source_channel = 'referral'::public.lead_source_channel THEN
    IF NEW.referral_name IS NULL OR btrim(NEW.referral_name) = '' THEN
      RAISE EXCEPTION 'referral_name is required when source_channel = referral';
    END IF;
  END IF;

  -- Se for "outro", exigir a especificação no subchannel
  IF NEW.source_channel = 'other'::public.lead_source_channel THEN
    IF NEW.source_subchannel IS NULL OR btrim(NEW.source_subchannel) = '' THEN
      RAISE EXCEPTION 'source_subchannel is required when source_channel = other';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Trigger antes de INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_sales_leads_validate_source ON public.sales_leads;

CREATE TRIGGER trg_sales_leads_validate_source
BEFORE INSERT OR UPDATE ON public.sales_leads
FOR EACH ROW
EXECUTE FUNCTION public.sales_leads_validate_source();
