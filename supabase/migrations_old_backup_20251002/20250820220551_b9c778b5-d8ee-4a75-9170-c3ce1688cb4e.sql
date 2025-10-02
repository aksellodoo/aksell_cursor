
BEGIN;

-- 1) Snapshot do estado atual dos event triggers (nome + status)
CREATE TEMP TABLE _evt_triggers_initial_state (
  evtname text PRIMARY KEY,
  evtenabled char(1) NOT NULL
) ON COMMIT DROP;

INSERT INTO _evt_triggers_initial_state (evtname, evtenabled)
SELECT evtname, evtenabled
FROM pg_event_trigger;

-- 2) Desabilitar temporariamente todos os event triggers
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT evtname FROM pg_event_trigger LOOP
    EXECUTE format('ALTER EVENT TRIGGER %I DISABLE', r.evtname);
  END LOOP;
END $$;

-- 3) Substituir por stub no-op (mesma assinatura, neutraliza efeitos colaterais)
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- no-op
  RETURN;
END;
$$;

-- 4) Remover apenas os event triggers que apontam para essa função
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT e.evtname
    FROM pg_event_trigger e
    JOIN pg_proc p ON p.oid = e.evtfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'auto_setup_protheus_table'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('DROP EVENT TRIGGER %I', r.evtname);
  END LOOP;
END $$;

-- 5) Dropar a função com segurança (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'auto_setup_protheus_table'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE';
  END IF;
END $$;

-- 6) Reabilitar os event triggers remanescentes exatamente ao estado anterior
DO $$
DECLARE
  r record;
  enable_cmd text;
BEGIN
  FOR r IN SELECT evtname, evtenabled FROM _evt_triggers_initial_state LOOP
    -- Só tentar reabilitar se o trigger ainda existir
    IF EXISTS (SELECT 1 FROM pg_event_trigger e WHERE e.evtname = r.evtname) THEN
      -- Preservar o estado anterior:
      -- 'O' (ENABLED), 'D' (DISABLED), 'R' (ENABLE REPLICA), 'A' (ENABLE ALWAYS)
      enable_cmd := CASE r.evtenabled
        WHEN 'O' THEN 'ENABLE'
        WHEN 'R' THEN 'ENABLE REPLICA'
        WHEN 'A' THEN 'ENABLE ALWAYS'
        ELSE NULL  -- 'D' permanece desabilitado
      END;

      IF enable_cmd IS NOT NULL THEN
        EXECUTE format('ALTER EVENT TRIGGER %I %s', r.evtname, enable_cmd);
      END IF;
      -- Se era 'D', deixamos desabilitado (não fazemos nada)
    END IF;
  END LOOP;
END $$;

COMMIT;
