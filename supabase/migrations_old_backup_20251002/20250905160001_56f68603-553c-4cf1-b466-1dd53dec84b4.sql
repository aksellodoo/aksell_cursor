
-- 1) Adicionar campos para Comprador Designado no tipo de material
ALTER TABLE public.purchases_material_types
  ADD COLUMN IF NOT EXISTS designated_buyer_code   text,
  ADD COLUMN IF NOT EXISTS designated_buyer_filial text;

-- 2) Criar tabela de fila de compradores por tipo de material
CREATE TABLE IF NOT EXISTS public.purchases_material_type_buyer_queue (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type_id uuid NOT NULL REFERENCES public.purchases_material_types(id) ON DELETE CASCADE,
  buyer_code       text NOT NULL,
  buyer_filial     text NOT NULL,
  order_index      integer NOT NULL DEFAULT 0,
  created_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 3) RLS
ALTER TABLE public.purchases_material_type_buyer_queue ENABLE ROW LEVEL SECURITY;

-- Helper: condição de admin/diretor
-- Usaremos esta expressão dentro das políticas:
-- EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))

-- SELECT: autenticados podem ver
DROP POLICY IF EXISTS "Queue viewable by authenticated" ON public.purchases_material_type_buyer_queue;
CREATE POLICY "Queue viewable by authenticated"
  ON public.purchases_material_type_buyer_queue
  FOR SELECT
  USING (true);

-- INSERT: criador, dono do tipo de material, ou admins/diretores
DROP POLICY IF EXISTS "Queue insert by owner/type-owner/admins" ON public.purchases_material_type_buyer_queue;
CREATE POLICY "Queue insert by owner/type-owner/admins"
  ON public.purchases_material_type_buyer_queue
  FOR INSERT
  WITH CHECK (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.purchases_material_types mt
      WHERE mt.id = material_type_id
        AND mt.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','director')
    )
  );

-- UPDATE: criador, dono do tipo de material, ou admins/diretores
DROP POLICY IF EXISTS "Queue update by owner/type-owner/admins" ON public.purchases_material_type_buyer_queue;
CREATE POLICY "Queue update by owner/type-owner/admins"
  ON public.purchases_material_type_buyer_queue
  FOR UPDATE
  USING (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.purchases_material_types mt
      WHERE mt.id = material_type_id
        AND mt.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','director')
    )
  )
  WITH CHECK (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.purchases_material_types mt
      WHERE mt.id = material_type_id
        AND mt.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','director')
    )
  );

-- DELETE: criador, dono do tipo de material, ou admins/diretores
DROP POLICY IF EXISTS "Queue delete by owner/type-owner/admins" ON public.purchases_material_type_buyer_queue;
CREATE POLICY "Queue delete by owner/type-owner/admins"
  ON public.purchases_material_type_buyer_queue
  FOR DELETE
  USING (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.purchases_material_types mt
      WHERE mt.id = material_type_id
        AND mt.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','director')
    )
  );

-- 4) Triggers de auditoria
DROP TRIGGER IF EXISTS set_created_by_default ON public.purchases_material_type_buyer_queue;
CREATE TRIGGER set_created_by_default
  BEFORE INSERT ON public.purchases_material_type_buyer_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_default();

DROP TRIGGER IF EXISTS set_current_timestamp_updated_at ON public.purchases_material_type_buyer_queue;
CREATE TRIGGER set_current_timestamp_updated_at
  BEFORE UPDATE ON public.purchases_material_type_buyer_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5) Índices e restrições para evitar duplicatas e manter ordenação correta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'idx_mtype_queue_material_order'
  ) THEN
    CREATE INDEX idx_mtype_queue_material_order
      ON public.purchases_material_type_buyer_queue(material_type_id, order_index);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_mtype_queue_material_buyer'
  ) THEN
    ALTER TABLE public.purchases_material_type_buyer_queue
      ADD CONSTRAINT uq_mtype_queue_material_buyer
      UNIQUE (material_type_id, buyer_code, buyer_filial);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_mtype_queue_material_order'
  ) THEN
    ALTER TABLE public.purchases_material_type_buyer_queue
      ADD CONSTRAINT uq_mtype_queue_material_order
      UNIQUE (material_type_id, order_index);
  END IF;
END $$;
