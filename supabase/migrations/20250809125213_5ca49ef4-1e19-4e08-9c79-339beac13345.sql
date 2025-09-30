-- Create user_email_preferences table and policies
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_sync_value INTEGER NOT NULL DEFAULT 30,
  email_sync_unit TEXT NOT NULL DEFAULT 'days',
  signature_html TEXT,
  signature_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_email_preferences_user_unique UNIQUE (user_id),
  CONSTRAINT email_sync_unit_valid CHECK (email_sync_unit IN ('days','months','years'))
);

-- Enable RLS
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Generic updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_user_email_preferences_updated_at ON public.user_email_preferences;
CREATE TRIGGER update_user_email_preferences_updated_at
BEFORE UPDATE ON public.user_email_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
DROP POLICY IF EXISTS "Users can view own email prefs" ON public.user_email_preferences;
CREATE POLICY "Users can view own email prefs"
ON public.user_email_preferences
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email prefs" ON public.user_email_preferences;
CREATE POLICY "Users can insert own email prefs"
ON public.user_email_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email prefs" ON public.user_email_preferences;
CREATE POLICY "Users can update own email prefs"
ON public.user_email_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own email prefs" ON public.user_email_preferences;
CREATE POLICY "Users can delete own email prefs"
ON public.user_email_preferences
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and directors can view all email prefs" ON public.user_email_preferences;
CREATE POLICY "Admins and directors can view all email prefs"
ON public.user_email_preferences
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role IN ('admin','director')
));

-- Unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_preferences_user ON public.user_email_preferences(user_id);