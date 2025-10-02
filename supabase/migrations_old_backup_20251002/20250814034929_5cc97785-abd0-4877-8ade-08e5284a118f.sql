-- Adicionar search_path nas funções que ainda não têm
ALTER FUNCTION public.get_department_name(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_employee_data_access(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.can_access_form(confidentiality_level, uuid[], uuid[], text[], uuid) SET search_path = 'public';
ALTER FUNCTION public.check_external_form_rate_limit(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.trigger_document_expired(uuid) SET search_path = 'public';