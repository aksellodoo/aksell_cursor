
-- 1) Garantir que o campo aceite NULL
ALTER TABLE public.profiles
  ALTER COLUMN created_by DROP NOT NULL;

-- 2) Recriar a FK com ON DELETE SET NULL
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
