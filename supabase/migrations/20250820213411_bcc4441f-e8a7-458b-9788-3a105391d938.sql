
-- 1) Remover o event trigger e a função que auto-configuram workflows em tabelas do Protheus
DO $$
BEGIN
  -- Tenta remover o event trigger com CASCADE e, se falhar, sem CASCADE
  BEGIN
    EXECUTE 'DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup CASCADE';
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      EXECUTE 'DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;
END $$;

-- Remover a função de auto-setup (idempotente)
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- 2) Remover funções auxiliares de workflow relacionadas ao Protheus (se existirem)
DROP FUNCTION IF EXISTS public.setup_protheus_table_workflow(text) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_protheus_workflow_ready(text) CASCADE;

-- 3) Remover triggers ligados à função emit_protheus_status_change em todas as tabelas public.protheus_%
DO $$
DECLARE
  proc_oid oid;
  trg RECORD;
BEGIN
  -- Descobre o OID da função emit_protheus_status_change (se existir)
  SELECT oid INTO proc_oid
  FROM pg_proc
  WHERE proname = 'emit_protheus_status_change'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LIMIT 1;

  IF proc_oid IS NOT NULL THEN
    -- Derruba QUALQUER trigger que chame essa função, nas tabelas do schema public
    FOR trg IN
      SELECT tg.tgname,
             n.nspname AS schema_name,
             c.relname AS table_name
      FROM pg_trigger tg
      JOIN pg_class c ON c.oid = tg.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT tg.tgisinternal
        AND n.nspname = 'public'
        AND c.relname LIKE 'protheus\_%' ESCAPE '\'
        AND tg.tgfoid = proc_oid
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', trg.tgname, trg.schema_name, trg.table_name);
    END LOOP;
  END IF;
END $$;

-- 4) Opcionalmente, remover também a função emit_protheus_status_change (não é usada fora do Protheus)
DROP FUNCTION IF EXISTS public.emit_protheus_status_change() CASCADE;
