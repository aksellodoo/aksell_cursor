-- Criar função para habilitar RLS em tabelas dinâmicas
CREATE OR REPLACE FUNCTION public.enable_table_rls(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Habilitar RLS na tabela
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Criar política para usuários autenticados visualizarem dados
  EXECUTE format('CREATE POLICY "Authenticated users can view protheus data" ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', table_name);
  
  -- Criar política para sistema gerenciar dados (sincronização)
  EXECUTE format('CREATE POLICY "System can manage protheus data" ON public.%I FOR ALL USING (true) WITH CHECK (true)', table_name);
  
  RETURN json_build_object('success', true, 'message', 'RLS habilitado com sucesso');
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Verificar se a tabela existe antes de aplicar RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'protheus_sa1010_721f869c' AND table_schema = 'public') THEN
    -- Habilitar RLS na tabela existente
    ALTER TABLE public.protheus_sa1010_721f869c ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'protheus_sa1010_721f869c' AND policyname = 'Authenticated users can view protheus data') THEN
      CREATE POLICY "Authenticated users can view protheus data" 
        ON public.protheus_sa1010_721f869c 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'protheus_sa1010_721f869c' AND policyname = 'System can manage protheus data') THEN
      CREATE POLICY "System can manage protheus data" 
        ON public.protheus_sa1010_721f869c 
        FOR ALL 
        USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;