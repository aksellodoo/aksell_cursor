
-- 1) Tipo enum para o modo de atendimento do lead
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'lead_attendance_type'
  ) THEN
    CREATE TYPE public.lead_attendance_type AS ENUM ('direct', 'representative');
  END IF;
END$$;

-- 2) Adicionar colunas em sales_leads
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS attendance_type public.lead_attendance_type NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS representative_id uuid NULL;

-- 3) FK para commercial_representatives (não usar ON DELETE CASCADE para preservar histórico de lead)
ALTER TABLE public.sales_leads
  ADD CONSTRAINT IF NOT EXISTS sales_leads_representative_fk
  FOREIGN KEY (representative_id) REFERENCES public.commercial_representatives(id) ON DELETE SET NULL;

-- 4) Índice para consultas
CREATE INDEX IF NOT EXISTS idx_sales_leads_representative_id ON public.sales_leads(representative_id);

-- 5) Trigger de validação
CREATE OR REPLACE FUNCTION public.tg_validate_lead_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_sales boolean;
BEGIN
  -- Se for atendimento direto, zera representative_id para consistência
  IF NEW.attendance_type = 'direct' THEN
    NEW.representative_id := NULL;
    RETURN NEW;
  END IF;

  -- Caso seja por representante, representative_id é obrigatório
  IF NEW.attendance_type = 'representative' THEN
    IF NEW.representative_id IS NULL THEN
      RAISE EXCEPTION 'representative_id é obrigatório quando attendance_type = representative';
    END IF;

    -- Verificar se o representante existe e é do tipo vendas
    SELECT is_sales INTO v_is_sales
    FROM public.commercial_representatives
    WHERE id = NEW.representative_id
    LIMIT 1;

    IF v_is_sales IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'O representante informado deve existir e ser do tipo vendas';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_lead_attendance ON public.sales_leads;
CREATE TRIGGER trg_validate_lead_attendance
BEFORE INSERT OR UPDATE ON public.sales_leads
FOR EACH ROW
EXECUTE FUNCTION public.tg_validate_lead_attendance();
