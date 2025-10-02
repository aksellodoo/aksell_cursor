
-- 1) Tabela de nomes de grupos de clientes (se não existir)
CREATE TABLE IF NOT EXISTS public.protheus_customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protheus_table_id uuid NOT NULL,
  filial text NOT NULL,
  cod text NOT NULL,
  name text,
  ai_suggested_name text,
  name_source text,
  unit_count integer,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protheus_customer_groups_uniq UNIQUE (protheus_table_id, filial, cod)
);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_protheus_customer_groups_updated_at'
  ) THEN
    CREATE TRIGGER tg_protheus_customer_groups_updated_at
    BEFORE UPDATE ON public.protheus_customer_groups
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END$$;

-- 2) RLS e políticas
ALTER TABLE public.protheus_customer_groups ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer usuário autenticado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'protheus_customer_groups' AND policyname = 'Groups selectable by authenticated users'
  ) THEN
    CREATE POLICY "Groups selectable by authenticated users"
      ON public.protheus_customer_groups
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- INSERT/UPDATE/DELETE: admin ou diretor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'protheus_customer_groups' AND policyname = 'Admins/directors can manage groups'
  ) THEN
    CREATE POLICY "Admins/directors can manage groups"
      ON public.protheus_customer_groups
      FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director')));
  END IF;
END$$;

-- 3) Função para semear grupos (uma entrada por (filial, cod) que ainda não tem)
CREATE OR REPLACE FUNCTION public.seed_protheus_customer_groups(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table text;
  v_inserted int := 0;
BEGIN
  -- Descobrir tabela dinâmica correspondente
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Inserir entradas que não existem ainda em protheus_customer_groups
  WITH base AS (
    SELECT 
      a1_filial::text AS filial,
      a1_cod::text    AS cod,
      COUNT(*)::int   AS unit_count,
      ARRAY_AGG(DISTINCT a1_nreduz::text) AS short_names,
      ARRAY_AGG(DISTINCT a1_nome::text)   AS names
    FROM format('%I', v_table)::regclass
    -- Usamos EXECUTE separado abaixo; CTE aqui é apenas estrutura.
  ), to_upsert AS (
    -- Precisamos materializar base com EXECUTE dinâmico
    SELECT * FROM (
      EXECUTE format($q$
        SELECT 
          a1_filial::text AS filial,
          a1_cod::text    AS cod,
          COUNT(*)::int   AS unit_count,
          ARRAY_AGG(DISTINCT a1_nreduz::text) AS short_names,
          ARRAY_AGG(DISTINCT a1_nome::text)   AS names
        FROM %I
        GROUP BY 1,2
      $q$, v_table)
    ) AS t(filial text, cod text, unit_count int, short_names text[], names text[])
  )
  INSERT INTO public.protheus_customer_groups (
    protheus_table_id, filial, cod, unit_count, ai_suggested_name, name_source
  )
  SELECT 
    p_table_id,
    t.filial,
    t.cod,
    t.unit_count,
    COALESCE(
      (SELECT n FROM unnest(t.short_names) AS n WHERE n IS NOT NULL AND btrim(n) <> '' ORDER BY length(n) ASC LIMIT 1),
      (SELECT n FROM unnest(t.names)       AS n WHERE n IS NOT NULL AND btrim(n) <> '' ORDER BY length(n) ASC LIMIT 1)
    ) AS ai_suggested_name,
    'baseline'::text
  FROM to_upsert t
  LEFT JOIN public.protheus_customer_groups g
    ON g.protheus_table_id = p_table_id
   AND g.filial = t.filial
   AND g.cod    = t.cod
  WHERE g.id IS NULL
  RETURNING 1;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object(
    'status', 'ok',
    'inserted_count', v_inserted
  );
END;
$$;

-- Observação: get_protheus_client_groups já existe no seu projeto e usa protheus_customer_groups
-- para compor display_name. Portanto, ao semear, os nomes “sugeridos” passam a aparecer.

