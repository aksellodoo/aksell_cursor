-- Função para recriar grupos econômicos baseado na tabela unified_accounts
CREATE OR REPLACE FUNCTION public.rebuild_economic_groups_from_unified()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_groups_created integer := 0;
  v_groups_updated integer := 0;
  v_accounts_processed integer := 0;
  v_group_id integer;
  v_existing_group_id integer;
  v_rec record;
BEGIN
  -- Processar contas unificadas agrupadas por filial e código
  FOR v_rec IN
    SELECT 
      protheus_filial,
      protheus_cod,
      COUNT(*) as account_count,
      array_agg(id) as unified_ids
    FROM public.unified_accounts
    WHERE protheus_filial IS NOT NULL 
      AND protheus_cod IS NOT NULL
    GROUP BY protheus_filial, protheus_cod
    HAVING COUNT(*) > 0
  LOOP
    -- Verificar se já existe um grupo para essa combinação filial/cod
    SELECT id_grupo INTO v_existing_group_id
    FROM public.protheus_customer_groups
    WHERE filial = v_rec.protheus_filial
      AND cod = v_rec.protheus_cod
    LIMIT 1;
    
    IF v_existing_group_id IS NULL THEN
      -- Criar novo grupo
      INSERT INTO public.protheus_customer_groups (
        filial,
        cod,
        name_source
      ) VALUES (
        v_rec.protheus_filial,
        v_rec.protheus_cod,
        'auto_generated'
      ) RETURNING id_grupo INTO v_group_id;
      
      v_groups_created := v_groups_created + 1;
    ELSE
      v_group_id := v_existing_group_id;
      v_groups_updated := v_groups_updated + 1;
    END IF;
    
    -- Atualizar todas as contas unificadas para referenciar este grupo
    UPDATE public.unified_accounts
    SET economic_group_id = v_group_id
    WHERE id = ANY(v_rec.unified_ids);
    
    v_accounts_processed := v_accounts_processed + v_rec.account_count;
  END LOOP;
  
  -- Consolidar grupos duplicados (se existirem múltiplos grupos para mesma filial/cod)
  FOR v_rec IN
    SELECT 
      filial,
      cod,
      array_agg(id_grupo ORDER BY id_grupo) as group_ids
    FROM public.protheus_customer_groups
    WHERE filial IS NOT NULL AND cod IS NOT NULL
    GROUP BY filial, cod
    HAVING COUNT(*) > 1
  LOOP
    -- Manter o primeiro grupo e mover contas dos outros
    UPDATE public.unified_accounts
    SET economic_group_id = v_rec.group_ids[1]
    WHERE economic_group_id = ANY(v_rec.group_ids[2:]);
    
    -- Deletar grupos duplicados
    DELETE FROM public.protheus_customer_groups
    WHERE id_grupo = ANY(v_rec.group_ids[2:]);
  END LOOP;
  
  -- Retornar resultados
  v_result := json_build_object(
    'success', true,
    'groups_created', v_groups_created,
    'groups_updated', v_groups_updated,
    'accounts_processed', v_accounts_processed,
    'message', format('Processamento concluído: %s grupos criados, %s grupos atualizados, %s contas processadas',
      v_groups_created, v_groups_updated, v_accounts_processed)
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro durante o processamento dos grupos econômicos'
    );
END;
$function$;