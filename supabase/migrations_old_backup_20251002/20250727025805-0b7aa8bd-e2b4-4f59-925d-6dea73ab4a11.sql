-- Create permission enum
CREATE TYPE public.permission_level AS ENUM ('ver_modificar', 'ver_somente', 'bloquear_acesso');

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  integrates_org_chart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Departments are viewable by authenticated users" 
ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "Departments can be created by authenticated users" 
ON public.departments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Departments can be updated by authenticated users" 
ON public.departments 
FOR UPDATE 
USING (true);

CREATE POLICY "Departments can be deleted by authenticated users" 
ON public.departments 
FOR DELETE 
USING (true);

-- Create department_permissions table
CREATE TABLE public.department_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  leadership_permission permission_level NOT NULL DEFAULT 'ver_modificar',
  user_permission permission_level NOT NULL DEFAULT 'ver_somente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, page_name)
);

-- Enable RLS on department_permissions
ALTER TABLE public.department_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for department_permissions
CREATE POLICY "Department permissions are viewable by authenticated users" 
ON public.department_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Department permissions can be created by authenticated users" 
ON public.department_permissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Department permissions can be updated by authenticated users" 
ON public.department_permissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Department permissions can be deleted by authenticated users" 
ON public.department_permissions 
FOR DELETE 
USING (true);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN is_leader BOOLEAN NOT NULL DEFAULT false;

-- Create triggers for timestamps
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_permissions_updated_at
BEFORE UPDATE ON public.department_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default "Geral" department
INSERT INTO public.departments (name, description, color, integrates_org_chart) 
VALUES ('Geral', 'Departamento geral para usuários sem departamento específico', '#6B7280', false);

-- Insert default permissions for the "Geral" department
WITH default_dept AS (
  SELECT id FROM public.departments WHERE name = 'Geral' LIMIT 1
)
INSERT INTO public.department_permissions (department_id, page_name, leadership_permission, user_permission)
SELECT 
  default_dept.id,
  page_name,
  'ver_modificar'::permission_level,
  'ver_somente'::permission_level
FROM default_dept,
(VALUES 
  ('Dashboard'),
  ('Usuários'),
  ('Departamentos'),
  ('Permissões de Acesso')
) AS pages(page_name);

-- Update existing users to be linked to the default department
UPDATE public.profiles 
SET department_id = (SELECT id FROM public.departments WHERE name = 'Geral' LIMIT 1)
WHERE department_id IS NULL;