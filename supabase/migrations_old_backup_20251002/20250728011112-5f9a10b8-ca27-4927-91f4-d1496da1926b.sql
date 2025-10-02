-- Corrigir a função para ter search_path definido
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_code := 'EMP' || LPAD(counter::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_code = new_code);
    counter := counter + 1;
  END LOOP;
  RETURN new_code;
END;
$$;