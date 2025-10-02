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