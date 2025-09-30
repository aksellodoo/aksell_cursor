
-- 1) Novos campos no grupo econômico de compras
ALTER TABLE public.purchases_economic_groups
  ADD COLUMN IF NOT EXISTS assigned_buyer_cod text,
  ADD COLUMN IF NOT EXISTS assigned_buyer_filial text;

-- Índice auxiliar para consultas por comprador designado (opcional)
CREATE INDEX IF NOT EXISTS idx_purchases_groups_buyer
  ON public.purchases_economic_groups (assigned_buyer_cod, assigned_buyer_filial);

-- 2) RPC para atualizar nome e comprador do grupo
CREATE OR REPLACE FUNCTION public.update_purchases_group_details(
  p_id_grupo integer,
  p_name text,
  p_assigned_buyer_cod text,
  p_assigned_buyer_filial text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.purchases_economic_groups
     SET name                  = COALESCE(p_name, name),
         assigned_buyer_cod    = NULLIF(btrim(p_assigned_buyer_cod), ''),
         assigned_buyer_filial = NULLIF(btrim(p_assigned_buyer_filial), ''),
         updated_at            = now()
   WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$function$;
