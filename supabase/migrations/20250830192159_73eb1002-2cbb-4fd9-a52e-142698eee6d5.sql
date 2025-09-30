
-- 1) Tabela de relacionamento N:N entre unified_accounts e site_product_segments
CREATE TABLE IF NOT EXISTS public.unified_account_segments_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.unified_accounts(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES public.site_product_segments(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unified_account_segments_unique UNIQUE (account_id, segment_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_uas_map_account ON public.unified_account_segments_map (account_id);
CREATE INDEX IF NOT EXISTS idx_uas_map_segment ON public.unified_account_segments_map (segment_id);

-- 2) Habilitar RLS
ALTER TABLE public.unified_account_segments_map ENABLE ROW LEVEL SECURITY;

-- 3) Políticas RLS
-- Leitura: qualquer usuário autenticado pode ler
CREATE POLICY IF NOT EXISTS "UAS segments viewable by authenticated users"
  ON public.unified_account_segments_map
  FOR SELECT
  USING (true);

-- Inserção: criador do vínculo ou admins/diretores
CREATE POLICY IF NOT EXISTS "UAS segments insert by creator or admins"
  ON public.unified_account_segments_map
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- Update (não é comum, mas permitimos para consistência): dono ou admins/diretores
CREATE POLICY IF NOT EXISTS "UAS segments update by owner or admins"
  ON public.unified_account_segments_map
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- Delete: dono ou admins/diretores
CREATE POLICY IF NOT EXISTS "UAS segments delete by owner or admins"
  ON public.unified_account_segments_map
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );
