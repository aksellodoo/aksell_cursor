
-- Atualizar perfis dos usuários de teste com departamentos, roles e hierarquias corretas

-- Recursos Humanos [TEST]
UPDATE profiles SET 
  name = 'Maria Santos',
  role = 'hr',
  department = 'Recursos Humanos [TEST]',
  department_id = '0cf232ea-5e71-4ac3-8ea7-90463db30a95',
  is_leader = true,
  status = 'active'
WHERE email = 'maria.santos@teste.com';

UPDATE profiles SET 
  name = 'Ana Silva',
  role = 'user',
  department = 'Recursos Humanos [TEST]',
  department_id = '0cf232ea-5e71-4ac3-8ea7-90463db30a95',
  is_leader = false,
  status = 'active'
WHERE email = 'ana.silva@teste.com';

-- Tecnologia da Informação [TEST]
UPDATE profiles SET 
  name = 'João Oliveira',
  role = 'director',
  department = 'Tecnologia da Informação [TEST]',
  department_id = '40839a39-2538-4ead-be79-bed5830f60b7',
  is_leader = true,
  status = 'active'
WHERE email = 'joao.oliveira@teste.com';

UPDATE profiles SET 
  name = 'Pedro Costa',
  role = 'user',
  department = 'Tecnologia da Informação [TEST]',
  department_id = '40839a39-2538-4ead-be79-bed5830f60b7',
  is_leader = false,
  status = 'active'
WHERE email = 'pedro.costa@teste.com';

UPDATE profiles SET 
  name = 'Lucas Ferreira',
  role = 'user',
  department = 'Tecnologia da Informação [TEST]',
  department_id = '40839a39-2538-4ead-be79-bed5830f60b7',
  is_leader = false,
  status = 'active'
WHERE email = 'lucas.ferreira@teste.com';

-- Vendas [TEST]
UPDATE profiles SET 
  name = 'Carla Rodrigues',
  role = 'director',
  department = 'Vendas [TEST]',
  department_id = '82074f17-81c3-4e81-9733-6f95fcda24eb',
  is_leader = true,
  status = 'active'
WHERE email = 'carla.rodrigues@teste.com';

UPDATE profiles SET 
  name = 'Rafael Almeida',
  role = 'user',
  department = 'Vendas [TEST]',
  department_id = '82074f17-81c3-4e81-9733-6f95fcda24eb',
  is_leader = false,
  status = 'active'
WHERE email = 'rafael.almeida@teste.com';

UPDATE profiles SET 
  name = 'Juliana Santos',
  role = 'user',
  department = 'Vendas [TEST]',
  department_id = '82074f17-81c3-4e81-9733-6f95fcda24eb',
  is_leader = false,
  status = 'active'
WHERE email = 'juliana.santos@teste.com';

-- Executivo [TEST]
UPDATE profiles SET 
  name = 'Roberto Executivo',
  role = 'director',
  department = 'Executivo [TEST]',
  department_id = 'b367d4a3-c0f0-420e-8e72-90da7022630d',
  is_leader = true,
  status = 'active'
WHERE email = 'roberto.executivo@teste.com';

UPDATE profiles SET 
  name = 'Sandra Diretora',
  role = 'director',
  department = 'Executivo [TEST]',
  department_id = 'b367d4a3-c0f0-420e-8e72-90da7022630d',
  is_leader = true,
  status = 'active'
WHERE email = 'sandra.diretora@teste.com';

-- Usuário inativo para testes de edge cases
UPDATE profiles SET 
  name = 'Carlos Inativo',
  role = 'user',
  department = 'Tecnologia da Informação [TEST]',
  department_id = '40839a39-2538-4ead-be79-bed5830f60b7',
  is_leader = false,
  status = 'inactive'
WHERE email = 'carlos.inativo@teste.com';
