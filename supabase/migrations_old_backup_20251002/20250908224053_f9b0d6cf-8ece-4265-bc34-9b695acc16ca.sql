-- Add unique constraint on contact_entity_id to prevent upsert conflicts
ALTER TABLE public.contact_entity_external_partners 
ADD CONSTRAINT contact_entity_external_partners_contact_entity_id_key 
UNIQUE (contact_entity_id);