-- Secure sensitive customer table: protheus_sa3010_fc3d70f6
-- 1) Ensure RLS is enabled
ALTER TABLE public.protheus_sa3010_fc3d70f6 ENABLE ROW LEVEL SECURITY;

-- 2) Remove overly permissive policy that exposed data publicly
DROP POLICY IF EXISTS "System can manage protheus data" ON public.protheus_sa3010_fc3d70f6;

-- 3) Keep strict SELECT access for admins/directors only (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'protheus_sa3010_fc3d70f6'
      AND p.polname = 'Admins/directors can view protheus_sa3010_fc3d70f6'
  ) THEN
    CREATE POLICY "Admins/directors can view protheus_sa3010_fc3d70f6"
    ON public.protheus_sa3010_fc3d70f6
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY (ARRAY['admin','director'])
      )
    );
  END IF;
END$$;

-- 4) Do not allow INSERT/UPDATE/DELETE by default (no policies created => denied)
-- This ensures data cannot be modified via client unless explicit policies are added later.
