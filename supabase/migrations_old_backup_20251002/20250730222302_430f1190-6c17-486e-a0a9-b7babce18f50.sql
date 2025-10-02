-- Função para calcular próxima execução automaticamente quando triggers são criados/atualizados
CREATE OR REPLACE FUNCTION public.calculate_trigger_next_execution()
RETURNS TRIGGER AS $$
DECLARE
  next_exec TIMESTAMP WITH TIME ZONE;
  config JSONB;
BEGIN
  -- Só calcular para triggers recorrentes
  IF NEW.trigger_type IN ('recurring_interval', 'recurring_schedule', 'recurring_monthly') THEN
    config := COALESCE(NEW.trigger_config, '{}'::jsonb);
    
    CASE NEW.trigger_type
      WHEN 'recurring_interval' THEN
        -- Calcular baseado no intervalo em minutos
        next_exec := NOW() + INTERVAL '1 minute' * COALESCE((config->>'interval')::INTEGER, 60);
        
      WHEN 'recurring_schedule' THEN
        -- Calcular baseado em agendamento semanal
        -- Para simplificar, próxima execução em 1 dia
        next_exec := NOW() + INTERVAL '1 day';
        
      WHEN 'recurring_monthly' THEN
        -- Calcular baseado em agendamento mensal
        -- Para simplificar, próxima execução em 1 mês
        next_exec := NOW() + INTERVAL '1 month';
        
      ELSE
        next_exec := NOW() + INTERVAL '1 hour';
    END CASE;
    
    NEW.next_execution_at := next_exec;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Criar trigger para calcular automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_next_execution ON public.workflow_auto_triggers;
CREATE TRIGGER trigger_calculate_next_execution
  BEFORE INSERT OR UPDATE ON public.workflow_auto_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_trigger_next_execution();