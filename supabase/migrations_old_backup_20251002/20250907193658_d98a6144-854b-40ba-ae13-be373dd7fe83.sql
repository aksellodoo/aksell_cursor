
-- 1) Tipo enum para nível de decisão
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_decision_level') THEN
    CREATE TYPE public.contact_decision_level AS ENUM ('estrategico', 'tatico', 'operacional');
  END IF;
END $$;

-- 2) Novas colunas na tabela contacts (todas opcionais no banco)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS decision_level public.contact_decision_level,
  ADD COLUMN IF NOT EXISTS responsible_user_id uuid,
  ADD COLUMN IF NOT EXISTS responsible_department_id uuid,
  ADD COLUMN IF NOT EXISTS email_primary text,
  ADD COLUMN IF NOT EXISTS email_secondary text,
  ADD COLUMN IF NOT EXISTS mobile_phone text,
  ADD COLUMN IF NOT EXISTS landline_phone text,
  ADD COLUMN IF NOT EXISTS messaging_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS messaging_telegram boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS messaging_phone text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS city_id uuid;

-- 3) Chaves estrangeiras (criadas apenas se ainda não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_responsible_user_fk') THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_responsible_user_fk
      FOREIGN KEY (responsible_user_id)
      REFERENCES public.profiles (id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_responsible_department_fk') THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_responsible_department_fk
      FOREIGN KEY (responsible_department_id)
      REFERENCES public.departments (id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_city_fk') THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_city_fk
      FOREIGN KEY (city_id)
      REFERENCES public.site_cities (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Índices úteis para filtros
CREATE INDEX IF NOT EXISTS idx_contacts_responsible_user_id ON public.contacts (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_responsible_department_id ON public.contacts (responsible_department_id);
CREATE INDEX IF NOT EXISTS idx_contacts_city_id ON public.contacts (city_id);
CREATE INDEX IF NOT EXISTS idx_contacts_decision_level ON public.contacts (decision_level);
