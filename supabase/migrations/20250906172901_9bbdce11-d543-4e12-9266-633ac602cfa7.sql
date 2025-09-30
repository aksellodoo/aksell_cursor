
CREATE OR REPLACE FUNCTION public.create_missing_purchases_groups()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa2 text;
  v_groups_created int := 0;
  v_group_sets_processed int := 0;
  v_suppliers_processed int := 0;
  v_group_id int;
  v_rec record;
  v_name text;
  v_buyer_cod text;
  v_buyer_filial text;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'select 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz
                    where false';
  END IF;

  FOR v_rec IN EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    candidates AS (
      SELECT 
        us.id as unified_id,
        us.protheus_filial::text as filial,
        us.protheus_cod::text as cod,
        us.protheus_loja::text as loja,
        -- Nome base para exibição
        COALESCE(sa2.a2_nreduz::text, ps.trade_name::text, sa2.a2_nome::text, ps.legal_name::text) as unit_name,
        -- Comprador herdado: prioridade Unified -> Potencial
        COALESCE(nullif(btrim(us.assigned_buyer_cod),''), nullif(btrim(ps.assigned_buyer_cod),'')) as buyer_cod,
        COALESCE(
          nullif(btrim(us.assigned_buyer_filial), ''),
          nullif(btrim(ps.assigned_buyer_filial), ''),
          '01'
        ) as buyer_filial
      FROM public.purchases_unified_suppliers us
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
      LEFT JOIN sa2_all sa2
        ON sa2.a2_filial = us.protheus_filial::text
       AND sa2.a2_cod    = us.protheus_cod::text
       AND sa2.a2_loja   = us.protheus_loja::text
      LEFT JOIN public.purchases_economic_group_members m 
        ON m.unified_supplier_id = us.id
      WHERE us.protheus_filial IS NOT NULL 
        AND us.protheus_cod IS NOT NULL
        AND us.protheus_loja IS NOT NULL
        AND m.unified_supplier_id IS NULL  -- apenas quem não tem grupo ainda
    ),
    grouped AS (
      SELECT 
        filial, 
        cod,
        array_agg(distinct unified_id) as unified_ids,
        -- Nome do grupo: menor nome não vazio entre os nomes dos membros
        (
          SELECT n 
          FROM unnest(array_agg(distinct nullif(btrim(unit_name), ''))) AS n
          ORDER BY length(n) ASC
          LIMIT 1
        ) as group_name,
        -- Comprador mais usado (par cod|filial), ignorando nulos/vazios
        (
          SELECT bc FROM (
            SELECT 
              buyer_cod || '|' || buyer_filial AS bc,
              count(*) AS cnt
            FROM candidates c2
            WHERE c2.filial = c.filial 
              AND c2.cod = c.cod
              AND c2.buyer_cod IS NOT NULL 
              AND btrim(c2.buyer_cod) <> ''
            GROUP BY 1
            ORDER BY cnt DESC, bc ASC
            LIMIT 1
          ) s
        ) as top_buyer_pair
      FROM candidates c
      GROUP BY filial, cod
    )
    SELECT 
      g.filial, 
      g.cod, 
      g.unified_ids, 
      g.group_name, 
      g.top_buyer_pair
    FROM grouped g
  $q$, v_union_sa2)
  LOOP
    -- Nome do grupo (fallback: usar código quando não houver nenhum nome)
    v_name := COALESCE(NULLIF(btrim(v_rec.group_name), ''), v_rec.cod);

    -- Decodificar comprador (se houver)
    v_buyer_cod := NULL; 
    v_buyer_filial := NULL;
    IF v_rec.top_buyer_pair IS NOT NULL THEN
      v_buyer_cod := split_part(v_rec.top_buyer_pair, '|', 1);
      v_buyer_filial := split_part(v_rec.top_buyer_pair, '|', 2);
    END IF;

    -- Existe grupo com essa combinação (filial, cod)?
    SELECT id_grupo INTO v_group_id
    FROM public.purchases_economic_groups 
    WHERE protheus_filial = v_rec.filial 
      AND protheus_cod = v_rec.cod
    LIMIT 1;

    IF v_group_id IS NULL THEN
      -- Criar novo grupo
      INSERT INTO public.purchases_economic_groups (
        name,
        protheus_filial,
        protheus_cod,
        assigned_buyer_cod,
        assigned_buyer_filial,
        created_by
      ) VALUES (
        v_name,
        v_rec.filial,
        v_rec.cod,
        v_buyer_cod,
        v_buyer_filial,
        auth.uid()
      )
      RETURNING id_grupo INTO v_group_id;

      v_groups_created := v_groups_created + 1;
    ELSE
      -- Atualizar comprador do grupo se ainda não definido
      UPDATE public.purchases_economic_groups
         SET assigned_buyer_cod = COALESCE(assigned_buyer_cod, v_buyer_cod),
             assigned_buyer_filial = COALESCE(assigned_buyer_filial, v_buyer_filial)
       WHERE id_grupo = v_group_id;
    END IF;

    -- Vincular membros ao grupo (evita duplicidade e move se necessário)
    INSERT INTO public.purchases_economic_group_members (group_id, unified_supplier_id, created_by)
    SELECT v_group_id, uid, auth.uid()
    FROM unnest(v_rec.unified_ids) AS u(uid)
    ON CONFLICT (unified_supplier_id)
    DO UPDATE 
      SET group_id = EXCLUDED.group_id,
          created_by = auth.uid(),
          created_at = now();

    -- Sincronizar Tipos de Materiais do grupo a partir dos membros (se função existir)
    PERFORM public.sync_purchases_group_material_types_from_members(v_group_id);

    v_suppliers_processed := v_suppliers_processed + COALESCE(array_length(v_rec.unified_ids, 1), 0);
    v_group_sets_processed := v_group_sets_processed + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'groups_created', v_groups_created,
    'group_sets_processed', v_group_sets_processed,
    'suppliers_processed', v_suppliers_processed
  );
END;
$function$;
