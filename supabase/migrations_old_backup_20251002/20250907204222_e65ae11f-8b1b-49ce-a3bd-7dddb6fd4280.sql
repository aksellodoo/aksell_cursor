
-- 1) Enum para tipo de vínculo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_link_type') THEN
    CREATE TYPE public.contact_link_type AS ENUM ('cliente', 'fornecedor', 'representante', 'entidade');
  END IF;
END $$;

-- 2) Tabela de vínculos de contato
CREATE TABLE IF NOT EXISTS public.contact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  link_type public.contact_link_type NOT NULL,
  target_id uuid NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_links_unique UNIQUE (contact_id, link_type, target_id)
);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trg_contact_links_updated_at ON public.contact_links;
CREATE TRIGGER trg_contact_links_updated_at
BEFORE UPDATE ON public.contact_links
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_contact_links_contact_id ON public.contact_links (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_links_contact_type ON public.contact_links (contact_id, link_type);
CREATE INDEX IF NOT EXISTS idx_contact_links_target_id ON public.contact_links (target_id);

-- 3) RLS
ALTER TABLE public.contact_links ENABLE ROW LEVEL SECURITY;

-- Admin/director check snippet:
-- EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))

-- SELECT permitido para dono do contato e admins/diretores
DROP POLICY IF EXISTS contact_links_select ON public.contact_links;
CREATE POLICY contact_links_select
ON public.contact_links
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_links.contact_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))
);

-- INSERT permitido para dono do contato e admins/diretores
DROP POLICY IF EXISTS contact_links_insert ON public.contact_links;
CREATE POLICY contact_links_insert
ON public.contact_links
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_links.contact_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))
);

-- UPDATE permitido para dono do contato e admins/diretores
DROP POLICY IF EXISTS contact_links_update ON public.contact_links;
CREATE POLICY contact_links_update
ON public.contact_links
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_links.contact_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_links.contact_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))
);

-- DELETE permitido para dono do contato e admins/diretores
DROP POLICY IF EXISTS contact_links_delete ON public.contact_links;
CREATE POLICY contact_links_delete
ON public.contact_links
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_links.contact_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','director'))
);

-- 4) Remover coluna contact_type da tabela contacts (a UI será atualizada em seguida)
ALTER TABLE public.contacts
  DROP COLUMN IF EXISTS contact_type;
