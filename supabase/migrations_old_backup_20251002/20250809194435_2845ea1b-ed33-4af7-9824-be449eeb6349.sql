-- Fix ordering: create tables first, then policies referencing them
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Drafts table
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

DROP TRIGGER IF EXISTS set_email_drafts_updated_at ON public.email_drafts;
CREATE TRIGGER set_email_drafts_updated_at
BEFORE UPDATE ON public.email_drafts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Shares table
CREATE TABLE IF NOT EXISTS public.email_draft_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(draft_id, user_id)
);

-- 3) Tags tables
CREATE TABLE IF NOT EXISTS public.email_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_draft_tags (
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.email_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (draft_id, tag_id)
);

-- Enable RLS after all tables exist
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_draft_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_draft_tags ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- email_drafts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_drafts' AND policyname='Owners and sharees can read drafts'
  ) THEN
    CREATE POLICY "Owners and sharees can read drafts"
    ON public.email_drafts FOR SELECT
    USING (
      owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.email_draft_shares s
        WHERE s.draft_id = email_drafts.id AND s.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_drafts' AND policyname='Owners and sharees can update drafts'
  ) THEN
    CREATE POLICY "Owners and sharees can update drafts"
    ON public.email_drafts FOR UPDATE
    USING (
      owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.email_draft_shares s
        WHERE s.draft_id = email_drafts.id AND s.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_drafts' AND policyname='Only owners can delete drafts'
  ) THEN
    CREATE POLICY "Only owners can delete drafts"
    ON public.email_drafts FOR DELETE
    USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_drafts' AND policyname='Users can insert their own drafts'
  ) THEN
    CREATE POLICY "Users can insert their own drafts"
    ON public.email_drafts FOR INSERT
    WITH CHECK (owner_id = auth.uid());
  END IF;

  -- email_draft_shares
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_draft_shares' AND policyname='Owners can manage shares for their drafts'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_draft_shares' AND policyname='Sharees can read share entries for their access'
  ) THEN
    CREATE POLICY "Sharees can read share entries for their access"
    ON public.email_draft_shares FOR SELECT
    USING (user_id = auth.uid());
  END IF;

  -- email_tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tags' AND policyname='Anyone can read tags'
  ) THEN
    CREATE POLICY "Anyone can read tags"
    ON public.email_tags FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tags' AND policyname='Users can create tags'
  ) THEN
    CREATE POLICY "Users can create tags"
    ON public.email_tags FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tags' AND policyname='Creators can update/delete their tags'
  ) THEN
    CREATE POLICY "Creators can update/delete their tags"
    ON public.email_tags FOR UPDATE USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tags' AND policyname='Creators can delete their tags'
  ) THEN
    CREATE POLICY "Creators can delete their tags"
    ON public.email_tags FOR DELETE USING (created_by = auth.uid());
  END IF;

  -- email_draft_tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_draft_tags' AND policyname='Owners and sharees can manage draft tags'
  ) THEN
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
  END IF;
END $$;