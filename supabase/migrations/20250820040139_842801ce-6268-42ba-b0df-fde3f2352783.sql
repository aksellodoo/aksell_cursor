-- Verificar se o trigger já existe e criar apenas se necessário
DO $$
BEGIN
  -- Verificar se o trigger já existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
      AND event_object_table = 'protheus_sa3010_fc3d70f6'
      AND trigger_name = 'protheus_sa3010_fc3d70f6_status_change_trigger'
  ) THEN
    -- Criar o trigger para a tabela SA3010 (Vendedores)
    EXECUTE 'CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger 
             AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6 
             FOR EACH ROW 
             EXECUTE FUNCTION public.emit_protheus_status_change()';
    
    RAISE NOTICE 'Trigger criado com sucesso na tabela protheus_sa3010_fc3d70f6';
  ELSE
    RAISE NOTICE 'Trigger já existe na tabela protheus_sa3010_fc3d70f6';
  END IF;
END $$;