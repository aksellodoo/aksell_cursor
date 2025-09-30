-- Create table to store individual customer units and their group assignments
CREATE TABLE public.protheus_customer_group_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL,
  filial TEXT NOT NULL,
  cod TEXT NOT NULL,
  loja TEXT NOT NULL,
  group_id UUID NOT NULL REFERENCES public.protheus_customer_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(protheus_table_id, filial, cod, loja)
);

-- Create table to log each execution of the "Atualizar Grupos" button
CREATE TABLE public.protheus_group_update_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL,
  triggered_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  new_groups_count INTEGER DEFAULT 0,
  new_members_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store detailed results of each update run
CREATE TABLE public.protheus_group_update_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.protheus_group_update_runs(id) ON DELETE CASCADE,
  filial TEXT NOT NULL,
  cod TEXT NOT NULL,
  loja TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created_group', 'assigned_to_existing')),
  group_id UUID NOT NULL REFERENCES public.protheus_customer_groups(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.protheus_customer_group_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protheus_group_update_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protheus_group_update_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for protheus_customer_group_units
CREATE POLICY "Customer group units viewable by authenticated users" 
ON public.protheus_customer_group_units 
FOR SELECT 
USING (true);

CREATE POLICY "Customer group units manageable by admins/directors" 
ON public.protheus_customer_group_units 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- RLS policies for protheus_group_update_runs
CREATE POLICY "Group update runs viewable by authenticated users" 
ON public.protheus_group_update_runs 
FOR SELECT 
USING (true);

CREATE POLICY "Group update runs manageable by admins/directors" 
ON public.protheus_group_update_runs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- RLS policies for protheus_group_update_results
CREATE POLICY "Group update results viewable by authenticated users" 
ON public.protheus_group_update_results 
FOR SELECT 
USING (true);

CREATE POLICY "Group update results manageable by admins/directors" 
ON public.protheus_group_update_results 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- Function to update/create customer groups
CREATE OR REPLACE FUNCTION public.update_protheus_customer_groups(p_table_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table TEXT;
  v_run_id UUID;
  v_new_groups_count INTEGER := 0;
  v_new_members_count INTEGER := 0;
  v_unit RECORD;
  v_group_id UUID;
  v_group_exists BOOLEAN;
BEGIN
  -- Get table name
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Create a new run record
  INSERT INTO public.protheus_group_update_runs (protheus_table_id, triggered_by)
  VALUES (p_table_id, auth.uid())
  RETURNING id INTO v_run_id;

  -- Process each unit (filial, cod, loja) that is not yet assigned to any group
  FOR v_unit IN EXECUTE format('
    SELECT DISTINCT 
      a1_filial::text AS filial,
      a1_cod::text AS cod,
      a1_loja::text AS loja,
      a1_nome::text AS nome
    FROM %I sa1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod = sa1.a1_cod::text
        AND pgu.loja = sa1.a1_loja::text
    )
    ORDER BY a1_filial, a1_cod, a1_loja
  ', v_table, p_table_id)
  LOOP
    -- Check if a group already exists for this filial+cod combination
    SELECT id INTO v_group_id
    FROM public.protheus_customer_groups
    WHERE protheus_table_id = p_table_id
      AND filial = v_unit.filial
      AND cod = v_unit.cod
    LIMIT 1;

    v_group_exists := v_group_id IS NOT NULL;

    -- If no group exists, create one
    IF v_group_id IS NULL THEN
      INSERT INTO public.protheus_customer_groups (
        protheus_table_id,
        filial,
        cod,
        name,
        name_source
      ) VALUES (
        p_table_id,
        v_unit.filial,
        v_unit.cod,
        v_unit.nome,
        'auto_created'
      ) RETURNING id INTO v_group_id;
      
      v_new_groups_count := v_new_groups_count + 1;
    END IF;

    -- Assign the unit to the group
    INSERT INTO public.protheus_customer_group_units (
      protheus_table_id,
      filial,
      cod,
      loja,
      group_id,
      assigned_by
    ) VALUES (
      p_table_id,
      v_unit.filial,
      v_unit.cod,
      v_unit.loja,
      v_group_id,
      auth.uid()
    );

    -- Log the action
    INSERT INTO public.protheus_group_update_results (
      run_id,
      filial,
      cod,
      loja,
      action,
      group_id,
      reason
    ) VALUES (
      v_run_id,
      v_unit.filial,
      v_unit.cod,
      v_unit.loja,
      CASE WHEN v_group_exists THEN 'assigned_to_existing' ELSE 'created_group' END,
      v_group_id,
      CASE WHEN v_group_exists THEN 'Associado ao grupo existente' ELSE 'Novo grupo criado' END
    );

    v_new_members_count := v_new_members_count + 1;
  END LOOP;

  -- Update unit counts for all affected groups
  UPDATE public.protheus_customer_groups
  SET unit_count = (
    SELECT COUNT(*)
    FROM public.protheus_customer_group_units pgu
    WHERE pgu.group_id = protheus_customer_groups.id
  )
  WHERE protheus_table_id = p_table_id;

  -- Update run completion
  UPDATE public.protheus_group_update_runs
  SET 
    finished_at = now(),
    new_groups_count = v_new_groups_count,
    new_members_count = v_new_members_count
  WHERE id = v_run_id;

  RETURN json_build_object(
    'run_id', v_run_id,
    'new_groups_count', v_new_groups_count,
    'new_members_count', v_new_members_count
  );
END;
$$;

-- Function to list all group units (for "Listagem" tab)
CREATE OR REPLACE FUNCTION public.list_group_units(p_table_id UUID)
RETURNS TABLE(
  filial TEXT,
  cod TEXT,
  loja TEXT,
  nome TEXT,
  group_id UUID,
  group_name TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format('
    SELECT 
      pgu.filial,
      pgu.cod,
      pgu.loja,
      sa1.a1_nome::text AS nome,
      pgu.group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text) AS group_name,
      pgu.assigned_at
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    JOIN public.protheus_customer_groups pcg ON pcg.id = pgu.group_id
    WHERE pgu.protheus_table_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  ', v_table, p_table_id);
END;
$$;

-- Function to get last update results (for "Novos" tab)
CREATE OR REPLACE FUNCTION public.get_last_group_update_results(p_table_id UUID)
RETURNS TABLE(
  filial TEXT,
  cod TEXT,
  loja TEXT,
  nome TEXT,
  action TEXT,
  group_name TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table TEXT;
  v_last_run_id UUID;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Get the last run ID
  SELECT id INTO v_last_run_id
  FROM public.protheus_group_update_runs
  WHERE protheus_table_id = p_table_id
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_last_run_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format('
    SELECT 
      pgur.filial,
      pgur.cod,
      pgur.loja,
      sa1.a1_nome::text AS nome,
      pgur.action,
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text) AS group_name,
      pgur.reason,
      pgur.created_at
    FROM public.protheus_group_update_results pgur
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgur.filial AND
      sa1.a1_cod::text = pgur.cod AND
      sa1.a1_loja::text = pgur.loja
    )
    JOIN public.protheus_customer_groups pcg ON pcg.id = pgur.group_id
    WHERE pgur.run_id = %L
    ORDER BY pgur.created_at DESC
  ', v_table, v_last_run_id);
END;
$$;