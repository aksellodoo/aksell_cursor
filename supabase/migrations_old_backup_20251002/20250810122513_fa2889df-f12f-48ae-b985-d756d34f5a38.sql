
-- 1) Adiciona a coluna de permissão para Líder nos departamentos
ALTER TABLE public.department_permissions
ADD COLUMN IF NOT EXISTS leader_permission permission_level DEFAULT 'ver_modificar';

-- 2) Backfill para linhas existentes que ainda não possuam valor (garante consistência de leitura)
UPDATE public.department_permissions
SET leader_permission = 'ver_modificar'
WHERE leader_permission IS NULL;
