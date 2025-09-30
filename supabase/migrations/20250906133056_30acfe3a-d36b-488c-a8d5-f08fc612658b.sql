
-- 1) Adicionar campos Protheus ao grupo econômico de compras
ALTER TABLE public.purchases_economic_groups
  ADD COLUMN IF NOT EXISTS protheus_filial text,
  ADD COLUMN IF NOT EXISTS protheus_cod text;

-- (Opcional) Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_purchases_groups_protheus_filial ON public.purchases_economic_groups (protheus_filial);
CREATE INDEX IF NOT EXISTS idx_purchases_groups_protheus_cod ON public.purchases_economic_groups (protheus_cod);

-- 2) Atualizar RPC de atualização de detalhes do grupo para aceitar filial/código do Protheus
CREATE OR REPLACE FUNCTION public.update_purchases_group_details(
  p_id_grupo integer,
  p_name text,
  p_assigned_buyer_cod text,
  p_assigned_buyer_filial text,
  p_protheus_filial text,
  p_protheus_cod text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.purchases_economic_groups
     SET name                  = COALESCE(p_name, name),
         assigned_buyer_cod    = NULLIF(btrim(p_assigned_buyer_cod), ''),
         assigned_buyer_filial = NULLIF(btrim(p_assigned_buyer_filial), ''),
         protheus_filial       = NULLIF(btrim(p_protheus_filial), ''),
         protheus_cod          = NULLIF(btrim(p_protheus_cod), ''),
         updated_at            = now()
   WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$function$;

-- 3) Atualizar a RPC de listagem de grupos para retornar os novos campos
DROP FUNCTION IF EXISTS public.get_purchases_economic_groups();
CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups()
RETURNS TABLE(
  id_grupo integer, 
  code text, 
  name text, 
  member_count integer,
  assigned_buyer_cod text,
  assigned_buyer_filial text,
  protheus_filial text,
  protheus_cod text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    g.id_grupo,
    g.code,
    COALESCE(g.name, g.ai_suggested_name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0')) AS name,
    COALESCE((
      SELECT COUNT(*) FROM public.purchases_economic_group_members m
      WHERE m.group_id = g.id_grupo
    ), 0)::int AS member_count,
    g.assigned_buyer_cod,
    g.assigned_buyer_filial,
    g.protheus_filial,
    g.protheus_cod
  FROM public.purchases_economic_groups g
  ORDER BY g.id_grupo;
END;
$function$;

-- 4) Criar a tabela de Tipos de Materiais por Grupo Econômico de Compras
-- (diferente da tabela usada para grupos do Protheus)
CREATE TABLE IF NOT EXISTS public.purchases_economic_group_material_types (
  group_id integer NOT NULL REFERENCES public.purchases_economic_groups(id_grupo) ON DELETE CASCADE,
  material_type_id uuid NOT NULL REFERENCES public.purchases_material_types(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchases_economic_group_material_types_pkey PRIMARY KEY (group_id, material_type_id)
);

-- Habilitar RLS
ALTER TABLE public.purchases_economic_group_material_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'purchases_economic_group_material_types'
      AND policyname = 'PEGMT viewable by authenticated'
  ) THEN
    CREATE POLICY "PEGMT viewable by authenticated"
    ON public.purchases_economic_group_material_types
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'purchases_economic_group_material_types'
      AND policyname = 'PEGMT insert by owner or admins'
  ) THEN
    CREATE POLICY "PEGMT insert by owner or admins"
    ON public.purchases_economic_group_material_types
    FOR INSERT
    TO authenticated
    WITH CHECK (
      created_by = auth.uid() OR EXISTS(
        SELECT 1 FROM public.profiles p 
         WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'purchases_economic_group_material_types'
      AND policyname = 'PEGMT delete by owner or admins'
  ) THEN
    CREATE POLICY "PEGMT delete by owner or admins"
    ON public.purchases_economic_group_material_types
    FOR DELETE
    TO authenticated
    USING (
      created_by = auth.uid() OR EXISTS(
        SELECT 1 FROM public.profiles p 
         WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      )
    );
  END IF;
END$$;

-- Trigger para setar created_by (reaproveita função já existente)
DROP TRIGGER IF EXISTS tg_pegmt_set_created_by ON public.purchases_economic_group_material_types;
CREATE TRIGGER tg_pegmt_set_created_by
BEFORE INSERT ON public.purchases_economic_group_material_types
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_default();

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_pegmt_group ON public.purchases_economic_group_material_types(group_id);
CREATE INDEX IF NOT EXISTS idx_pegmt_material_type ON public.purchases_economic_group_material_types(material_type_id);

-- 5) RPC para aplicar tipos selecionados a todos os membros do grupo
CREATE OR REPLACE FUNCTION public.apply_material_types_to_purchases_group_members(
  p_id_grupo integer,
  p_material_type_ids uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_inserted integer := 0;
BEGIN
  -- Insere (supplier_id, material_type_id) para todos os membros do grupo; ignora duplicados
  INSERT INTO public.purchases_unified_supplier_material_types (supplier_id, material_type_id, created_by)
  SELECT DISTINCT
    m.unified_supplier_id,
    mt_id,
    auth.uid()
  FROM public.purchases_economic_group_members m
  CROSS JOIN UNNEST(p_material_type_ids) AS mt_id
  WHERE m.group_id = p_id_grupo
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'applied_to_members', v_inserted
  );
END;
$function$;
