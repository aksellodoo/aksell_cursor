
-- 1) Tabela de junção entre leads e tags
CREATE TABLE IF NOT EXISTS public.sales_lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.email_tags(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_lead_tags_unique UNIQUE (lead_id, tag_id)
);

-- 2) Ativar RLS
ALTER TABLE public.sales_lead_tags ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Visualizar vínculos das tags de leads de minha autoria
CREATE POLICY "Owners can view their lead-tag links"
  ON public.sales_lead_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.sales_leads l
      WHERE l.id = sales_lead_tags.lead_id
        AND l.created_by = auth.uid()
    )
  );

-- Inserir vínculos apenas para leads de minha autoria
CREATE POLICY "Owners can create lead-tag links"
  ON public.sales_lead_tags
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.sales_leads l
      WHERE l.id = sales_lead_tags.lead_id
        AND l.created_by = auth.uid()
    )
  );

-- Excluir vínculos apenas para leads de minha autoria
CREATE POLICY "Owners can delete their lead-tag links"
  ON public.sales_lead_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sales_leads l
      WHERE l.id = sales_lead_tags.lead_id
        AND l.created_by = auth.uid()
    )
  );

-- (Opcional) Atualização de vínculos — raramente necessária. Mantemos a consistência com as mesmas regras.
CREATE POLICY "Owners can update their lead-tag links"
  ON public.sales_lead_tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sales_leads l
      WHERE l.id = sales_lead_tags.lead_id
        AND l.created_by = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.sales_leads l
      WHERE l.id = sales_lead_tags.lead_id
        AND l.created_by = auth.uid()
    )
  );
