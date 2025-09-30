-- Correção final: remover event trigger problemático e confirmar sistema funcionando

-- Remover o event trigger que estava causando problema
DROP EVENT TRIGGER IF EXISTS protheus_table_auto_setup;
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table();

-- Criar versão mais simples que será chamada quando necessário
CREATE OR REPLACE FUNCTION public.ensure_protheus_workflow_ready(table_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se a tabela tem as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'is_new_record'
  ) THEN
    RETURN false;
  END IF;

  -- Garantir que a configuração está aplicada
  PERFORM public.setup_protheus_table_workflow(table_name_param);
  
  RETURN true;
END;
$$;