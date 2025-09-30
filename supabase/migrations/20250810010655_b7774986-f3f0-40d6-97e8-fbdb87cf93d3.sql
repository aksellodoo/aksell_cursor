-- Adiciona colunas de controle de 2FA por usuário
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_enforced_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS mfa_last_verified_at timestamptz NULL;

-- Índice útil para filtros/relatórios
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_required ON public.profiles (mfa_required);