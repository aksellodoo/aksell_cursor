-- Criar enum para tipos de contrato
CREATE TYPE contract_type AS ENUM ('CLT', 'PJ', 'Estagiario', 'Terceirizado', 'Temporario');

-- Criar enum para status do funcionário
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated', 'on_leave');

-- Criar enum para gênero
CREATE TYPE gender_type AS ENUM ('M', 'F', 'Outros');

-- Criar tabela de funcionários
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  email TEXT UNIQUE,
  position TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  supervisor_id UUID REFERENCES public.employees(id),
  birth_date DATE,
  phone TEXT,
  gender gender_type,
  hire_date DATE NOT NULL,
  termination_date DATE,
  salary DECIMAL(10,2),
  contract_type contract_type DEFAULT 'CLT',
  status employee_status DEFAULT 'active',
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de documentos dos funcionários
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo employee_id na tabela profiles
ALTER TABLE public.profiles ADD COLUMN employee_id UUID REFERENCES public.employees(id);

-- Habilitar RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Criar políticas para employees
CREATE POLICY "Employees are viewable by authenticated users" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Employees can be created by HR/Directors" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'hr' OR role = 'director' OR is_leader = true)
  )
);

CREATE POLICY "Employees can be updated by HR/Directors" 
ON public.employees 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'hr' OR role = 'director' OR is_leader = true)
  )
);

CREATE POLICY "Employees can be deleted by HR/Directors" 
ON public.employees 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'hr' OR role = 'director' OR is_leader = true)
  )
);

-- Criar políticas para employee_documents
CREATE POLICY "Employee documents are viewable by authenticated users" 
ON public.employee_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Employee documents can be created by authenticated users" 
ON public.employee_documents 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Employee documents can be updated by uploader or HR/Directors" 
ON public.employee_documents 
FOR UPDATE 
USING (
  auth.uid() = uploaded_by OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'hr' OR role = 'director')
  )
);

CREATE POLICY "Employee documents can be deleted by uploader or HR/Directors" 
ON public.employee_documents 
FOR DELETE 
USING (
  auth.uid() = uploaded_by OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'hr' OR role = 'director')
  )
);

-- Criar trigger para updated_at em employees
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para gerar código do funcionário
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;