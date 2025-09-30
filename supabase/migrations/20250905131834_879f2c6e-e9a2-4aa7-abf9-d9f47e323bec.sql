
BEGIN;

-- 1) Garantir que todo grupo tenha um código GEC consistente
-- Remover trigger BEFORE que definia o code (se existir)
DROP TRIGGER IF EXISTS tg_purchases_groups_set_code ON public.purchases_economic_groups;

-- Manter a função antiga se for usada em outros lugares, mas criaremos uma nova AFTER
-- para garantir que id_grupo já exista ao gerar o código.
CREATE OR REPLACE FUNCTION public.set_purchases_group_code_after()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.purchases_economic_groups
  SET code = COALESCE(NEW.code, 'GEC-' || lpad(NEW.id_grupo::text, 6, '0'))
  WHERE id_grupo = NEW.id_grupo;
  RETURN NEW;
END;
$$;

-- Criar trigger AFTER INSERT para setar o code com id_grupo já definido
DROP TRIGGER IF EXISTS tg_purchases_groups_set_code_after ON public.purchases_economic_groups;
CREATE TRIGGER tg_purchases_groups_set_code_after
AFTER INSERT ON public.purchases_economic_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_purchases_group_code_after();

-- Atualizar quaisquer registros existentes sem code
UPDATE public.purchases_economic_groups
SET code = 'GEC-' || lpad(id_grupo::text, 6, '0')
WHERE code IS NULL;

-- 2) Função segura para resetar (limpar) todos os grupos e membros de compras
CREATE OR REPLACE FUNCTION public.reset_purchases_economic_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Somente admins ou diretores podem resetar
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'Apenas admins/diretores podem resetar grupos';
  END IF;

  DELETE FROM public.purchases_economic_group_members;
  DELETE FROM public.purchases_economic_groups;
END;
$$;

COMMIT;
