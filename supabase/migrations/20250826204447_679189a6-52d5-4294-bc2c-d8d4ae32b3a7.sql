
-- 1) Tabela auxiliar (não altera dados do Protheus)
CREATE TABLE IF NOT EXISTS public.protheus_supplier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protheus_table_id UUID NOT NULL REFERENCES public.protheus_tables(id) ON DELETE CASCADE,
  filial TEXT NOT NULL,                 -- mapeia a2_filial
  cod TEXT NOT NULL,                    -- mapeia a2_cod
  group_key TEXT GENERATED ALWAYS AS (filial || '|' || cod) STORED,
  name TEXT,                            -- nome definido manualmente (tem prioridade)
  ai_suggested_name TEXT,               -- nome sugerido por IA (opcional)
  name_source TEXT NOT NULL DEFAULT 'ai', -- 'ai' ou 'manual'
  unit_count INTEGER NOT NULL DEFAULT 0,  -- cache opcional de unidades
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_protheus_supplier_group UNIQUE (protheus_table_id, filial, cod)
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_protheus_supplier_groups_table ON public.protheus_supplier_groups(protheus_table_id);
CREATE INDEX IF NOT EXISTS idx_protheus_supplier_groups_group_key ON public.protheus_supplier_groups(group_key);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'tg_protheus_supplier_groups_set_updated_at'
  ) THEN
    CREATE TRIGGER tg_protheus_supplier_groups_set_updated_at
    BEFORE UPDATE ON public.protheus_supplier_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END$$;

-- RLS
ALTER TABLE public.protheus_supplier_groups ENABLE ROW LEVEL SECURITY;

-- Leitura liberada para autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_supplier_groups' 
      AND policyname='Supplier groups viewable by authenticated users'
  ) THEN
    CREATE POLICY "Supplier groups viewable by authenticated users"
      ON public.protheus_supplier_groups
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Inserir/editar/apagar restrito a admin/diretor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_supplier_groups' 
      AND policyname='Admins/directors can insert supplier groups'
  ) THEN
    CREATE POLICY "Admins/directors can insert supplier groups"
      ON public.protheus_supplier_groups
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_supplier_groups' 
      AND policyname='Admins/directors can update supplier groups'
  ) THEN
    CREATE POLICY "Admins/directors can update supplier groups"
      ON public.protheus_supplier_groups
      FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_supplier_groups' 
      AND policyname='Admins/directors can delete supplier groups'
  ) THEN
    CREATE POLICY "Admins/directors can delete supplier groups"
      ON public.protheus_supplier_groups
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;
END$$;

-- 2) RPC: listar agrupamentos de fornecedores (SA2010)
CREATE OR REPLACE FUNCTION public.get_protheus_supplier_groups(p_table_id UUID)
RETURNS TABLE (
  group_id UUID,
  a2_filial TEXT,
  a2_cod TEXT,
  display_name TEXT,
  unit_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH g AS (
      SELECT 
        a2_filial::text AS a2_filial,
        a2_cod::text    AS a2_cod,
        COUNT(*)::int   AS unit_count,
        ARRAY_AGG(DISTINCT a2_nome::text) AS nomes,
        ARRAY_AGG(DISTINCT a2_nreduz::text) AS short_names
      FROM %I
      GROUP BY 1,2
    )
    SELECT 
      pg.id AS group_id,
      g.a2_filial,
      g.a2_cod,
      COALESCE(
        pg.name,
        pg.ai_suggested_name,
        -- Fallback: menor nome entre as unidades (tende a ser a marca/razão sintética)
        (SELECT n FROM unnest(COALESCE(short_names, nomes)) AS n ORDER BY length(n) ASC LIMIT 1)
      ) AS display_name,
      g.unit_count
    FROM g
    LEFT JOIN public.protheus_supplier_groups pg
      ON pg.protheus_table_id = %L::uuid
     AND pg.filial = g.a2_filial
     AND pg.cod    = g.a2_cod
    ORDER BY display_name NULLS LAST, g.a2_cod, g.a2_filial
  $q$, v_table, p_table_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_protheus_supplier_groups(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_protheus_supplier_groups(UUID) TO anon, authenticated, service_role;

-- 3) RPC: listar unidades de um agrupamento (detalhe)
CREATE OR REPLACE FUNCTION public.get_protheus_supplier_group_unit_names(
  p_table_id uuid,
  p_filial text,
  p_cod text
)
RETURNS TABLE(
  unit_name text,
  short_name text,
  loja text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      a2_nome::text   AS unit_name,
      a2_nreduz::text AS short_name,
      a2_loja::text   AS loja
    FROM %I
    WHERE a2_filial::text = %L
      AND a2_cod::text    = %L
    ORDER BY a2_loja::text
  $q$, v_table, p_filial, p_cod);
END;
$$;

REVOKE ALL ON FUNCTION public.get_protheus_supplier_group_unit_names(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_protheus_supplier_group_unit_names(UUID, TEXT, TEXT) TO anon, authenticated, service_role;
