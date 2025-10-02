-- Add triggers to emit protheus workflow events on all sync tables

-- Create triggers for protheus_sa1010_80f17f00
CREATE TRIGGER protheus_sa1010_80f17f00_status_change_trigger
    AFTER INSERT OR UPDATE ON public.protheus_sa1010_80f17f00
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_protheus_status_change();

-- Create triggers for protheus_sa3010_fc3d70f6  
CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger
    AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_protheus_status_change();

-- Create triggers for protheus_sa4010_ea26a13a
CREATE TRIGGER protheus_sa4010_ea26a13a_status_change_trigger
    AFTER INSERT OR UPDATE ON public.protheus_sa4010_ea26a13a
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_protheus_status_change();

-- Create triggers for protheus_sa5010_7d6a8fff
CREATE TRIGGER protheus_sa5010_7d6a8fff_status_change_trigger
    AFTER INSERT OR UPDATE ON public.protheus_sa5010_7d6a8fff
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_protheus_status_change();