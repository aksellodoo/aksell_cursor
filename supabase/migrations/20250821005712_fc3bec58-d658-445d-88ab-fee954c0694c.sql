BEGIN;

-- [A] Desabilitar TODOS os EVENT TRIGGERS (nada dispara durante a limpeza)
DROP TABLE IF EXISTS temp_event_trigger_state;
CREATE TEMP TABLE temp_event_trigger_state
ON COMMIT DROP
AS SELECT evtname, evtenabled FROM pg_event_trigger;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT evtname FROM pg_event_trigger LOOP
    EXECUTE format('ALTER EVENT TRIGGER %I DISABLE', r.evtname);
  END LOOP;
END $$;

-- [B] Drop EVENT TRIGGERS que referenciam a função OID 59783 (a problemática)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT evtname FROM pg_event_trigger WHERE evtfoid = 59783::oid LOOP
    EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I', t.evtname);  -- sem CASCADE
  END LOOP;
END $$;

-- [C] (Defensivo) Remover TRIGGERS DE TABELA que chamem a função pelo nome
DO $$
DECLARE trg record;
BEGIN
  FOR trg IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal AND p.proname = 'auto_setup_protheus_table'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', trg.trigger_name, trg.schema_name, trg.table_name);
  END LOOP;
END $$;

-- [D] Dropar a FUNÇÃO problemática por OID (gera a assinatura correta) usando RESTRICT
DO $$
DECLARE fn text;
BEGIN
  SELECT oid::regprocedure::text INTO fn FROM pg_proc WHERE oid = 59783::oid;
  IF fn IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION '||fn||' RESTRICT';
  END IF;
END $$;

-- [E] Sanity checks: nada pode restar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtfoid = 59783::oid) THEN
    RAISE EXCEPTION 'Ainda existe event trigger apontando para a função OID 59783';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE oid = 59783::oid OR proname='auto_setup_protheus_table') THEN
    RAISE EXCEPTION 'Ainda existe função auto_setup_protheus_table';
  END IF;
END $$;

-- [F] SA3010: criar colunas de soft delete, índice, atualizar estrutura e backfill correto
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;

UPDATE protheus_dynamic_tables t
SET table_structure = jsonb_set(
  t.table_structure,'{columns}',
  (
    SELECT jsonb_agg(DISTINCT c)
    FROM jsonb_array_elements(
      coalesce(t.table_structure->'columns','[]'::jsonb)
      || jsonb_build_array(
           jsonb_build_object('name','pending_deletion','type','boolean'),
           jsonb_build_object('name','pending_deletion_at','type','timestamptz')
         )
    ) AS c
  ), true
)
WHERE t.id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.supabase_table_name = 'protheus_sa3010_fc3d70f6'
  AND d.protheus_id = t.protheus_id
  AND t.pending_deletion IS DISTINCT FROM true;

-- Reload do PostgREST
SELECT pg_notify('pgrst','reload schema');

-- [G] Restaurar o estado original dos EVENT TRIGGERS
DO $$
DECLARE r record; cmd text;
BEGIN
  FOR r IN SELECT evtname, evtenabled FROM temp_event_trigger_state LOOP
    IF EXISTS (SELECT 1 FROM pg_event_trigger e WHERE e.evtname = r.evtname) THEN
      cmd := CASE r.evtenabled
        WHEN 'O' THEN 'ENABLE'
        WHEN 'R' THEN 'ENABLE REPLICA'
        WHEN 'A' THEN 'ENABLE ALWAYS'
        ELSE NULL
      END;
      IF cmd IS NOT NULL THEN
        EXECUTE format('ALTER EVENT TRIGGER %I %s', r.evtname, cmd);
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;