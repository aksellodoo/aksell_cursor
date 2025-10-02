-- Clean up duplicate material types that don't match current active ones
-- Deactivate material types that appear to be duplicates or old entries
UPDATE public.purchases_material_types 
SET is_active = false, updated_at = now()
WHERE lower(trim(name)) IN (
  'matérias primas',
  'materias primas', 
  'transportadora'
) AND is_active = true;