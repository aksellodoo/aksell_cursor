-- Adicionar campo para URL da imagem da estrutura molecular
ALTER TABLE public.site_products 
ADD COLUMN molecular_structure_image_url TEXT;

-- Criar bucket para imagens de estruturas moleculares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-molecular-images', 
  'product-molecular-images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Política para permitir que usuários autenticados leiam as imagens
CREATE POLICY "Imagens de estruturas moleculares são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-molecular-images');

-- Política para permitir que usuários autenticados façam upload
CREATE POLICY "Usuários podem fazer upload de estruturas moleculares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-molecular-images' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir que usuários atualizem suas imagens
CREATE POLICY "Usuários podem atualizar estruturas moleculares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-molecular-images' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir que usuários deletem suas imagens
CREATE POLICY "Usuários podem deletar estruturas moleculares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-molecular-images' 
  AND auth.uid() IS NOT NULL
);