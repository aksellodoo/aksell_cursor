
-- 1) Adicionar coluna de vínculo de Grupo Econômico ao lead
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS economic_group_id integer;

-- 2) Criar índice para consultas por grupo
CREATE INDEX IF NOT EXISTS sales_leads_economic_group_id_idx
  ON public.sales_leads (economic_group_id);

-- 3) Adicionar a foreign key para protheus_customer_groups.id_grupo (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_leads_economic_group_id_fkey'
  ) THEN
    ALTER TABLE public.sales_leads
      ADD CONSTRAINT sales_leads_economic_group_id_fkey
      FOREIGN KEY (economic_group_id)
      REFERENCES public.protheus_customer_groups (id_grupo)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;

-- Observações:
-- - Mantemos economic_group_id como NULL para não quebrar dados existentes.
-- - No frontend, trataremos o campo como obrigatório ao salvar um novo lead.
