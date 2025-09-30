-- Criar apenas departamentos de teste para workflows
INSERT INTO public.departments (id, name, description, color, integrates_org_chart) VALUES
  (gen_random_uuid(), 'Recursos Humanos [TEST]', 'Departamento de teste para workflows HR', '#3B82F6', false),
  (gen_random_uuid(), 'Tecnologia da Informação [TEST]', 'Departamento de teste para workflows TI', '#10B981', false),
  (gen_random_uuid(), 'Vendas [TEST]', 'Departamento de teste para workflows Vendas', '#F59E0B', false),
  (gen_random_uuid(), 'Executivo [TEST]', 'Departamento de teste para workflows Executivo', '#EF4444', false);