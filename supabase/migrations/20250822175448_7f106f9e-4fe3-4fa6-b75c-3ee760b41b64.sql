
-- Garantir RLS habilitado
ALTER TABLE public.site_product_applications ENABLE ROW LEVEL SECURITY;

-- Limpar políticas que vamos recriar (idempotente)
DROP POLICY IF EXISTS "Authenticated users can view site applications" ON public.site_product_applications;
DROP POLICY IF EXISTS "Users can insert applications with permissions" ON public.site_product_applications;
DROP POLICY IF EXISTS "Users can update applications with permissions" ON public.site_product_applications;
DROP POLICY IF EXISTS "Users can delete applications with permissions" ON public.site_product_applications;

-- IMPORTANTE: vamos MANTER a política de SELECT pública existente
-- "Public select active site_product_applications" (para o site público)

-- SELECT: usuários autenticados podem ver (inclui ativos e inativos)
CREATE POLICY "Authenticated users can view site applications"
ON public.site_product_applications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT com permissão por página (Dados do Site)
CREATE POLICY "Users can insert applications with permissions"
ON public.site_product_applications
FOR INSERT
WITH CHECK (public.user_can_modify_page('Dados do Site', auth.uid()));

-- UPDATE com permissão por página (Dados do Site)
CREATE POLICY "Users can update applications with permissions"
ON public.site_product_applications
FOR UPDATE
USING (public.user_can_modify_page('Dados do Site', auth.uid()));

-- DELETE com permissão por página (Dados do Site)
CREATE POLICY "Users can delete applications with permissions"
ON public.site_product_applications
FOR DELETE
USING (public.user_can_modify_page('Dados do Site', auth.uid()));
