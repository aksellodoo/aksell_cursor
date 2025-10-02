-- Criar trigger para disparar eventos de workflow na tabela SA3010 (Vendedores)
CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger
  AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_protheus_status_change();