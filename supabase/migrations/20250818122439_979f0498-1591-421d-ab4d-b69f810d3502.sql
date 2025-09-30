
-- 1) Remover políticas antigas restritivas
DROP POLICY IF EXISTS "Admins/directors can view product names" ON public.site_product_names;
DROP POLICY IF EXISTS "Admins/directors can insert product names" ON public.site_product_names;
DROP POLICY IF EXISTS "Admins/directors can update product names" ON public.site_product_names;
DROP POLICY IF EXISTS "Admins/directors can delete product names" ON public.site_product_names;

-- Garantir que RLS está habilitado
ALTER TABLE public.site_product_names ENABLE ROW LEVEL SECURITY;

-- 2) Novas políticas mais adequadas

-- 2.a) Qualquer usuário autenticado pode visualizar nomes (ativos e inativos)
CREATE POLICY "Authenticated users can view product names"
ON public.site_product_names
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2.b) Usuários podem inserir nomes que eles mesmos criam
CREATE POLICY "Users can insert their own product names"
ON public.site_product_names
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- 2.c) Criador pode atualizar seus nomes
CREATE POLICY "Creators can update their product names"
ON public.site_product_names
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 2.d) Admins/diretores podem gerenciar tudo (ALL)
CREATE POLICY "Admins/directors can manage product names"
ON public.site_product_names
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

-- (Opcional manter delete só admin/diretor; a política ALL acima já cobre.
-- Se quiser explicitar, descomente abaixo e remova DELETE do ALL.)
-- CREATE POLICY "Admins/directors can delete product names"
-- ON public.site_product_names
-- FOR DELETE
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles p
--     WHERE p.id = auth.uid()
--       AND p.status = 'active'
--       AND p.role IN ('admin','director')
--   )
-- );

-- 3) Backfill para sincronizar os campos 'name' e 'name_en' dos produtos
UPDATE public.site_products sp
SET
  name = spn.name,
  name_en = spn.name_en
FROM public.site_product_names spn
WHERE sp.name_id = spn.id
  AND (sp.name IS DISTINCT FROM spn.name OR sp.name_en IS DISTINCT FROM spn.name_en);
