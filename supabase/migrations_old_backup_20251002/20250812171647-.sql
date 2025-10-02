-- Security hardening migration

-- 1) Create table for external form login attempts (used by external-form-auth)
CREATE TABLE IF NOT EXISTS public.form_external_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_lower text NOT NULL,
  ip_hash text NOT NULL,
  user_agent text,
  form_id uuid,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and do not expose any client policies (Edge Functions use service role)
ALTER TABLE IF EXISTS public.form_external_login_attempts ENABLE ROW LEVEL SECURITY;

-- Useful indexes for rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_fela_ip_time ON public.form_external_login_attempts (ip_hash, attempted_at);
CREATE INDEX IF NOT EXISTS idx_fela_email_time ON public.form_external_login_attempts (email_lower, attempted_at);


-- 2) Lock down sensitive token/session tables to Edge Functions only
-- password_reset_tokens
ALTER TABLE IF EXISTS public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record; 
BEGIN
  FOR pol IN 
    SELECT polname FROM pg_policies 
    WHERE schemaname='public' AND tablename='password_reset_tokens'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.password_reset_tokens', pol.polname);
  END LOOP;
END$$;
REVOKE ALL ON TABLE public.password_reset_tokens FROM anon, authenticated;

-- form_external_sessions
ALTER TABLE IF EXISTS public.form_external_sessions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record; 
BEGIN
  FOR pol IN 
    SELECT polname FROM pg_policies 
    WHERE schemaname='public' AND tablename='form_external_sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.form_external_sessions', pol.polname);
  END LOOP;
END$$;
REVOKE ALL ON TABLE public.form_external_sessions FROM anon, authenticated;

-- approval_tokens
ALTER TABLE IF EXISTS public.approval_tokens ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record; 
BEGIN
  FOR pol IN 
    SELECT polname FROM pg_policies 
    WHERE schemaname='public' AND tablename='approval_tokens'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.approval_tokens', pol.polname);
  END LOOP;
END$$;
REVOKE ALL ON TABLE public.approval_tokens FROM anon, authenticated;


-- 3) Remove unsafe function that writes directly into auth schema
DROP FUNCTION IF EXISTS public.change_user_password(text);


-- 4) Enforce rate limit server-side for pending_access_requests inserts
CREATE OR REPLACE FUNCTION public.enforce_pending_requests_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  allowed boolean;
BEGIN
  -- If request_ip_hash is missing, log and allow (to avoid false positives) but keep visibility
  IF NEW.request_ip_hash IS NULL THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (gen_random_uuid(), 'pending_access_rate_limit', NULL, 'missing_ip_hash', '00000000-0000-0000-0000-000000000000', 'system');
    RETURN NEW;
  END IF;

  allowed := public.check_ip_rate_limit(NEW.request_ip_hash);
  IF NOT allowed THEN
    RAISE EXCEPTION 'Too many requests from this IP. Please try again later.' USING ERRCODE = '42901';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pending_access_rate_limit ON public.pending_access_requests;
CREATE TRIGGER trg_pending_access_rate_limit
BEFORE INSERT ON public.pending_access_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_pending_requests_rate_limit();

-- Helpful index for IP throttling on pending requests
CREATE INDEX IF NOT EXISTS idx_pending_access_ip_created ON public.pending_access_requests (request_ip_hash, created_at);
