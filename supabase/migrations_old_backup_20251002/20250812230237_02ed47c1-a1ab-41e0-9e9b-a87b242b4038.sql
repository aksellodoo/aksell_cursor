
-- 1) Produtos: campos em inglês
ALTER TABLE public.site_products
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS compound_type_en text,
  ADD COLUMN IF NOT EXISTS cas_note_en text,
  ADD COLUMN IF NOT EXISTS description_en_html text;

-- 2) Famílias: adicionar name_en e torná-lo obrigatório após backfill
ALTER TABLE public.site_product_families
  ADD COLUMN IF NOT EXISTS name_en text;

UPDATE public.site_product_families
SET name_en = COALESCE(name_en, name);

ALTER TABLE public.site_product_families
  ALTER COLUMN name_en SET NOT NULL;

-- 3) Segmentos: adicionar name_en e torná-lo obrigatório após backfill
ALTER TABLE public.site_product_segments
  ADD COLUMN IF NOT EXISTS name_en text;

UPDATE public.site_product_segments
SET name_en = COALESCE(name_en, name);

ALTER TABLE public.site_product_segments
  ALTER COLUMN name_en SET NOT NULL;
