-- Add id_grupo auto-increment column to protheus_customer_groups
ALTER TABLE protheus_customer_groups 
ADD COLUMN id_grupo SERIAL;

-- Drop dependent foreign key constraints first
ALTER TABLE protheus_customer_group_units 
DROP CONSTRAINT IF EXISTS protheus_customer_group_units_group_id_fkey;

ALTER TABLE protheus_group_update_results 
DROP CONSTRAINT IF EXISTS protheus_group_update_results_group_id_fkey;

-- Now we can drop the old primary key
ALTER TABLE protheus_customer_groups DROP CONSTRAINT protheus_customer_groups_pkey;

-- Make id_grupo the primary key
ALTER TABLE protheus_customer_groups ADD PRIMARY KEY (id_grupo);

-- Add unique constraint for protheus_table_id + filial + cod to maintain existing logic
ALTER TABLE protheus_customer_groups 
ADD CONSTRAINT protheus_customer_groups_table_filial_cod_unique 
UNIQUE (protheus_table_id, filial, cod);

-- Add nome_grupo_sugerido column for AI suggestions
ALTER TABLE protheus_customer_groups 
ADD COLUMN nome_grupo_sugerido TEXT;

-- Update the foreign key references to use id_grupo
ALTER TABLE protheus_customer_group_units 
ADD CONSTRAINT protheus_customer_group_units_id_grupo_fkey 
FOREIGN KEY (group_id) REFERENCES protheus_customer_groups(id_grupo) ON DELETE CASCADE;

ALTER TABLE protheus_group_update_results 
ADD CONSTRAINT protheus_group_update_results_id_grupo_fkey 
FOREIGN KEY (group_id) REFERENCES protheus_customer_groups(id_grupo) ON DELETE CASCADE;

-- Ensure unique constraint on filial+cod+loja for member exclusivity
ALTER TABLE protheus_customer_group_units 
ADD CONSTRAINT protheus_customer_group_units_unique_member 
UNIQUE (protheus_table_id, filial, cod, loja);

-- Create function to get customer groups with id_grupo
CREATE OR REPLACE FUNCTION get_customer_groups_with_id(p_table_id uuid)
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  filial text,
  cod text,
  nome_grupo text,
  nome_grupo_sugerido text,
  member_count integer,
  vendor_names text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pcg.id_grupo,
      pcg.id as group_id,
      pcg.filial,
      pcg.cod,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      pcg.nome_grupo_sugerido,
      COUNT(pgu.group_id)::integer as member_count,
      ARRAY_AGG(DISTINCT 
        CASE WHEN sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
             ELSE sa1.a1_vend::text 
        END
      ) FILTER (WHERE sa1.a1_vend IS NOT NULL) as vendor_names
    FROM public.protheus_customer_groups pcg
    LEFT JOIN public.protheus_customer_group_units pgu ON pgu.group_id = pcg.id_grupo
    LEFT JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    LEFT JOIN %I sa3 ON sa3.a3_cod::text = sa1.a1_vend::text
    WHERE pcg.protheus_table_id = %L
    GROUP BY pcg.id_grupo, pcg.id, pcg.filial, pcg.cod, pcg.name, pcg.ai_suggested_name, pcg.nome_grupo_sugerido
    ORDER BY pcg.id_grupo
  $q$, v_table, 'sa3010_vendedores', p_table_id);
END;
$function$;

-- Create function to get group members
CREATE OR REPLACE FUNCTION get_group_members(p_id_grupo integer, p_table_id uuid)
RETURNS TABLE(
  filial text,
  cod text,
  loja text,
  nome text,
  nome_reduzido text,
  vendor_name text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pgu.filial,
      pgu.cod,
      pgu.loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      COALESCE(sa3.a3_nome::text, sa1.a1_vend::text) as vendor_name
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    LEFT JOIN %I sa3 ON sa3.a3_cod::text = sa1.a1_vend::text
    WHERE pgu.group_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  $q$, v_table, 'sa3010_vendedores', p_id_grupo);
END;
$function$;

