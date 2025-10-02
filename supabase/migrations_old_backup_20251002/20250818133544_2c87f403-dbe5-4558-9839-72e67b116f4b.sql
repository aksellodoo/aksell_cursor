
-- Habilitar RLS e criar políticas públicas (somente leitura de registros ativos)
-- Todas as criações de políticas são condicionais para evitar duplicidade.

-- site_product_names
ALTER TABLE public.site_product_names ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_product_names' 
      AND policyname = 'Public select active site_product_names'
  ) THEN
    CREATE POLICY "Public select active site_product_names"
      ON public.site_product_names
      FOR SELECT
      USING (is_active = true);
  END IF;
END$$;

-- site_product_applications
ALTER TABLE public.site_product_applications ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_product_applications' 
      AND policyname = 'Public select active site_product_applications'
  ) THEN
    CREATE POLICY "Public select active site_product_applications"
      ON public.site_product_applications
      FOR SELECT
      USING (is_active = true);
  END IF;
END$$;

-- site_products (garantia, caso falte)
ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_products' 
      AND policyname = 'Public select active site_products'
  ) THEN
    CREATE POLICY "Public select active site_products"
      ON public.site_products
      FOR SELECT
      USING (is_active = true);
  END IF;
END$$;

-- site_product_segments_map
ALTER TABLE public.site_product_segments_map ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_product_segments_map' 
      AND policyname = 'Public select site_product_segments_map'
  ) THEN
    CREATE POLICY "Public select site_product_segments_map"
      ON public.site_product_segments_map
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.site_products p
          WHERE p.id = site_product_segments_map.product_id
            AND p.is_active = true
        )
      );
  END IF;
END$$;

-- site_product_groups_map
ALTER TABLE public.site_product_groups_map ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_product_groups_map' 
      AND policyname = 'Public select site_product_groups_map'
  ) THEN
    CREATE POLICY "Public select site_product_groups_map"
      ON public.site_product_groups_map
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.site_products p
          WHERE p.id = site_product_groups_map.product_id
            AND p.is_active = true
        )
      );
  END IF;
END$$;

-- site_product_applications_map
ALTER TABLE public.site_product_applications_map ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_product_applications_map' 
      AND policyname = 'Public select site_product_applications_map'
  ) THEN
    CREATE POLICY "Public select site_product_applications_map"
      ON public.site_product_applications_map
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.site_products p
          WHERE p.id = site_product_applications_map.product_id
            AND p.is_active = true
        )
        AND EXISTS (
          SELECT 1 FROM public.site_product_applications a
          WHERE a.id = site_product_applications_map.application_id
            AND a.is_active = true
        )
      );
  END IF;
END$$;
