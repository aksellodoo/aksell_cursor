-- Secure sensitive Protheus customer table
DO $$BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='protheus_sa1010_b0bb3b0c'
  ) THEN
    RAISE NOTICE 'Table public.protheus_sa1010_b0bb3b0c does not exist; skipping.';
  END IF;
END$$;

-- Enable RLS (disables public read by default)
ALTER TABLE IF EXISTS public.protheus_sa1010_b0bb3b0c ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid permissive access
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='protheus_sa1010_b0bb3b0c'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.protheus_sa1010_b0bb3b0c', pol.policyname);
  END LOOP;
END$$;

-- Allow only admins/directors to view
CREATE POLICY "Admins/directors can view protheus_sa1010_b0bb3b0c"
ON public.protheus_sa1010_b0bb3b0c
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin','director')
  )
);

-- No INSERT/UPDATE/DELETE policies: denied by default under RLS
