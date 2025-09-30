
-- Permitir que admin e diretor ATUALIZEM qualquer formulário
CREATE POLICY "Admins/directors can update forms"
ON public.forms
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director')
  )
);

-- Permitir que admin e diretor EXCLUAM qualquer formulário
CREATE POLICY "Admins/directors can delete forms"
ON public.forms
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director')
  )
);
