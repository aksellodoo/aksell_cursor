
-- 1) Adicionar a coluna de controle
ALTER TABLE public.protheus_tables
ADD COLUMN IF NOT EXISTS linked_outside_protheus boolean NOT NULL DEFAULT false;

-- 2) Função que impede exclusão quando a tabela está linkada fora do Protheus
CREATE OR REPLACE FUNCTION public.prevent_delete_linked_protheus_table()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.linked_outside_protheus = true THEN
    RAISE EXCEPTION 'Esta tabela está linkada fora do Protheus e não pode ser deletada.'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$function$;

-- 3) Trigger BEFORE DELETE na tabela protheus_tables
DROP TRIGGER IF EXISTS trg_prevent_delete_linked_protheus ON public.protheus_tables;

CREATE TRIGGER trg_prevent_delete_linked_protheus
BEFORE DELETE ON public.protheus_tables
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_linked_protheus_table();

-- 4) Marcar SA3010 como linkada (proteção ativa)
UPDATE public.protheus_tables
SET linked_outside_protheus = true
WHERE UPPER(table_name) = 'SA3010';
