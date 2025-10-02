
-- 1) Garantir buckets públicos (cria se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-molecular-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('product-molecular-images', 'product-molecular-images', true, 10485760, ARRAY['image/png','image/jpeg','image/webp']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'site-products') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('site-products', 'site-products', true, 10485760, ARRAY['image/png','image/jpeg','image/webp']);
  END IF;

  -- Garantir que estão públicos (caso existissem como privados)
  UPDATE storage.buckets SET public = true WHERE id IN ('product-molecular-images','site-products');
END
$$;

-- 2) Políticas para product-molecular-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read for product-molecular-images'
  ) THEN
    CREATE POLICY "Public read for product-molecular-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-molecular-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload to product-molecular-images'
  ) THEN
    CREATE POLICY "Authenticated upload to product-molecular-images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'product-molecular-images' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated update in product-molecular-images'
  ) THEN
    CREATE POLICY "Authenticated update in product-molecular-images"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'product-molecular-images' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete in product-molecular-images'
  ) THEN
    CREATE POLICY "Authenticated delete in product-molecular-images"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'product-molecular-images' AND auth.role() = 'authenticated');
  END IF;
END
$$;

-- 3) Políticas para site-products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read for site-products'
  ) THEN
    CREATE POLICY "Public read for site-products"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-products');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload to site-products'
  ) THEN
    CREATE POLICY "Authenticated upload to site-products"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'site-products' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated update in site-products'
  ) THEN
    CREATE POLICY "Authenticated update in site-products"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'site-products' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete in site-products'
  ) THEN
    CREATE POLICY "Authenticated delete in site-products"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'site-products' AND auth.role() = 'authenticated');
  END IF;
END
$$;
