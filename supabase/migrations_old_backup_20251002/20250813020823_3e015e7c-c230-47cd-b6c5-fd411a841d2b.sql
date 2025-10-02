
-- Leitura pública (somente itens ativos) para a página do site

-- Families: permitir SELECT de itens ativos
DROP POLICY IF EXISTS "Public site can view active families" ON public.site_product_families;
CREATE POLICY "Public site can view active families"
ON public.site_product_families
FOR SELECT
USING (is_active = true);

-- Segments: permitir SELECT de itens ativos
DROP POLICY IF EXISTS "Public site can view active segments" ON public.site_product_segments;
CREATE POLICY "Public site can view active segments"
ON public.site_product_segments
FOR SELECT
USING (is_active = true);

-- Products: permitir SELECT de itens ativos
DROP POLICY IF EXISTS "Public site can view active products" ON public.site_products;
CREATE POLICY "Public site can view active products"
ON public.site_products
FOR SELECT
USING (is_active = true);

-- Map: permitir SELECT somente quando produto e segmento estão ativos
DROP POLICY IF EXISTS "Public site can view active product-segment mapping" ON public.site_product_segments_map;
CREATE POLICY "Public site can view active product-segment mapping"
ON public.site_product_segments_map
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.site_products sp
    WHERE sp.id = site_product_segments_map.product_id
      AND sp.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.site_product_segments ss
    WHERE ss.id = site_product_segments_map.segment_id
      AND ss.is_active = true
  )
);
