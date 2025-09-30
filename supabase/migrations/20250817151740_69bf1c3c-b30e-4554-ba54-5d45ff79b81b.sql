-- Add permissions for "Política de Privacidade" by copying from "Dados do Site" permissions
INSERT INTO department_permissions (department_id, page_name, admin_permission, director_permission, hr_permission, leader_permission, user_permission)
SELECT dp.department_id, 'Política de Privacidade',
       dp.admin_permission, dp.director_permission, dp.hr_permission, dp.leader_permission, dp.user_permission
FROM department_permissions dp
WHERE dp.page_name = 'Dados do Site'
  AND NOT EXISTS (
    SELECT 1 FROM department_permissions x
    WHERE x.department_id = dp.department_id
      AND x.page_name = 'Política de Privacidade'
  );

-- Add default permissions for departments that don't have "Dados do Site" permissions
INSERT INTO department_permissions (department_id, page_name, admin_permission, director_permission, hr_permission, leader_permission, user_permission)
SELECT d.id, 'Política de Privacidade', 'ver_modificar', 'ver_somente', 'ver_somente', 'ver_somente', 'ver_somente'
FROM departments d
WHERE NOT EXISTS (
  SELECT 1 FROM department_permissions p
  WHERE p.department_id = d.id
    AND p.page_name = 'Política de Privacidade'
);