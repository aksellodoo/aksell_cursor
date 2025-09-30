-- Create RPC function to count total purchases economic groups
CREATE OR REPLACE FUNCTION public.count_purchases_economic_groups()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.purchases_economic_groups
  );
END;
$function$;