
-- 1) Criar nomes que faltam e vincular produtos sem name_id

-- Criar nomes ausentes a partir de site_products.name
INSERT INTO public.site_product_names (id, name, name_en, is_active, created_by)
SELECT gen_random_uuid(), sp.name, sp.name_en, true,
       COALESCE(sp.created_by, '00000000-0000-0000-0000-000000000000')
FROM public.site_products sp
LEFT JOIN public.site_product_names n ON n.name = sp.name
WHERE sp.name_id IS NULL
  AND sp.name IS NOT NULL
  AND btrim(sp.name) <> ''
  AND n.id IS NULL;

-- Atualizar site_products.name_id usando os nomes criados/encontrados
UPDATE public.site_products sp
SET name_id = n.id
FROM public.site_product_names n
WHERE sp.name_id IS NULL
  AND n.name = sp.name;

-- 2) Índices úteis (idempotentes)
CREATE INDEX IF NOT EXISTS idx_site_product_names_name ON public.site_product_names (name);
CREATE INDEX IF NOT EXISTS idx_site_products_name_id ON public.site_products (name_id);
CREATE INDEX IF NOT EXISTS idx_site_products_name ON public.site_products (name);

-- 3) Foreign key para habilitar o relacionamento e garantir integridade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_site_products_name_id'
      AND conrelid = 'public.site_products'::regclass
  ) THEN
    ALTER TABLE public.site_products
      ADD CONSTRAINT fk_site_products_name_id
      FOREIGN KEY (name_id)
      REFERENCES public.site_product_names (id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Trigger para prevenir que volte a acontecer
CREATE OR REPLACE FUNCTION public.ensure_site_product_name_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name_id uuid;
  v_creator uuid;
BEGIN
  -- Se não houver nome, não há o que vincular
  IF NEW.name IS NULL OR btrim(NEW.name) = '' THEN
    RETURN NEW;
  END IF;

  -- Se já houver name_id, não faz nada
  IF NEW.name_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tenta localizar o nome exatamente igual
  SELECT id INTO v_name_id
  FROM public.site_product_names
  WHERE name = NEW.name
  LIMIT 1;

  -- Se não existe, cria
  IF v_name_id IS NULL THEN
    v_creator := auth.uid(); -- pode ser NULL em contexto sem usuário
    INSERT INTO public.site_product_names (name, name_en, is_active, created_by)
    VALUES (NEW.name, NEW.name_en, true, v_creator)
    RETURNING id INTO v_name_id;
  END IF;

  -- Preenche o vínculo
  NEW.name_id := v_name_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_site_product_name_id ON public.site_products;
CREATE TRIGGER trg_ensure_site_product_name_id
BEFORE INSERT OR UPDATE OF name, name_id
ON public.site_products
FOR EACH ROW
EXECUTE FUNCTION public.ensure_site_product_name_id();
