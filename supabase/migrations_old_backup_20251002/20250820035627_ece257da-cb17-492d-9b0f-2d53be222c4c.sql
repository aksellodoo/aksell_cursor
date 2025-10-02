
-- Garantir que a tabela de vendedores (SA3010) dispare eventos de alteração para workflows

DO $$
BEGIN
  -- Criar o trigger somente se ainda não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = 'protheus_sa3010_fc3d70f6'
      AND trigger_name = 'protheus_sa3010_fc3d70f6_status_change_trigger'
  ) THEN
    EXECUTE '
      CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger
        AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
        FOR EACH ROW
        EXECUTE FUNCTION public.emit_protheus_status_change()
    ';
  END IF;
END;
$$;

-- Conferir se o trigger foi criado
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'protheus_sa3010_fc3d70f6';
