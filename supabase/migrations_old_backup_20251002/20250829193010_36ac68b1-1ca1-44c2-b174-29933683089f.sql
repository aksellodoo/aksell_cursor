
-- Adiciona campos para vendedor designado no cadastro de leads
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS assigned_vendor_cod TEXT,
  ADD COLUMN IF NOT EXISTS assigned_vendor_filial TEXT;

-- Índice para facilitar filtros por vendedor designado
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_vendor
  ON public.sales_leads (assigned_vendor_cod, assigned_vendor_filial);
