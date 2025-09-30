
-- 1) Tipo enum para o status (seguro contra ausência)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'unified_account_status'
  ) THEN
    CREATE TYPE public.unified_account_status AS ENUM (
      'lead_only', 'customer', 'lead_and_customer', 'archived'
    );
  END IF;
END$$;

-- 2) Tabela unified_accounts
CREATE TABLE IF NOT EXISTS public.unified_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  status public.unified_account_status NOT NULL DEFAULT 'lead_only',
  lead_id uuid NULL,
  protheus_table_id uuid NULL,
  protheus_filial text NULL,
  protheus_cod text NULL,
  protheus_loja text NULL,
  cnpj text NULL,
  email text NULL,
  phone text NULL,
  uf text NULL,
  city text NULL,
  vendor text NULL,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) RLS
ALTER TABLE public.unified_accounts ENABLE ROW LEVEL SECURITY;

-- Leitura por qualquer usuário autenticado
CREATE POLICY "Unified accounts viewable by authenticated users"
  ON public.unified_accounts
  FOR SELECT
  USING (true);

-- Inserção pelo criador
CREATE POLICY "Unified accounts insert by creator"
  ON public.unified_accounts
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Inserção por administradores/diretores
CREATE POLICY "Unified accounts insert by admins/directors"
  ON public.unified_accounts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY(ARRAY['admin','director'])
    )
  );

-- Atualização pelo criador
CREATE POLICY "Unified accounts update by creator"
  ON public.unified_accounts
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Atualização por administradores/diretores
CREATE POLICY "Unified accounts update by admins/directors"
  ON public.unified_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY(ARRAY['admin','director'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY(ARRAY['admin','director'])
    )
  );

-- Exclusão pelo criador
CREATE POLICY "Unified accounts delete by creator"
  ON public.unified_accounts
  FOR DELETE
  USING (created_by = auth.uid());

-- Exclusão por administradores/diretores
CREATE POLICY "Unified accounts delete by admins/directors"
  ON public.unified_accounts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY(ARRAY['admin','director'])
    )
  );

-- 4) Função/trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_unified_accounts_updated_at ON public.unified_accounts;
CREATE TRIGGER set_unified_accounts_updated_at
BEFORE UPDATE ON public.unified_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5) Índices úteis
CREATE INDEX IF NOT EXISTS idx_unified_accounts_created_at
  ON public.unified_accounts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_accounts_display_name
  ON public.unified_accounts (display_name);
