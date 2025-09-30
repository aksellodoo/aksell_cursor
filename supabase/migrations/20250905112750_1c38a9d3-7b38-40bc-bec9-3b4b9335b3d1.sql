-- Verificar e melhorar as políticas RLS para fornecedores unificados
-- Esta migração garante que admins/directors possam sempre editar registros

-- Primeiro, remover a política de UPDATE existente
DROP POLICY IF EXISTS "Unified suppliers update by owner or admins" ON public.purchases_unified_suppliers;

-- Criar nova política de UPDATE mais robusta para admins
CREATE POLICY "Unified suppliers update by owner or admins" 
ON public.purchases_unified_suppliers 
FOR UPDATE 
USING (
  -- Permitir se for o criador do registro
  created_by = auth.uid() 
  OR 
  -- Permitir se created_by for NULL (registros sem criador definido)
  created_by IS NULL
  OR 
  -- Permitir se o usuário for admin/director
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'director')
  )
)
WITH CHECK (
  -- Mesmas condições para verificação após update
  created_by = auth.uid() 
  OR 
  created_by IS NULL
  OR 
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'director')
  )
);

-- Adicionar trigger para "claim ownership" em registros sem criador
CREATE OR REPLACE FUNCTION public.tg_claim_unified_supplier_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o registro não tem criador (created_by NULL) e está sendo atualizado,
  -- definir o usuário atual como criador
  IF OLD.created_by IS NULL AND NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS tg_claim_unified_supplier_ownership ON public.purchases_unified_suppliers;
CREATE TRIGGER tg_claim_unified_supplier_ownership
  BEFORE UPDATE ON public.purchases_unified_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_claim_unified_supplier_ownership();