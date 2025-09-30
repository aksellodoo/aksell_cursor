
-- 1) Tabela auxiliar para nomes de grupos de clientes (sem tocar na tabela Protheus)
CREATE TABLE IF NOT EXISTS public.protheus_customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protheus_table_id UUID NOT NULL REFERENCES public.protheus_tables(id) ON DELETE CASCADE,
  filial TEXT NOT NULL,              -- mapeia a1_filial
  cod TEXT NOT NULL,                 -- mapeia a1_cod
  group_key TEXT GENERATED ALWAYS AS (filial || '|' || cod) STORED,
  name TEXT,                         -- nome definido manualmente (tem prioridade)
  ai_suggested_name TEXT,            -- nome sugerido por IA
  name_source TEXT NOT NULL DEFAULT 'ai', -- 'ai' ou 'manual'
  unit_count INTEGER NOT NULL DEFAULT 0,  -- cache opcional da quantidade de unidades
  vendors TEXT[] NULL,               -- códigos de vendedores agregados (opcional)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_protheus_group UNIQUE (protheus_table_id, filial, cod)
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_protheus_customer_groups_table ON public.protheus_customer_groups(protheus_table_id);
CREATE INDEX IF NOT EXISTS idx_protheus_customer_groups_group_key ON public.protheus_customer_groups(group_key);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'tg_protheus_customer_groups_set_updated_at'
  ) THEN
    CREATE TRIGGER tg_protheus_customer_groups_set_updated_at
    BEFORE UPDATE ON public.protheus_customer_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END$$;

-- RLS
ALTER TABLE public.protheus_customer_groups ENABLE ROW LEVEL SECURITY;

-- Leitura liberada para autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_customer_groups' 
      AND policyname='Customer groups viewable by authenticated users'
  ) THEN
    CREATE POLICY "Customer groups viewable by authenticated users"
      ON public.protheus_customer_groups
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Inserir/editar/apagar restrito a admin/diretor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_customer_groups' 
      AND policyname='Admins/directors can insert customer groups'
  ) THEN
    CREATE POLICY "Admins/directors can insert customer groups"
      ON public.protheus_customer_groups
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_customer_groups' 
      AND policyname='Admins/directors can update customer groups'
  ) THEN
    CREATE POLICY "Admins/directors can update customer groups"
      ON public.protheus_customer_groups
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
    WHERE schemaname='public' AND tablename='protheus_customer_groups' 
      AND policyname='Admins/directors can delete customer groups'
  ) THEN
    CREATE POLICY "Admins/directors can delete customer groups"
      ON public.protheus_customer_groups
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','director')
      ));
  END IF;
END$$;

-- 2) Função para listar agrupamentos (server-side), juntando com a tabela auxiliar
-- Observação: assume campos SA1010 com nomes padronizados (a1_filial, a1_cod, a1_nome, a1_vend)
CREATE OR REPLACE FUNCTION public.get_protheus_client_groups(p_table_id UUID)
RETURNS TABLE (
  group_id UUID,
  a1_filial TEXT,
  a1_cod TEXT,
  display_name TEXT,
  unit_count INTEGER,
  vendors TEXT[]
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
        a1_filial::text AS a1_filial,
        a1_cod::text    AS a1_cod,
        COUNT(*)::int   AS unit_count,
        ARRAY_AGG(DISTINCT a1_nome::text) AS nomes,
        ARRAY_AGG(DISTINCT a1_vend::text) AS vendors
      FROM %I
      GROUP BY 1,2
    )
    SELECT 
      pg.id AS group_id,
      g.a1_filial,
      g.a1_cod,
      COALESCE(
        pg.name,
        pg.ai_suggested_name,
        -- Fallback: menor nome entre as unidades (tende a ser a marca/razão sintética)
        (SELECT n FROM unnest(g.nomes) AS n ORDER BY length(n) ASC LIMIT 1)
      ) AS display_name,
      g.unit_count,
      g.vendors
    FROM g
    LEFT JOIN public.protheus_customer_groups pg
      ON pg.protheus_table_id = %L::uuid
     AND pg.filial = g.a1_filial
     AND pg.cod    = g.a1_cod
    ORDER BY display_name NULLS LAST, g.a1_cod, g.a1_filial
  $q$, v_table, p_table_id);
END;
$$;

-- Permissão de execução (opcional, a função é SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.get_protheus_client_groups(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_protheus_client_groups(UUID) TO anon, authenticated, service_role;
