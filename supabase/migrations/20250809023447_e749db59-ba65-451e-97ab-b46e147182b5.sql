-- Office 365 integration: accounts and OAuth tokens

-- 1) Helper function to auto-update updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Microsoft accounts table
CREATE TABLE IF NOT EXISTS public.microsoft_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ms_account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ms_account_id),
  UNIQUE (ms_account_id)
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_ms_accounts_user ON public.microsoft_accounts(user_id);

-- 3) OAuth tokens table
CREATE TABLE IF NOT EXISTS public.ms_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microsoft_account_id UUID NOT NULL REFERENCES public.microsoft_accounts(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  token_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Enable RLS
ALTER TABLE public.microsoft_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies
-- Users can manage only their own microsoft_accounts rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'microsoft_accounts' AND policyname = 'Users manage own ms accounts'
  ) THEN
    CREATE POLICY "Users manage own ms accounts"
    ON public.microsoft_accounts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Tokens: no SELECT policy (deny by default). Allow write ops only if token belongs to the user's own account
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ms_oauth_tokens' AND policyname = 'Users can insert their own tokens'
  ) THEN
    CREATE POLICY "Users can insert their own tokens"
    ON public.ms_oauth_tokens
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.microsoft_accounts ma 
      WHERE ma.id = microsoft_account_id AND ma.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ms_oauth_tokens' AND policyname = 'Users can update their own tokens'
  ) THEN
    CREATE POLICY "Users can update their own tokens"
    ON public.ms_oauth_tokens
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.microsoft_accounts ma 
      WHERE ma.id = microsoft_account_id AND ma.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.microsoft_accounts ma 
      WHERE ma.id = microsoft_account_id AND ma.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ms_oauth_tokens' AND policyname = 'Users can delete their own tokens'
  ) THEN
    CREATE POLICY "Users can delete their own tokens"
    ON public.ms_oauth_tokens
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.microsoft_accounts ma 
      WHERE ma.id = microsoft_account_id AND ma.user_id = auth.uid()
    ));
  END IF;
END $$;

-- 6) updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_microsoft_accounts_updated_at'
  ) THEN
    CREATE TRIGGER set_microsoft_accounts_updated_at
    BEFORE UPDATE ON public.microsoft_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_ms_oauth_tokens_updated_at'
  ) THEN
    CREATE TRIGGER set_ms_oauth_tokens_updated_at
    BEFORE UPDATE ON public.ms_oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;