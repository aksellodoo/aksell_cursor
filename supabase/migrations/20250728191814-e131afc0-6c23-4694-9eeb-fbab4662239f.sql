-- Configure test users in profiles table for workflow testing
-- This script organizes test users into departments with proper roles and hierarchy

-- First, let's identify the test departments
UPDATE profiles 
SET 
  name = CASE 
    WHEN email LIKE '%diretor%' THEN 'João Silva (Diretor)'
    WHEN email LIKE '%rh%' THEN 'Maria Santos (RH)'  
    WHEN email LIKE '%usuario%' THEN 'Pedro Costa (Usuário)'
    WHEN email LIKE '%inativo%' THEN 'Ana Souza (Inativo)'
    WHEN email LIKE '%vendas%' THEN 'Carlos Oliveira (Vendas)'
    WHEN email LIKE '%ti%' THEN 'Lucia Ferreira (TI)'
    WHEN email LIKE '%executivo%' THEN 'Roberto Lima (Executivo)'
    WHEN email LIKE '%lider%' THEN 'Fernanda Costa (Líder)'
    ELSE name
  END,
  department_id = CASE 
    WHEN email LIKE '%rh%' THEN (SELECT id FROM departments WHERE name = 'Recursos Humanos [TEST]')
    WHEN email LIKE '%ti%' THEN (SELECT id FROM departments WHERE name = 'Tecnologia da Informação [TEST]')
    WHEN email LIKE '%vendas%' THEN (SELECT id FROM departments WHERE name = 'Vendas [TEST]')
    WHEN email LIKE '%executivo%' OR email LIKE '%diretor%' THEN (SELECT id FROM departments WHERE name = 'Executivo [TEST]')
    WHEN email LIKE '%usuario%' OR email LIKE '%inativo%' OR email LIKE '%lider%' THEN (SELECT id FROM departments WHERE name = 'Geral [TEST]')
    ELSE department_id
  END,
  role = CASE 
    WHEN email LIKE '%diretor%' THEN 'director'
    WHEN email LIKE '%rh%' THEN 'hr'
    WHEN email LIKE '%executivo%' THEN 'director'
    ELSE 'user'
  END,
  is_leader = CASE 
    WHEN email LIKE '%diretor%' OR email LIKE '%lider%' OR email LIKE '%executivo%' THEN true
    ELSE false
  END,
  status = CASE 
    WHEN email LIKE '%inativo%' THEN 'inactive'
    ELSE 'active'
  END,
  department = CASE 
    WHEN email LIKE '%rh%' THEN 'Recursos Humanos [TEST]'
    WHEN email LIKE '%ti%' THEN 'Tecnologia da Informação [TEST]'
    WHEN email LIKE '%vendas%' THEN 'Vendas [TEST]'
    WHEN email LIKE '%executivo%' OR email LIKE '%diretor%' THEN 'Executivo [TEST]'
    WHEN email LIKE '%usuario%' OR email LIKE '%inativo%' OR email LIKE '%lider%' THEN 'Geral [TEST]'
    ELSE department
  END
WHERE email LIKE '%test.com%';

-- Also ensure we have the test departments if they don't exist
INSERT INTO departments (name, description, color, integrates_org_chart) 
VALUES 
  ('Recursos Humanos [TEST]', 'Departamento de teste para RH', '#ef4444', true),
  ('Tecnologia da Informação [TEST]', 'Departamento de teste para TI', '#3b82f6', true),
  ('Vendas [TEST]', 'Departamento de teste para Vendas', '#10b981', true),
  ('Executivo [TEST]', 'Departamento de teste para Executivos', '#8b5cf6', true),
  ('Geral [TEST]', 'Departamento geral de teste', '#6b7280', true)
ON CONFLICT (name) DO NOTHING;