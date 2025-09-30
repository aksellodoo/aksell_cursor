
-- 1) Renomear a coluna company_name -> trade_name
ALTER TABLE public.sales_leads
RENAME COLUMN company_name TO trade_name;

-- 2) Adicionar colunas opcionais para razão social e CNPJ
ALTER TABLE public.sales_leads
ADD COLUMN IF NOT EXISTS legal_name text NULL,
ADD COLUMN IF NOT EXISTS cnpj text NULL;

-- 3) Função de trigger para normalizar CNPJ (remover tudo que não é dígito)
CREATE OR REPLACE FUNCTION public.tg_normalize_cnpj()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    NEW.cnpj := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Trigger para inserir/atualizar normalizando CNPJ
DROP TRIGGER IF EXISTS normalize_cnpj_on_sales_leads ON public.sales_leads;

CREATE TRIGGER normalize_cnpj_on_sales_leads
BEFORE INSERT OR UPDATE ON public.sales_leads
FOR EACH ROW
EXECUTE FUNCTION public.tg_normalize_cnpj();

-- 5) Índices úteis
-- Index para busca por nome fantasia case-insensitive
CREATE INDEX IF NOT EXISTS idx_sales_leads_trade_name_lower
ON public.sales_leads (lower(trade_name));

-- Index simples para CNPJ (consultas/uniqueness futuras)
CREATE INDEX IF NOT EXISTS idx_sales_leads_cnpj
ON public.sales_leads (cnpj);
