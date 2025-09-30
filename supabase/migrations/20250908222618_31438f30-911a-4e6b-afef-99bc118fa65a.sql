-- Backfill missing external partner details for entities that exist but have no details
INSERT INTO public.contact_entity_external_partners (
  contact_entity_id,
  official_name,
  partner_type,
  relationship_nature,
  created_by
)
SELECT 
  ce.id,
  ce.name,
  'outro'::partner_type,
  ARRAY[]::relationship_nature[],
  ce.created_by
FROM public.contact_entities ce
WHERE ce.type = 'parceiros_externos'
  AND ce.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.contact_entity_external_partners ep 
    WHERE ep.contact_entity_id = ce.id
  );