-- Create function to search customers for adding to groups
CREATE OR REPLACE FUNCTION search_customers_for_groups(p_table_id uuid, p_search_term text)
RETURNS TABLE(
  filial text,
  cod text,
  loja text,
  nome text,
  nome_reduzido text,
  vendor_name text,
  current_group_id integer,
  current_group_name text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table TEXT;
  v_escaped_search TEXT;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Escape search term
  v_escaped_search := replace(replace(replace(p_search_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sa1.a1_filial::text as filial,
      sa1.a1_cod::text as cod,
      sa1.a1_loja::text as loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      COALESCE(sa3.a3_nome::text, sa1.a1_vend::text) as vendor_name,
      pgu.group_id as current_group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name
    FROM %I sa1
    LEFT JOIN %I sa3 ON sa3.a3_cod::text = sa1.a1_vend::text
    LEFT JOIN public.protheus_customer_group_units pgu ON (
      pgu.protheus_table_id = %L AND
      pgu.filial = sa1.a1_filial::text AND
      pgu.cod = sa1.a1_cod::text AND
      pgu.loja = sa1.a1_loja::text
    )
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = pgu.group_id
    WHERE (
      sa1.a1_nome::text ILIKE %L ESCAPE '\' OR
      sa1.a1_nreduz::text ILIKE %L ESCAPE '\' OR
      sa1.a1_cod::text ILIKE %L ESCAPE '\'
    )
    ORDER BY sa1.a1_filial, sa1.a1_cod, sa1.a1_loja
    LIMIT 50
  $q$, v_table, 'sa3010_vendedores', p_table_id, 
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%');
END;
$function$;

-- Create function to create a new customer group
CREATE OR REPLACE FUNCTION create_customer_group(p_table_id uuid, p_nome_grupo text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id_grupo integer;
BEGIN
  INSERT INTO public.protheus_customer_groups (
    protheus_table_id,
    filial,
    cod,
    name,
    name_source
  ) VALUES (
    p_table_id,
    '00', -- Default filial for new groups
    'NEW_' || extract(epoch from now())::text, -- Unique cod
    p_nome_grupo,
    'manual'
  ) RETURNING id_grupo INTO v_id_grupo;
  
  RETURN v_id_grupo;
END;
$function$;

-- Create function to add member to group with exclusivity
CREATE OR REPLACE FUNCTION add_member_to_group(
  p_id_grupo integer,
  p_table_id uuid,
  p_filial text,
  p_cod text,
  p_loja text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_group_id integer;
  v_old_group_member_count integer;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if member already belongs to another group
    SELECT pgu.group_id INTO v_old_group_id
    FROM public.protheus_customer_group_units pgu
    WHERE pgu.protheus_table_id = p_table_id
      AND pgu.filial = p_filial
      AND pgu.cod = p_cod
      AND pgu.loja = p_loja;

    -- If member belongs to another group, remove from old group
    IF v_old_group_id IS NOT NULL AND v_old_group_id != p_id_grupo THEN
      DELETE FROM public.protheus_customer_group_units
      WHERE protheus_table_id = p_table_id
        AND filial = p_filial
        AND cod = p_cod
        AND loja = p_loja;

      -- Check if old group is now empty
      SELECT COUNT(*) INTO v_old_group_member_count
      FROM public.protheus_customer_group_units
      WHERE group_id = v_old_group_id;

      -- Delete old group if empty
      IF v_old_group_member_count = 0 THEN
        DELETE FROM public.protheus_customer_groups
        WHERE id_grupo = v_old_group_id;
      END IF;
    END IF;

    -- Add member to new group (or update if already exists)
    INSERT INTO public.protheus_customer_group_units (
      protheus_table_id,
      filial,
      cod,
      loja,
      group_id,
      assigned_by
    ) VALUES (
      p_table_id,
      p_filial,
      p_cod,
      p_loja,
      p_id_grupo,
      auth.uid()
    ) ON CONFLICT (protheus_table_id, filial, cod, loja) 
    DO UPDATE SET 
      group_id = p_id_grupo,
      assigned_by = auth.uid();

    RETURN json_build_object(
      'success', true,
      'old_group_deleted', v_old_group_member_count = 0,
      'old_group_id', v_old_group_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$function$;

-- Create function to remove member from group
CREATE OR REPLACE FUNCTION remove_member_from_group(
  p_id_grupo integer,
  p_table_id uuid,
  p_filial text,
  p_cod text,
  p_loja text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_remaining_members integer;
BEGIN
  -- Remove member
  DELETE FROM public.protheus_customer_group_units
  WHERE protheus_table_id = p_table_id
    AND filial = p_filial
    AND cod = p_cod
    AND loja = p_loja
    AND group_id = p_id_grupo;

  -- Check if group is now empty
  SELECT COUNT(*) INTO v_remaining_members
  FROM public.protheus_customer_group_units
  WHERE group_id = p_id_grupo;

  -- Delete group if empty
  IF v_remaining_members = 0 THEN
    DELETE FROM public.protheus_customer_groups
    WHERE id_grupo = p_id_grupo;
    
    RETURN json_build_object(
      'success', true,
      'group_deleted', true
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'group_deleted', false
  );
END;
$function$;

-- Create function to update group name and suggestion
CREATE OR REPLACE FUNCTION update_group_name(
  p_id_grupo integer,
  p_nome_grupo text DEFAULT NULL,
  p_nome_grupo_sugerido text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.protheus_customer_groups
  SET 
    name = COALESCE(p_nome_grupo, name),
    nome_grupo_sugerido = COALESCE(p_nome_grupo_sugerido, nome_grupo_sugerido),
    name_source = CASE WHEN p_nome_grupo IS NOT NULL THEN 'manual' ELSE name_source END
  WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$function$;