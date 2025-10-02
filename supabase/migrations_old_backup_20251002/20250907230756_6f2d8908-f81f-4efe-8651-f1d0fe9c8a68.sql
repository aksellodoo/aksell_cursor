
-- 1) Enum para o alvo do vínculo (permite expandir depois)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_link_target_kind') THEN
    CREATE TYPE public.contact_link_target_kind AS ENUM (
      'economic_group_sales',   -- grupo econômico (vendas)
      'unified_customer',       -- unidade (cliente unificado)
      'economic_group_purchases',
      'unified_supplier',
      'commercial_rep',
      'carrier',
      'external_partner',
      'public_org',
      'association_union',
      'financial_institution',
      'other_entity'
    );
  END IF;
END$$;

-- 2) Adicionar coluna target_kind (mantendo compatibilidade com dados existentes)
ALTER TABLE public.contact_links
  ADD COLUMN IF NOT EXISTS target_kind public.contact_link_target_kind
  NOT NULL DEFAULT 'unified_customer';

-- 3) Índice para acelerar buscas típicas (contact_id + tipo + alvo + id de destino)
CREATE INDEX IF NOT EXISTS idx_contact_links_contact_and_target
  ON public.contact_links (contact_id, link_type, target_kind, target_id);
