-- Criar departamentos de produção
INSERT INTO public.departments (name, description, color, integrates_org_chart) VALUES
('Recursos Humanos', 'Departamento de Recursos Humanos', '#10B981', true),
('Tecnologia da Informação', 'Departamento de TI e Sistemas', '#3B82F6', true),
('Financeiro', 'Departamento Financeiro e Contábil', '#F59E0B', true),
('Comercial', 'Departamento Comercial e Vendas', '#EF4444', true),
('Operações', 'Departamento de Operações', '#8B5CF6', true),
('Marketing', 'Departamento de Marketing', '#EC4899', true);

-- Atualizar o departamento "Geral" para não ser teste
UPDATE public.departments 
SET description = 'Departamento Geral - Para usuários sem departamento específico'
WHERE name = 'Geral';