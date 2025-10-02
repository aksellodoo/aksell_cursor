-- Site products data model
-- 1) Tables

-- Families
CREATE TABLE IF NOT EXISTS public.site_product_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Segments
CREATE TABLE IF NOT EXISTS public.site_product_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.site_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  family_id uuid NULL REFERENCES public.site_product_families(id) ON DELETE SET NULL,
  compound_type text NULL,
  molecular_formula text NULL,
  molecular_weight numeric NULL,
  cas_number text NULL,
  cas_note text NULL,
  description_html text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product ↔ Segments mapping (many-to-many)
CREATE TABLE IF NOT EXISTS public.site_product_segments_map (
  product_id uuid NOT NULL REFERENCES public.site_products(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES public.site_product_segments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, segment_id)
);

-- 2) Row Level Security
ALTER TABLE public.site_product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_product_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_product_segments_map ENABLE ROW LEVEL SECURITY;

-- Helper predicate: admin/director check (via profiles)
-- Policies: Families
DROP POLICY IF EXISTS "Families: owners can select" ON public.site_product_families;
CREATE POLICY "Families: owners can select"
ON public.site_product_families
FOR SELECT
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Families: owners can insert" ON public.site_product_families;
CREATE POLICY "Families: owners can insert"
ON public.site_product_families
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Families: owners/admin can update" ON public.site_product_families;
CREATE POLICY "Families: owners/admin can update"
ON public.site_product_families
FOR UPDATE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
)
WITH CHECK (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Families: owners/admin can delete" ON public.site_product_families;
CREATE POLICY "Families: owners/admin can delete"
ON public.site_product_families
FOR DELETE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

-- Policies: Segments
DROP POLICY IF EXISTS "Segments: owners can select" ON public.site_product_segments;
CREATE POLICY "Segments: owners can select"
ON public.site_product_segments
FOR SELECT
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Segments: owners can insert" ON public.site_product_segments;
CREATE POLICY "Segments: owners can insert"
ON public.site_product_segments
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Segments: owners/admin can update" ON public.site_product_segments;
CREATE POLICY "Segments: owners/admin can update"
ON public.site_product_segments
FOR UPDATE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
)
WITH CHECK (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Segments: owners/admin can delete" ON public.site_product_segments;
CREATE POLICY "Segments: owners/admin can delete"
ON public.site_product_segments
FOR DELETE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

-- Policies: Products
DROP POLICY IF EXISTS "Products: owners/admin can select" ON public.site_products;
CREATE POLICY "Products: owners/admin can select"
ON public.site_products
FOR SELECT
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Products: owners can insert" ON public.site_products;
CREATE POLICY "Products: owners can insert"
ON public.site_products
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Products: owners/admin can update" ON public.site_products;
CREATE POLICY "Products: owners/admin can update"
ON public.site_products
FOR UPDATE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
)
WITH CHECK (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Products: owners/admin can delete" ON public.site_products;
CREATE POLICY "Products: owners/admin can delete"
ON public.site_products
FOR DELETE
USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

-- Policies: Product-Segment mapping
DROP POLICY IF EXISTS "Map: owners/admin can select" ON public.site_product_segments_map;
CREATE POLICY "Map: owners/admin can select"
ON public.site_product_segments_map
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.site_products sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.id = site_product_segments_map.product_id
      AND (
        sp.created_by = auth.uid() OR (p.role IN ('admin','director') AND p.status = 'active')
      )
  )
);

DROP POLICY IF EXISTS "Map: owners can insert" ON public.site_product_segments_map;
CREATE POLICY "Map: owners can insert"
ON public.site_product_segments_map
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.site_products sp
    WHERE sp.id = site_product_segments_map.product_id
      AND sp.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin','director') AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS "Map: owners/admin can delete" ON public.site_product_segments_map;
CREATE POLICY "Map: owners/admin can delete"
ON public.site_product_segments_map
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.site_products sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.id = site_product_segments_map.product_id
      AND (
        sp.created_by = auth.uid() OR (p.role IN ('admin','director') AND p.status = 'active')
      )
  )
);

DROP POLICY IF EXISTS "Map: owners/admin can update" ON public.site_product_segments_map;
CREATE POLICY "Map: owners/admin can update"
ON public.site_product_segments_map
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.site_products sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.id = site_product_segments_map.product_id
      AND (
        sp.created_by = auth.uid() OR (p.role IN ('admin','director') AND p.status = 'active')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.site_products sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.id = site_product_segments_map.product_id
      AND (
        sp.created_by = auth.uid() OR (p.role IN ('admin','director') AND p.status = 'active')
      )
  )
);

-- 3) Triggers to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_product_families_updated_at'
  ) THEN
    CREATE TRIGGER trg_site_product_families_updated_at
    BEFORE UPDATE ON public.site_product_families
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_product_segments_updated_at'
  ) THEN
    CREATE TRIGGER trg_site_product_segments_updated_at
    BEFORE UPDATE ON public.site_product_segments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_products_updated_at'
  ) THEN
    CREATE TRIGGER trg_site_products_updated_at
    BEFORE UPDATE ON public.site_products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) Useful indexes
CREATE INDEX IF NOT EXISTS idx_site_products_name ON public.site_products (name);
CREATE INDEX IF NOT EXISTS idx_site_products_updated_at ON public.site_products (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_products_family ON public.site_products (family_id);
CREATE INDEX IF NOT EXISTS idx_site_products_cas ON public.site_products (cas_number);

CREATE INDEX IF NOT EXISTS idx_site_product_families_active_name ON public.site_product_families (is_active, name);
CREATE INDEX IF NOT EXISTS idx_site_product_segments_active_name ON public.site_product_segments (is_active, name);
