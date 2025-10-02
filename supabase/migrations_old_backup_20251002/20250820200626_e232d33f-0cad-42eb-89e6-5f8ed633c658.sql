
-- 1) Garante colunas e índice de soft delete na tabela dinâmica
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_columns(p_table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RAISE EXCEPTION 'table_name é obrigatório';
  END IF;

  EXECUTE format('ALTER TABLE IF EXISTS public.%I ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false;', p_table_name);
  EXECUTE format('ALTER TABLE IF EXISTS public.%I ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;', p_table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_pending_deletion ON public.%I (pending_deletion);', p_table_name, p_table_name);
END;
$$;

-- 2) Faz backfill de exclusões a partir de protheus_sync_deletions
CREATE OR REPLACE FUNCTION public.backfill_soft_deletions_for_table(p_table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RETURN 0;
  END IF;

  EXECUTE format(
    'WITH d AS (
       SELECT protheus_id, created_at
       FROM public.protheus_sync_deletions
       WHERE supabase_table_name = %L
     )
     UPDATE public.%I t
     SET pending_deletion = TRUE,
         pending_deletion_at = COALESCE(t.pending_deletion_at, d.created_at)
     FROM d
     WHERE t.protheus_id = d.protheus_id
       AND (t.pending_deletion IS DISTINCT FROM TRUE);',
    p_table_name, p_table_name
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3) Função “one-shot” por tabela (usada pelo botão)
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_for_table_by_id(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table_name text;
  v_backfilled integer := 0;
  v_user_role text;
BEGIN
  -- Permitir apenas admins/diretores
  SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();
  IF v_user_role IS NULL OR v_user_role NOT IN ('admin','director') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Resolver nome da tabela dinâmica
  SELECT supabase_table_name
    INTO v_table_name
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id;

  IF v_table_name IS NULL OR btrim(v_table_name) = '' THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para o id %', p_table_id;
  END IF;

  -- Garantir colunas + índice e fazer backfill
  PERFORM public.ensure_soft_delete_columns(v_table_name);
  v_backfilled := public.backfill_soft_deletions_for_table(v_table_name);

  RETURN json_build_object(
    'success', true,
    'table', v_table_name,
    'backfilled', v_backfilled
  );
END;
$$;

-- Permissões: expor apenas a função "de alto nível" para usuários autenticados
REVOKE ALL ON FUNCTION public.ensure_soft_delete_for_table_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_soft_delete_for_table_by_id(uuid) TO authenticated;
