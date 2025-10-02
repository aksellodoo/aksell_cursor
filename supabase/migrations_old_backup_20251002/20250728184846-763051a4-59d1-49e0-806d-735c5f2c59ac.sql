-- Criar usuários de teste para workflows (tagged para limpeza)
INSERT INTO public.profiles (id, name, email, role, department, status, is_leader, department_id) VALUES
  (gen_random_uuid(), 'Maria Santos [TEST]', 'maria.test@company.com', 'hr', 'Recursos Humanos', 'active', true, NULL),
  (gen_random_uuid(), 'João Silva [TEST]', 'joao.test@company.com', 'director', 'Tecnologia da Informação', 'active', false, NULL),
  (gen_random_uuid(), 'Ana Costa [TEST]', 'ana.test@company.com', 'user', 'Vendas', 'active', true, NULL),
  (gen_random_uuid(), 'Pedro Oliveira [TEST]', 'pedro.test@company.com', 'user', 'Tecnologia da Informação', 'active', false, NULL),
  (gen_random_uuid(), 'Carlos Inativo [TEST]', 'carlos.test@company.com', 'user', 'Vendas', 'inactive', false, NULL),
  (gen_random_uuid(), 'Roberto Executivo [TEST]', 'roberto.test@company.com', 'director', 'Executivo', 'active', false, NULL);

-- Criar departamentos de teste para workflows
INSERT INTO public.departments (id, name, description, color, integrates_org_chart) VALUES
  (gen_random_uuid(), 'Recursos Humanos [TEST]', 'Departamento de teste para workflows HR', '#3B82F6', false),
  (gen_random_uuid(), 'Tecnologia da Informação [TEST]', 'Departamento de teste para workflows TI', '#10B981', false),
  (gen_random_uuid(), 'Vendas [TEST]', 'Departamento de teste para workflows Vendas', '#F59E0B', false),
  (gen_random_uuid(), 'Executivo [TEST]', 'Departamento de teste para workflows Executivo', '#EF4444', false);