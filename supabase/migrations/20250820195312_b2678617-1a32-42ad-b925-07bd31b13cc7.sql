
-- 1) Remover event trigger e função de auto-setup (evita recriação futura)
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- 2) Remover todos os triggers de workflow em tabelas Protheus (os que chamam emit_protheus_status_change)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT 
      tg.tgname AS trigger_name,
      n.nspname AS schema_name,
      c.relname AS table_name
    FROM pg_trigger tg
    JOIN pg_class c       ON c.oid = tg.tgrelid
    JOIN pg_namespace n   ON n.oid = c.relnamespace
    JOIN pg_proc p        ON p.oid = tg.tgfoid
    WHERE NOT tg.tgisinternal
      AND n.nspname = 'public'
      AND c.relname LIKE 'protheus\_%'
      AND p.proname = 'emit_protheus_status_change'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.trigger_name, r.schema_name, r.table_name);
  END LOOP;
END
$$;

-- 3) Salvaguarda: tentar dropar triggers conhecidos (caso algum tenha ficado para trás)
DROP TRIGGER IF EXISTS protheus_sa1010_80f17f00_status_change_trigger ON public.protheus_sa1010_80f17f00;
DROP TRIGGER IF EXISTS protheus_sa3010_fc3d70f6_status_change_trigger ON public.protheus_sa3010_fc3d70f6;
DROP TRIGGER IF EXISTS protheus_sa4010_ea26a13a_status_change_trigger ON public.protheus_sa4010_ea26a13a;
DROP TRIGGER IF EXISTS protheus_sa5010_7d6a8fff_status_change_trigger ON public.protheus_sa5010_7d6a8fff;
DROP TRIGGER IF EXISTS trigger_emit_protheus_status_change_sa1010 ON public.protheus_sa1010_80f17f00;
DROP TRIGGER IF EXISTS trigger_emit_protheus_status_change_sa3010 ON public.protheus_sa3010_fc3d70f6;
