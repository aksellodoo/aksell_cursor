-- Clean up duplicate material types that don't match current active ones
-- Deactivate material types that appear to be duplicates or old entries
UPDATE public.purchases_material_types 
SET is_active = false, updated_at = now()
WHERE normalize_text(name) IN (
  'materias primas',
  'transportadora'
) AND is_active = true;

-- Add a unique partial index to prevent duplicate normalized names for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_material_types_normalized_name_unique
ON public.purchases_material_types (normalize_text(name))
WHERE is_active = true;