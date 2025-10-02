-- Create RPC function to count unified suppliers without any group association
CREATE OR REPLACE FUNCTION public.count_unified_suppliers_without_group()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.purchases_unified_suppliers us
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.purchases_economic_group_members m 
      WHERE m.unified_supplier_id = us.id
    )
  );
END;
$function$