-- Verificar e corrigir todas as funções que não têm search_path definido
-- Recriar function que pode estar faltando search_path

-- Verificar se existe alguma função específica e corrigir
-- Como não consigo ver qual função específica, vou recriar a function que pode estar causando o problema

-- Talvez seja uma função que foi criada anteriormente, vou verificar algumas possíveis
-- Listar funções que podem não ter search_path:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN (
  'auto_share_approval_record', 
  'revoke_auto_share_on_approval',
  'create_approval_with_record_access'
) AND prosecdef = true;

-- Como preciso garantir que todas estão corretas, vou recriar mais uma vez com search_path explícito
CREATE OR REPLACE FUNCTION public.auto_share_approval_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
DECLARE
  share_id uuid;
BEGIN
  -- Se a aprovação requer acesso ao registro e tem referência
  IF NEW.requires_record_access = true AND NEW.record_reference IS NOT NULL THEN
    -- Extrair dados da referência
    DECLARE
      record_type text;
      record_id uuid;
      record_name text;
    BEGIN
      record_type := NEW.record_reference->>'record_type';
      record_id := (NEW.record_reference->>'record_id')::uuid;
      record_name := COALESCE(NEW.record_reference->>'record_name', 'Registro para aprovação');
      
      -- Criar compartilhamento automático
      INSERT INTO public.record_shares (
        shared_by, 
        shared_with, 
        record_type, 
        record_id, 
        record_name,
        permissions,
        status,
        expires_at
      ) VALUES (
        -- Sistema compartilha 
        '00000000-0000-0000-0000-000000000000',
        NEW.approver_id,
        record_type,
        record_id,
        record_name,
        ARRAY['view', 'comment'],
        'active',
        CASE 
          WHEN NEW.expires_at IS NOT NULL THEN NEW.expires_at + INTERVAL '1 day'
          ELSE NOW() + INTERVAL '30 days'
        END
      ) RETURNING id INTO share_id;
      
      -- Atualizar aprovação com ID do compartilhamento
      NEW.auto_shared_record_id := share_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;