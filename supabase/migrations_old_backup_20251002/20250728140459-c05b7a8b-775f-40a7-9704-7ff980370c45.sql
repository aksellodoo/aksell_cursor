-- Correção das permissões RLS para edição de usuários
-- Problema: Apenas o próprio usuário pode editar seu perfil
-- Solução: Permitir que admins/diretores/RH editem qualquer perfil

-- Dropar política atual restritiva
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar nova política com permissões hierárquicas
CREATE POLICY "Users can update profiles with role permissions" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Usuário pode editar seu próprio perfil OU
  (auth.uid() = id) OR 
  -- Usuário tem role admin/director/hr e pode editar qualquer perfil
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director', 'hr')
  ))
);