-- Remove campos de descrição desnecessários dos produtos
ALTER TABLE public.site_products 
DROP COLUMN IF EXISTS description_html,
DROP COLUMN IF EXISTS description_en_html;

-- Remove campo de descrição das aplicações (será usado apenas o nome)
ALTER TABLE public.site_product_applications 
DROP COLUMN IF EXISTS description;