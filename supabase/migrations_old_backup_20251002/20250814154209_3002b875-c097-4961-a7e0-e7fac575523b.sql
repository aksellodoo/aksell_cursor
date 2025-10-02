-- Criar helper function para verificar se operação requer AAL2
CREATE OR REPLACE FUNCTION public.requires_aal2(operation_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT operation_type = ANY(ARRAY[
    'delete_user',
    'change_password', 
    'view_sensitive_data',
    'export_data',
    'admin_operations',
    'financial_data',
    'protheus_sync',
    'system_config'
  ]);
$$;

-- Criar function para verificar AAL2 do usuário atual
CREATE OR REPLACE FUNCTION public.user_has_aal2()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(auth.jwt()->>'aal' = 'aal2', false);
$$;

-- Exemplos de políticas RLS step-up para tabelas sensíveis

-- Política para operações sensíveis em profiles (exigir AAL2 para updates críticos)
DROP POLICY IF EXISTS "Sensitive profile updates require AAL2" ON public.profiles;
CREATE POLICY "Sensitive profile updates require AAL2"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  AND (
    -- Permitir updates não-sensíveis sempre
    NOT (
      OLD.role IS DISTINCT FROM NEW.role OR
      OLD.department_id IS DISTINCT FROM NEW.department_id OR
      OLD.status IS DISTINCT FROM NEW.status
    )
    -- OU exigir AAL2 para mudanças sensíveis
    OR public.user_has_aal2()
  )
);

-- Política para exportação de dados (sempre requer AAL2)
-- Esta seria aplicada em uma tabela de exports ou similar
-- CREATE POLICY "Data exports require AAL2"
-- ON public.data_exports
-- FOR ALL
-- USING (public.user_has_aal2());

-- Política para configurações de sistema (sempre requer AAL2)
DROP POLICY IF EXISTS "System config requires AAL2" ON public.protheus_config;
CREATE POLICY "System config requires AAL2"
ON public.protheus_config
FOR UPDATE
USING (
  public.user_has_aal2() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director')
  )
);

-- Log da implementação do step-up MFA
INSERT INTO public.field_audit_log (
  record_id,
  field_name,
  old_value,
  new_value,
  changed_by,
  record_type
) VALUES (
  gen_random_uuid(),
  'step_up_mfa_implementation',
  'forced_mfa',
  'step_up_mfa_with_aal2_policies',
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
  'system_update'
);