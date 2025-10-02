-- Drop the existing permission_level enum and recreate it with updated structure
-- First, create the new columns for the 4 user types
ALTER TABLE public.department_permissions 
ADD COLUMN admin_permission permission_level DEFAULT 'ver_modificar',
ADD COLUMN director_permission permission_level DEFAULT 'ver_modificar',
ADD COLUMN hr_permission permission_level DEFAULT 'ver_modificar',
ADD COLUMN user_permission_new permission_level DEFAULT 'ver_somente';

-- Copy existing data to new structure
UPDATE public.department_permissions 
SET 
  admin_permission = 'ver_modificar',
  director_permission = leadership_permission,
  hr_permission = leadership_permission,
  user_permission_new = user_permission;

-- Drop old columns
ALTER TABLE public.department_permissions 
DROP COLUMN leadership_permission,
DROP COLUMN user_permission;

-- Rename the new user_permission column
ALTER TABLE public.department_permissions 
RENAME COLUMN user_permission_new TO user_permission;