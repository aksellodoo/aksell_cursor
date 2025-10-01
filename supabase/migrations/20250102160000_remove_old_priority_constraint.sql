-- Remover constraint antiga de prioridade que ainda está ativa
-- A constraint antiga permitia apenas 'low', 'medium', 'high', 'urgent'
-- Mas agora usamos enum 'P1', 'P2', 'P3', 'P4'

DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname LIKE '%priority%' 
    AND conrelid = 'public.tasks'::regclass
    AND contype = 'c'
  ) THEN
    -- Encontrar e remover a constraint antiga
    DECLARE
      constraint_name text;
    BEGIN
      SELECT conname INTO constraint_name
      FROM pg_constraint 
      WHERE conname LIKE '%priority%' 
      AND conrelid = 'public.tasks'::regclass
      AND contype = 'c'
      LIMIT 1;
      
      IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Removed old priority constraint: %', constraint_name;
      END IF;
    END;
  END IF;
END $$;

-- Verificar se a coluna priority está usando o enum correto
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'tasks' 
  AND column_name = 'priority';
  
  IF current_type != 'USER-DEFINED' THEN
    -- Converter para enum se ainda não foi convertido
    ALTER TABLE public.tasks 
    ALTER COLUMN priority TYPE public.task_priority
    USING (
      CASE lower(priority::text)
        WHEN 'urgent' THEN 'P1'::public.task_priority
        WHEN 'high'   THEN 'P2'::public.task_priority
        WHEN 'medium' THEN 'P3'::public.task_priority
        WHEN 'low'    THEN 'P4'::public.task_priority
        WHEN 'p1' THEN 'P1'::public.task_priority
        WHEN 'p2' THEN 'P2'::public.task_priority
        WHEN 'p3' THEN 'P3'::public.task_priority
        WHEN 'p4' THEN 'P4'::public.task_priority
        ELSE 'P3'::public.task_priority
      END
    );
    
    ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 'P3';
    RAISE NOTICE 'Converted priority column to enum type';
  ELSE
    RAISE NOTICE 'Priority column already using enum type';
  END IF;
END $$;

