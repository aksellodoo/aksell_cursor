-- Email drafts, tags, and sharing schema
-- Helper function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Email drafts table
CREATE TABLE IF NOT EXISTS public.email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  subject TEXT,
  html TEXT,
  to_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  bcc_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_drafts_owner_fk FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_email_drafts_updated_at ON public.email_drafts;
CREATE TRIGGER set_email_drafts_updated_at
BEFORE UPDATE ON public.email_drafts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners and sharees can read drafts"
ON public.email_drafts FOR SELECT
USING (
  owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.email_draft_shares s
    WHERE s.draft_id = email_drafts.id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and sharees can update drafts"
ON public.email_drafts FOR UPDATE
USING (
  owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.email_draft_shares s
    WHERE s.draft_id = email_drafts.id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Only owners can delete drafts"
ON public.email_drafts FOR DELETE
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own drafts"
ON public.email_drafts FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Shares table
CREATE TABLE IF NOT EXISTS public.email_draft_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(draft_id, user_id)
);

ALTER TABLE public.email_draft_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shares for their drafts"
ON public.email_draft_shares FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.email_drafts d
    WHERE d.id = email_draft_shares.draft_id AND d.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.email_drafts d
    WHERE d.id = email_draft_shares.draft_id AND d.owner_id = auth.uid()
  )
);

CREATE POLICY "Sharees can read share entries for their access"
ON public.email_draft_shares FOR SELECT
USING (user_id = auth.uid());

-- Tags
CREATE TABLE IF NOT EXISTS public.email_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
ON public.email_tags FOR SELECT USING (true);

CREATE POLICY "Users can create tags"
ON public.email_tags FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update/delete their tags"
ON public.email_tags FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their tags"
ON public.email_tags FOR DELETE USING (created_by = auth.uid());

-- Drafts <-> Tags
CREATE TABLE IF NOT EXISTS public.email_draft_tags (
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.email_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (draft_id, tag_id)
);

ALTER TABLE public.email_draft_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and sharees can manage draft tags"
ON public.email_draft_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.email_drafts d
    WHERE d.id = email_draft_tags.draft_id AND (
      d.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.email_draft_shares s WHERE s.draft_id = d.id AND s.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.email_drafts d
    WHERE d.id = email_draft_tags.draft_id AND (
      d.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.email_draft_shares s WHERE s.draft_id = d.id AND s.user_id = auth.uid()
      )
    )
  )
);
