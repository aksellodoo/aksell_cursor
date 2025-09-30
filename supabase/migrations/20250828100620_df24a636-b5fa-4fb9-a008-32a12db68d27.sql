-- Criar políticas RLS para a tabela site_cities

-- Política para permitir que usuários autenticados vejam todas as cidades
CREATE POLICY "Authenticated users can view cities"
ON public.site_cities
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que usuários autenticados insiram cidades
CREATE POLICY "Authenticated users can insert cities"
ON public.site_cities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Política para permitir que admins/diretores atualizem cidades
CREATE POLICY "Admins and directors can update cities"
ON public.site_cities
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director')
  )
);

-- Política para permitir que admins/diretores deletem cidades
CREATE POLICY "Admins and directors can delete cities"
ON public.site_cities
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director')
  )
);