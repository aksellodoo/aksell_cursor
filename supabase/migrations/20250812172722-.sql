-- Strengthen RLS for portal_users and form_external_recipients, and hide sensitive fields

-- 1) portal_users: add active-profile requirement and limit visibility to active rows
ALTER TABLE IF EXISTS public.portal_users ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='portal_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.portal_users', pol.policyname);
  END LOOP;
END$$;

-- View policy: Admin/Director with active profile
CREATE POLICY "Admins/directors can view portal users"
ON public.portal_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
  AND is_active = true
);

-- View policy: Portal owner (creator of the portal) with active profile
CREATE POLICY "Portal owner can view portal users"
ON public.portal_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id
      AND prt.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.status = 'active'
  )
);

-- Insert policy: Admin/Director
CREATE POLICY "Admins/directors can insert portal users"
ON public.portal_users
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

-- Insert policy: Portal owner
CREATE POLICY "Portal owner can insert portal users"
ON public.portal_users
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id
      AND prt.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.status = 'active'
  )
);

-- Update policy: Admin/Director
CREATE POLICY "Admins/directors can update portal users"
ON public.portal_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
)
WITH CHECK (true);

-- Update policy: Portal owner
CREATE POLICY "Portal owner can update portal users"
ON public.portal_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id
      AND prt.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id
      AND prt.created_by = auth.uid()
  )
);

-- Delete policy: Admin/Director
CREATE POLICY "Admins/directors can delete portal users"
ON public.portal_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

-- Delete policy: Portal owner
CREATE POLICY "Portal owner can delete portal users"
ON public.portal_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id
      AND prt.created_by = auth.uid()
  )
);


-- 2) form_external_recipients: strong RLS + privilege minimization hiding password_hash
ALTER TABLE IF EXISTS public.form_external_recipients ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='form_external_recipients'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.form_external_recipients', pol.policyname);
  END LOOP;
END$$;

-- Revoke all default privileges from anon/authenticated
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_external_recipients') THEN
    REVOKE ALL ON TABLE public.form_external_recipients FROM anon, authenticated;
  END IF;
END$$;

-- Grant least-privilege: allow SELECT of non-sensitive columns only
GRANT SELECT (id, form_id, name, email, is_active, created_at, last_access, access_count)
ON public.form_external_recipients TO authenticated;

-- Allow INSERT on safe columns only (password_hash excluded)
GRANT INSERT (form_id, name, email, is_active)
ON public.form_external_recipients TO authenticated;

-- Allow UPDATE on safe columns only
GRANT UPDATE (name, email, is_active)
ON public.form_external_recipients TO authenticated;

-- SELECT policies
CREATE POLICY "Admins/directors can view external recipients"
ON public.form_external_recipients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

CREATE POLICY "Form owners can view external recipients"
ON public.form_external_recipients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_external_recipients.form_id
      AND f.created_by = auth.uid()
  )
);

-- INSERT policies
CREATE POLICY "Admins/directors can insert external recipients"
ON public.form_external_recipients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

CREATE POLICY "Form owners can insert external recipients"
ON public.form_external_recipients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_external_recipients.form_id
      AND f.created_by = auth.uid()
  )
);

-- UPDATE policies
CREATE POLICY "Admins/directors can update external recipients"
ON public.form_external_recipients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
)
WITH CHECK (true);

CREATE POLICY "Form owners can update external recipients"
ON public.form_external_recipients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_external_recipients.form_id
      AND f.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_external_recipients.form_id
      AND f.created_by = auth.uid()
  )
);

-- DELETE policies (rarely used; still lock to admins or owners)
CREATE POLICY "Admins/directors can delete external recipients"
ON public.form_external_recipients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin','director')
  )
);

CREATE POLICY "Form owners can delete external recipients"
ON public.form_external_recipients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_external_recipients.form_id
      AND f.created_by = auth.uid()
  )
);
