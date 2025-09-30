-- Clean up duplicate material types that don't match current active ones
-- First, let's see what we have and then deactivate duplicates

-- Deactivate material types that appear to be duplicates or old entries
-- Based on the issue, "Matérias Primas" (blue color) doesn't exist in the current table
UPDATE public.purchases_material_types 
SET is_active = false, updated_at = now()
WHERE normalize_text(name) IN (
  'materias primas',
  'transportadora'
) AND is_active = true;

-- Add a unique partial index to prevent duplicate normalized names for active records
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_material_types_normalized_name_unique
ON public.purchases_material_types (normalize_text(name))
WHERE is_active = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_purchases_material_types_normalized_name_unique IS 'Ensures no duplicate material type names when normalized (active records only)';