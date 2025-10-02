

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."ai_conversation_type" AS ENUM (
    'gestao_documentos',
    'geral',
    'protheus'
);


ALTER TYPE "public"."ai_conversation_type" OWNER TO "postgres";


CREATE TYPE "public"."approval_status" AS ENUM (
    'approved',
    'pending',
    'rejected',
    'needs_correction',
    'auto_cancelled'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."approval_type" AS ENUM (
    'simple',
    'access_request',
    'form_response',
    'document',
    'expense',
    'vacation',
    'purchase'
);


ALTER TYPE "public"."approval_type" OWNER TO "postgres";


CREATE TYPE "public"."confidentiality_level" AS ENUM (
    'public',
    'department_leaders',
    'directors_admins',
    'private'
);


ALTER TYPE "public"."confidentiality_level" OWNER TO "postgres";


CREATE TYPE "public"."contact_decision_level" AS ENUM (
    'estrategico',
    'tatico',
    'operacional'
);


ALTER TYPE "public"."contact_decision_level" OWNER TO "postgres";


CREATE TYPE "public"."contact_link_target_kind" AS ENUM (
    'economic_group_sales',
    'unified_customer',
    'economic_group_purchases',
    'unified_supplier',
    'commercial_rep',
    'carrier',
    'external_partner',
    'public_org',
    'association_union',
    'financial_institution',
    'other_entity'
);


ALTER TYPE "public"."contact_link_target_kind" OWNER TO "postgres";


CREATE TYPE "public"."contact_link_type" AS ENUM (
    'cliente',
    'fornecedor',
    'representante',
    'entidade'
);


ALTER TYPE "public"."contact_link_type" OWNER TO "postgres";


CREATE TYPE "public"."contact_treatment" AS ENUM (
    'sr',
    'sra',
    'direct',
    'custom'
);


ALTER TYPE "public"."contact_treatment" OWNER TO "postgres";


CREATE TYPE "public"."contact_usage_type" AS ENUM (
    'emergencia',
    'convites_eventos',
    'beneficios',
    'comunicacao_institucional',
    'outro'
);


ALTER TYPE "public"."contact_usage_type" OWNER TO "postgres";


CREATE TYPE "public"."contract_type" AS ENUM (
    'CLT',
    'PJ',
    'Estagiario',
    'Terceirizado',
    'Temporario'
);


ALTER TYPE "public"."contract_type" OWNER TO "postgres";


CREATE TYPE "public"."employee_status" AS ENUM (
    'active',
    'inactive',
    'terminated',
    'on_leave'
);


ALTER TYPE "public"."employee_status" OWNER TO "postgres";


CREATE TYPE "public"."family_relationship" AS ENUM (
    'conjuge',
    'filho_filha',
    'pai_mae',
    'amigo',
    'companheiro',
    'outro'
);


ALTER TYPE "public"."family_relationship" OWNER TO "postgres";


CREATE TYPE "public"."filling_type" AS ENUM (
    'none',
    'approval'
);


ALTER TYPE "public"."filling_type" OWNER TO "postgres";


CREATE TYPE "public"."fixed_task_type" AS ENUM (
    'approval',
    'signature',
    'form',
    'review',
    'simple_task',
    'call',
    'email',
    'meeting',
    'import_file',
    'update_file',
    'document_delivery',
    'workflow'
);


ALTER TYPE "public"."fixed_task_type" OWNER TO "postgres";


CREATE TYPE "public"."folder_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."folder_status" OWNER TO "postgres";


CREATE TYPE "public"."form_publication_status" AS ENUM (
    'draft',
    'published_internal',
    'published_external',
    'published_mixed',
    'unpublished'
);


ALTER TYPE "public"."form_publication_status" OWNER TO "postgres";


CREATE TYPE "public"."gender_type" AS ENUM (
    'M',
    'F',
    'Outros'
);


ALTER TYPE "public"."gender_type" OWNER TO "postgres";


CREATE TYPE "public"."lead_source_channel" AS ENUM (
    'referral',
    'website',
    'social',
    'organic_search',
    'paid_search',
    'event',
    'outbound',
    'marketplace',
    'other'
);


ALTER TYPE "public"."lead_source_channel" OWNER TO "postgres";


CREATE TYPE "public"."lgpd_basis" AS ENUM (
    'consentimento',
    'legitimo_interesse',
    'cumprimento_obrigacao_legal',
    'protecao_vida',
    'exercicio_poder_publico',
    'interesse_legitimo'
);


ALTER TYPE "public"."lgpd_basis" OWNER TO "postgres";


CREATE TYPE "public"."lgpd_legal_basis" AS ENUM (
    'consentimento',
    'legitimo_interesse',
    'obrigacao_legal'
);


ALTER TYPE "public"."lgpd_legal_basis" OWNER TO "postgres";


CREATE TYPE "public"."material_supply_type" AS ENUM (
    'materias_primas',
    'embalagens',
    'indiretos',
    'transportadora',
    'servicos'
);


ALTER TYPE "public"."material_supply_type" OWNER TO "postgres";


CREATE TYPE "public"."partner_status" AS ENUM (
    'ativo',
    'pausado',
    'encerrado',
    'avaliando'
);


ALTER TYPE "public"."partner_status" OWNER TO "postgres";


CREATE TYPE "public"."partner_type" AS ENUM (
    'ong',
    'universidade',
    'instituto_pesquisa',
    'camara_comercio',
    'embaixada',
    'midia',
    'evento',
    'incubadora',
    'escola_tecnica',
    'comunidade_oss',
    'outro'
);


ALTER TYPE "public"."partner_type" OWNER TO "postgres";


CREATE TYPE "public"."permission_level" AS ENUM (
    'ver_modificar',
    'ver_somente',
    'bloquear_acesso'
);


ALTER TYPE "public"."permission_level" OWNER TO "postgres";


CREATE TYPE "public"."portal_stakeholder" AS ENUM (
    'cliente',
    'fornecedor',
    'funcionario',
    'outro'
);


ALTER TYPE "public"."portal_stakeholder" OWNER TO "postgres";


CREATE TYPE "public"."processing_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."processing_status" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'planejado',
    'em_andamento',
    'concluido',
    'cancelado'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."protheus_record_status" AS ENUM (
    'new',
    'updated',
    'unchanged',
    'deleted'
);


ALTER TYPE "public"."protheus_record_status" OWNER TO "postgres";


CREATE TYPE "public"."relationship_nature" AS ENUM (
    'institucional',
    'projeto',
    'patrocinio_nao_comercial',
    'doacao',
    'voluntariado',
    'divulgacao',
    'mentoria',
    'outro'
);


ALTER TYPE "public"."relationship_nature" OWNER TO "postgres";


CREATE TYPE "public"."relevance" AS ENUM (
    'estrategico',
    'tatico',
    'ocasional'
);


ALTER TYPE "public"."relevance" OWNER TO "postgres";


CREATE TYPE "public"."risk_level" AS ENUM (
    'baixo',
    'medio',
    'alto'
);


ALTER TYPE "public"."risk_level" OWNER TO "postgres";


CREATE TYPE "public"."supplier_source_channel" AS ENUM (
    'indicacao_referencia',
    'pesquisa_propria',
    'abordagem_proativa',
    'base_interna',
    'outros'
);


ALTER TYPE "public"."supplier_source_channel" OWNER TO "postgres";


CREATE TYPE "public"."supplier_source_subchannel" AS ENUM (
    'indicacao_cliente',
    'indicacao_fornecedor_atual',
    'parceiro_consultor',
    'funcionario_interno',
    'outro_contato',
    'google_internet',
    'feira_evento',
    'associacao_sindicato_entidade',
    'plataforma_b2b_marketplace',
    'linkedin_rede_profissional',
    'visita_tecnica_viagem',
    'contato_direto_fornecedor',
    'prospeccao_comercial',
    'banco_dados_historico',
    'fornecedor_homologado_outra_unidade_grupo',
    'documentos_tecnicos_projetos_antigos',
    'origem_nao_especificada',
    'outro_especificar'
);


ALTER TYPE "public"."supplier_source_subchannel" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'P1',
    'P2',
    'P3',
    'P4'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."unified_account_status" AS ENUM (
    'lead_only',
    'customer',
    'lead_and_customer',
    'archived'
);


ALTER TYPE "public"."unified_account_status" OWNER TO "postgres";


CREATE TYPE "public"."unified_supplier_status" AS ENUM (
    'potential_only',
    'supplier',
    'potential_and_supplier',
    'archived'
);


ALTER TYPE "public"."unified_supplier_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_lead_to_group"("p_id_grupo" integer, "p_lead_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_old_group_id integer;
  v_old_group_member_count integer;
  v_old_group_lead_count integer;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if lead already belongs to another group
    SELECT economic_group_id INTO v_old_group_id
    FROM public.sales_leads
    WHERE id = p_lead_id;

    -- If lead belongs to another group, check if old group will become empty
    IF v_old_group_id IS NOT NULL AND v_old_group_id != p_id_grupo THEN
      -- Count remaining members in old group (excluding this lead)
      SELECT COUNT(*) INTO v_old_group_member_count
      FROM public.protheus_customer_group_units
      WHERE group_id = v_old_group_id;
      
      -- Count remaining leads in old group (excluding this lead)
      SELECT COUNT(*) INTO v_old_group_lead_count
      FROM public.sales_leads
      WHERE economic_group_id = v_old_group_id AND id != p_lead_id;

      -- If old group will be empty, delete it
      IF v_old_group_member_count = 0 AND v_old_group_lead_count = 0 THEN
        DELETE FROM public.protheus_customer_groups
        WHERE id_grupo = v_old_group_id;
      END IF;
    END IF;

    -- Update lead with new group
    UPDATE public.sales_leads
    SET economic_group_id = p_id_grupo
    WHERE id = p_lead_id;

    RETURN json_build_object(
      'success', true,
      'old_group_deleted', (v_old_group_member_count = 0 AND v_old_group_lead_count = 0),
      'old_group_id', v_old_group_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;


ALTER FUNCTION "public"."add_lead_to_group"("p_id_grupo" integer, "p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_member_to_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."add_member_to_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_unified_supplier_to_group"("p_group_id" "uuid", "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_old_group_id uuid;
  v_old_remaining integer := null;
begin
  select economic_group_id into v_old_group_id
  from public.purchases_unified_suppliers
  where id = p_unified_id;

  if v_old_group_id is not null and v_old_group_id <> p_group_id then
    select count(*) into v_old_remaining
    from public.purchases_unified_suppliers
    where economic_group_id = v_old_group_id
      and id <> p_unified_id;

    if v_old_remaining = 0 then
      delete from public.protheus_supplier_groups
      where id = v_old_group_id;
    end if;
  end if;

  update public.purchases_unified_suppliers
  set economic_group_id = p_group_id
  where id = p_unified_id;

  return json_build_object(
    'success', true,
    'old_group_deleted', coalesce(v_old_remaining, 1) = 0,
    'old_group_id', v_old_group_id
  );
end;
$$;


ALTER FUNCTION "public"."add_unified_supplier_to_group"("p_group_id" "uuid", "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_unified_supplier_to_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_old_group_id integer;
  v_remaining integer;
BEGIN
  SELECT group_id INTO v_old_group_id
  FROM public.purchases_economic_group_members
  WHERE unified_supplier_id = p_unified_id
  LIMIT 1;

  INSERT INTO public.purchases_economic_group_members (group_id, unified_supplier_id, created_by)
  VALUES (p_id_grupo, p_unified_id, auth.uid())
  ON CONFLICT (unified_supplier_id)
  DO UPDATE SET group_id = EXCLUDED.group_id, created_by = auth.uid(), created_at = now();

  IF v_old_group_id IS NOT NULL AND v_old_group_id <> p_id_grupo THEN
    SELECT COUNT(*) INTO v_remaining FROM public.purchases_economic_group_members WHERE group_id = v_old_group_id;
    IF v_remaining = 0 THEN
      DELETE FROM public.purchases_economic_groups WHERE id_grupo = v_old_group_id;
      RETURN json_build_object('success', true, 'old_group_deleted', true, 'old_group_id', v_old_group_id);
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'old_group_deleted', false, 'old_group_id', v_old_group_id);
END;
$$;


ALTER FUNCTION "public"."add_unified_supplier_to_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_unified_to_group"("p_id_grupo" integer, "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_old_group_id integer;
  v_old_group_remaining integer := null;
begin
  select economic_group_id into v_old_group_id
  from public.unified_accounts
  where id = p_unified_id;

  if v_old_group_id is not null and v_old_group_id <> p_id_grupo then
    -- Conta quantos permanecerão no grupo antigo (excluindo este)
    select count(*) into v_old_group_remaining
    from public.unified_accounts
    where economic_group_id = v_old_group_id
      and id <> p_unified_id;

    if v_old_group_remaining = 0 then
      delete from public.protheus_customer_groups
      where id_grupo = v_old_group_id;
    end if;
  end if;

  update public.unified_accounts
  set economic_group_id = p_id_grupo
  where id = p_unified_id;

  return json_build_object(
    'success', true,
    'old_group_deleted', coalesce(v_old_group_remaining, 1) = 0,
    'old_group_id', v_old_group_id
  );
end;
$$;


ALTER FUNCTION "public"."add_unified_to_group"("p_id_grupo" integer, "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_material_types_to_purchases_group_members"("p_id_grupo" integer, "p_material_type_ids" "uuid"[]) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  -- Insere (supplier_id, material_type_id) para todos os membros do grupo; ignora duplicados
  INSERT INTO public.purchases_unified_supplier_material_types (supplier_id, material_type_id, created_by)
  SELECT DISTINCT
    m.unified_supplier_id,
    mt_id,
    auth.uid()
  FROM public.purchases_economic_group_members m
  CROSS JOIN UNNEST(p_material_type_ids) AS mt_id
  WHERE m.group_id = p_id_grupo
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'applied_to_members', v_inserted
  );
END;
$$;


ALTER FUNCTION "public"."apply_material_types_to_purchases_group_members"("p_id_grupo" integer, "p_material_type_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_document_version"("p_document_id" "uuid", "p_created_by" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_version INTEGER;
  v_version_id UUID;
  v_doc_record RECORD;
BEGIN
  -- Get current document data
  SELECT * INTO v_doc_record
  FROM public.documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;
  
  -- Get current version number
  v_current_version := COALESCE(v_doc_record.version_number, 1);
  
  -- Create version record
  INSERT INTO public.document_versions (
    document_id,
    version_number,
    storage_key,
    file_size,
    mime_type,
    status,
    created_by,
    chunk_count
  ) VALUES (
    p_document_id,
    v_current_version,
    v_doc_record.storage_key,
    v_doc_record.file_size,
    v_doc_record.mime_type,
    v_doc_record.status,
    COALESCE(p_created_by, v_doc_record.created_by),
    (SELECT COUNT(*) FROM public.doc_chunks WHERE document_id = p_document_id)
  ) RETURNING id INTO v_version_id;
  
  -- Copy current chunks to version chunks
  INSERT INTO public.document_version_chunks (
    version_id,
    chunk_index,
    content,
    section,
    chunk_type,
    embeddings
  )
  SELECT 
    v_version_id,
    chunk_index,
    content,
    section,
    chunk_type,
    embeddings
  FROM public.doc_chunks
  WHERE document_id = p_document_id;
  
  -- Update document version number
  UPDATE public.documents
  SET version_number = v_current_version + 1
  WHERE id = p_document_id;
  
  -- Clean up old versions (keep only last 5)
  DELETE FROM public.document_versions
  WHERE document_id = p_document_id
  AND version_number <= v_current_version - 5;
  
  RETURN v_version_id;
END;
$$;


ALTER FUNCTION "public"."archive_document_version"("p_document_id" "uuid", "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_departments_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Só fazer auditoria se houver usuário autenticado
  IF auth.uid() IS NOT NULL THEN
    -- Track name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid(), 'department');
    END IF;

    -- Track description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (NEW.id, 'description', OLD.description, NEW.description, auth.uid(), 'department');
    END IF;

    -- Track color changes
    IF OLD.color IS DISTINCT FROM NEW.color THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (NEW.id, 'color', OLD.color, NEW.color, auth.uid(), 'department');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_departments_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_employee_sensitive_access"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Log when sensitive employee data is accessed
  IF NEW.cpf IS DISTINCT FROM OLD.cpf 
     OR NEW.rg IS DISTINCT FROM OLD.rg 
     OR NEW.salary IS DISTINCT FROM OLD.salary 
     OR NEW.bank_account IS DISTINCT FROM OLD.bank_account THEN
    
    PERFORM public.log_employee_data_access(NEW.id, 'sensitive_data_modified');
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_employee_sensitive_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_employees_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Track name changes
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'full_name', OLD.full_name, NEW.full_name, auth.uid(), 'employee');
  END IF;

  -- Track position changes
  IF OLD.position IS DISTINCT FROM NEW.position THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'position', OLD.position, NEW.position, auth.uid(), 'employee');
  END IF;

  -- Track department changes
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'department', 
      CASE WHEN OLD.department_id IS NULL THEN NULL ELSE public.get_department_name(OLD.department_id) END,
      CASE WHEN NEW.department_id IS NULL THEN NULL ELSE public.get_department_name(NEW.department_id) END,
      auth.uid(), 
      'employee'
    );
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, auth.uid(), 'employee');
  END IF;

  -- Track salary changes
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'salary', OLD.salary::text, NEW.salary::text, auth.uid(), 'employee');
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_employees_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_profiles_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Track name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid(), 'user');
  END IF;

  -- Track email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'email', OLD.email, NEW.email, auth.uid(), 'user');
  END IF;

  -- Track role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'role', OLD.role, NEW.role, auth.uid(), 'user');
  END IF;

  -- Track department changes (with readable names)
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'department', 
      CASE WHEN OLD.department_id IS NULL THEN NULL ELSE public.get_department_name(OLD.department_id) END,
      CASE WHEN NEW.department_id IS NULL THEN NULL ELSE public.get_department_name(NEW.department_id) END,
      auth.uid(), 
      'user'
    );
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid(), 'user');
  END IF;

  -- Track leadership changes
  IF OLD.is_leader IS DISTINCT FROM NEW.is_leader THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'is_leader', 
      CASE WHEN OLD.is_leader THEN 'Sim' ELSE 'Não' END,
      CASE WHEN NEW.is_leader THEN 'Sim' ELSE 'Não' END,
      auth.uid(), 
      'user'
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_profiles_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_record_shares"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.field_audit_log (
      record_id, field_name, old_value, new_value, 
      changed_by, record_type
    )
    VALUES (
      NEW.id, 'record_shared', NULL, 
      NEW.record_type || ':' || NEW.record_id || ' shared with ' || (
        SELECT name FROM public.profiles WHERE id = NEW.shared_with
      ),
      NEW.shared_by, 'record_share'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.field_audit_log (
        record_id, field_name, old_value, new_value, 
        changed_by, record_type
      )
      VALUES (
        NEW.id, 'status', OLD.status, NEW.status,
        auth.uid(), 'record_share'
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.field_audit_log (
      record_id, field_name, old_value, new_value, 
      changed_by, record_type
    )
    VALUES (
      OLD.id, 'record_share_revoked', OLD.status, 'deleted',
      auth.uid(), 'record_share'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."audit_record_shares"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_task_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;

  -- Track assigned_to changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_to', 
      (SELECT name FROM public.profiles WHERE id = OLD.assigned_to),
      (SELECT name FROM public.profiles WHERE id = NEW.assigned_to),
      auth.uid());
  END IF;

  -- Track assigned_department changes
  IF OLD.assigned_department IS DISTINCT FROM NEW.assigned_department THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_department', 
      (SELECT name FROM public.departments WHERE id = OLD.assigned_department),
      (SELECT name FROM public.departments WHERE id = NEW.assigned_department),
      auth.uid());
  END IF;

  -- Track assigned_users changes
  IF OLD.assigned_users IS DISTINCT FROM NEW.assigned_users THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_users', 
      OLD.assigned_users::TEXT,
      NEW.assigned_users::TEXT,
      auth.uid());
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid());
  END IF;

  -- Track due_date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, auth.uid());
  END IF;

  -- Mark as completed when status changes to done
  IF OLD.status != 'done' AND NEW.status = 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;

  -- Clear completed_at when status changes from done to something else
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_task_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_tasks_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Track title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'title', OLD.title, NEW.title, auth.uid(), 'task');
  END IF;

  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'description', OLD.description, NEW.description, auth.uid(), 'task');
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid(), 'task');
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid(), 'task');
  END IF;

  -- Track assigned_to changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'assigned_to', 
      (SELECT name FROM public.profiles WHERE id = OLD.assigned_to),
      (SELECT name FROM public.profiles WHERE id = NEW.assigned_to),
      auth.uid(), 'task');
  END IF;

  -- Track due_date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'due_date', OLD.due_date::text, NEW.due_date::text, auth.uid(), 'task');
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_tasks_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_share_approval_record"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  share_id uuid;
BEGIN
  -- Se a aprovação requer acesso ao registro e tem referência
  IF NEW.requires_record_access = true AND NEW.record_reference IS NOT NULL THEN
    -- Extrair dados da referência
    DECLARE
      record_type text;
      record_id uuid;
      record_name text;
    BEGIN
      record_type := NEW.record_reference->>'record_type';
      record_id := (NEW.record_reference->>'record_id')::uuid;
      record_name := COALESCE(NEW.record_reference->>'record_name', 'Registro para aprovação');
      
      -- Criar compartilhamento automático
      INSERT INTO public.record_shares (
        shared_by, 
        shared_with, 
        record_type, 
        record_id, 
        record_name,
        permissions,
        status,
        expires_at
      ) VALUES (
        -- Sistema compartilha 
        '00000000-0000-0000-0000-000000000000',
        NEW.approver_id,
        record_type,
        record_id,
        record_name,
        ARRAY['view', 'comment'],
        'active',
        CASE 
          WHEN NEW.expires_at IS NOT NULL THEN NEW.expires_at + INTERVAL '1 day'
          ELSE NOW() + INTERVAL '30 days'
        END
      ) RETURNING id INTO share_id;
      
      -- Atualizar aprovação com ID do compartilhamento
      NEW.auto_shared_record_id := share_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_share_approval_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_chunk_quality_score"("chunk_text" "text") RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  text_length integer;
  word_count integer;
  unique_words integer;
  avg_word_length numeric;
  quality_score numeric;
BEGIN
  -- Calcular métricas básicas
  text_length := length(chunk_text);
  word_count := array_length(string_to_array(chunk_text, ' '), 1);
  
  -- Evitar divisão por zero
  IF word_count = 0 OR text_length = 0 THEN
    RETURN 0.0;
  END IF;
  
  -- Calcular palavras únicas
  unique_words := array_length(
    array(
      SELECT DISTINCT unnest(string_to_array(lower(chunk_text), ' '))
    ), 1
  );
  
  -- Calcular comprimento médio das palavras
  avg_word_length := text_length::numeric / word_count::numeric;
  
  -- Score baseado em densidade de informação
  quality_score := LEAST(1.0, 
    (unique_words::numeric / word_count::numeric) * 0.4 +  -- Diversidade lexical
    LEAST(1.0, avg_word_length / 5.0) * 0.3 +             -- Complexidade de palavras
    LEAST(1.0, text_length::numeric / 200.0) * 0.3        -- Densidade de informação
  );
  
  RETURN ROUND(quality_score, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_chunk_quality_score"("chunk_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_trigger_next_execution"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  next_exec TIMESTAMP WITH TIME ZONE;
  config JSONB;
BEGIN
  -- Só calcular para triggers recorrentes
  IF NEW.trigger_type IN ('recurring_interval', 'recurring_schedule', 'recurring_monthly') THEN
    config := COALESCE(NEW.trigger_config, '{}'::jsonb);
    
    CASE NEW.trigger_type
      WHEN 'recurring_interval' THEN
        -- Calcular baseado no intervalo em minutos
        next_exec := NOW() + INTERVAL '1 minute' * COALESCE((config->>'interval')::INTEGER, 60);
        
      WHEN 'recurring_schedule' THEN
        -- Calcular baseado em agendamento semanal
        -- Para simplificar, próxima execução em 1 dia
        next_exec := NOW() + INTERVAL '1 day';
        
      WHEN 'recurring_monthly' THEN
        -- Calcular baseado em agendamento mensal
        -- Para simplificar, próxima execução em 1 mês
        next_exec := NOW() + INTERVAL '1 month';
        
      ELSE
        next_exec := NOW() + INTERVAL '1 hour';
    END CASE;
    
    NEW.next_execution_at := next_exec;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_trigger_next_execution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_confidential_file"("file_confidentiality" "public"."confidentiality_level", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
  is_user_leader boolean;
BEGIN
  -- Buscar role e status de liderança do usuário
  SELECT role, is_leader 
  INTO user_role, is_user_leader
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE file_confidentiality
    WHEN 'public' THEN
      RETURN true; -- Qualquer usuário autenticado pode ver
    WHEN 'department_leaders' THEN
      RETURN is_user_leader = true OR user_role IN ('director', 'admin', 'hr');
    WHEN 'directors_admins' THEN
      RETURN user_role IN ('director', 'admin');
    ELSE
      RETURN false;
  END CASE;
END;
$$;


ALTER FUNCTION "public"."can_access_confidential_file"("file_confidentiality" "public"."confidentiality_level", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_form"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_department_id uuid;
  user_role text;
BEGIN
  -- If public, everyone can access
  IF p_confidentiality_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- If no user_id provided, deny access for non-public forms
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user's department and role
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Check if user is in allowed users
  IF p_allowed_users IS NOT NULL AND p_user_id = ANY(p_allowed_users) THEN
    RETURN true;
  END IF;
  
  -- Check if user's department is in allowed departments
  IF p_allowed_departments IS NOT NULL AND user_department_id = ANY(p_allowed_departments) THEN
    RETURN true;
  END IF;
  
  -- Check if user's role is in allowed roles
  IF p_allowed_roles IS NOT NULL AND user_role = ANY(p_allowed_roles) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_access_form"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_form_response"("response_form_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  form_confidentiality confidentiality_level;
  form_allowed_users UUID[];
  form_allowed_departments UUID[];
  form_allowed_roles TEXT[];
BEGIN
  -- Get form confidentiality settings
  SELECT confidentiality_level, allowed_users, allowed_departments, allowed_roles
  INTO form_confidentiality, form_allowed_users, form_allowed_departments, form_allowed_roles
  FROM public.forms 
  WHERE id = response_form_id;
  
  -- Check access based on confidentiality level
  RETURN public.can_access_form(
    form_confidentiality, 
    form_allowed_users, 
    form_allowed_departments, 
    form_allowed_roles, 
    auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."can_access_form_response"("response_form_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_task_template"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_department_id uuid;
  user_role text;
BEGIN
  -- Se público, todos podem acessar
  IF p_confidentiality_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- Se sem user_id, negar acesso para templates não-públicos
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar departamento e role do usuário
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Verificar se usuário está na lista de usuários permitidos
  IF p_allowed_users IS NOT NULL AND p_user_id = ANY(p_allowed_users) THEN
    RETURN true;
  END IF;
  
  -- Verificar se departamento do usuário está na lista de departamentos permitidos
  IF p_allowed_departments IS NOT NULL AND user_department_id = ANY(p_allowed_departments) THEN
    RETURN true;
  END IF;
  
  -- Verificar se role do usuário está na lista de roles permitidas
  IF p_allowed_roles IS NOT NULL AND user_role = ANY(p_allowed_roles) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_access_task_template"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_task_type"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_department_id uuid;
  user_role text;
BEGIN
  -- If public, everyone can access
  IF p_confidentiality_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- Get user's department and role
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Check if user is in allowed users
  IF p_allowed_users IS NOT NULL AND p_user_id = ANY(p_allowed_users) THEN
    RETURN true;
  END IF;
  
  -- Check if user's department is in allowed departments
  IF p_allowed_departments IS NOT NULL AND user_department_id = ANY(p_allowed_departments) THEN
    RETURN true;
  END IF;
  
  -- Check if user's role is in allowed roles
  IF p_allowed_roles IS NOT NULL AND user_role = ANY(p_allowed_roles) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_access_task_type"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
  is_user_leader boolean;
  is_creator boolean;
BEGIN
  -- Buscar role e status de liderança do usuário
  SELECT role, is_leader 
  INTO user_role, is_user_leader
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Administradores têm acesso total
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- Verificar se é criador do workflow
  SELECT EXISTS(
    SELECT 1 FROM public.workflows 
    WHERE created_by = user_id
  ) INTO is_creator;
  
  -- Criadores têm acesso aos próprios workflows
  IF is_creator THEN
    RETURN true;
  END IF;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE workflow_confidentiality
    WHEN 'public' THEN
      RETURN true;
    WHEN 'department_leaders' THEN
      RETURN is_user_leader = true OR user_role IN ('hr');
    WHEN 'directors_admins' THEN
      RETURN false; -- Já verificado acima
    ELSE
      RETURN false;
  END CASE;
END;
$$;


ALTER FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "workflow_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
  user_dept uuid;
  workflow_data record;
BEGIN
  -- Buscar role e departamento do usuário
  SELECT role, department_id 
  INTO user_role, user_dept
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Se o workflow é público, qualquer usuário pode acessar
  IF workflow_confidentiality = 'public' THEN
    RETURN true;
  END IF;
  
  -- Se o workflow é privado, verificar permissões específicas
  IF workflow_confidentiality = 'private' THEN
    -- Buscar dados do workflow
    SELECT w.created_by, w.allowed_users, w.allowed_departments, w.allowed_roles
    INTO workflow_data
    FROM public.workflows w
    WHERE w.id = workflow_id;
    
    -- Criador sempre pode acessar
    IF workflow_data.created_by = user_id THEN
      RETURN true;
    END IF;
    
    -- Verificar se usuário está na lista de usuários permitidos
    IF workflow_data.allowed_users IS NOT NULL AND user_id = ANY(workflow_data.allowed_users) THEN
      RETURN true;
    END IF;
    
    -- Verificar se departamento do usuário está na lista de departamentos permitidos
    IF workflow_data.allowed_departments IS NOT NULL AND user_dept = ANY(workflow_data.allowed_departments) THEN
      RETURN true;
    END IF;
    
    -- Verificar se role do usuário está na lista de roles permitidas
    IF workflow_data.allowed_roles IS NOT NULL AND user_role = ANY(workflow_data.allowed_roles) THEN
      RETURN true;
    END IF;
    
    -- Se nenhuma condição foi atendida, negar acesso
    RETURN false;
  END IF;
  
  -- Para outros níveis (department_leaders, directors_admins), usar lógica antiga temporariamente
  -- Esta será removida quando migrarmos completamente para public/private
  DECLARE
    is_user_leader boolean;
  BEGIN
    SELECT is_leader INTO is_user_leader FROM public.profiles WHERE id = user_id;
    
    CASE workflow_confidentiality
      WHEN 'department_leaders' THEN
        RETURN is_user_leader = true OR user_role IN ('director', 'admin', 'hr');
      WHEN 'directors_admins' THEN
        RETURN user_role IN ('director', 'admin');
      ELSE
        RETURN false;
    END CASE;
  END;
END;
$$;


ALTER FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "workflow_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_approve_access_request"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'director');
END;
$$;


ALTER FUNCTION "public"."can_approve_access_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_approve_file"("file_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  file_approval_users uuid[];
  file_approval_dept uuid;
  user_dept uuid;
BEGIN
  -- Buscar configurações de aprovação do arquivo
  SELECT approval_users, approval_department_id 
  INTO file_approval_users, file_approval_dept
  FROM public.chatter_files 
  WHERE id = file_id;
  
  -- Verificar se usuário está na lista de aprovadores
  IF user_id = ANY(file_approval_users) THEN
    RETURN true;
  END IF;
  
  -- Verificar se usuário está no departamento aprovador
  IF file_approval_dept IS NOT NULL THEN
    SELECT department_id INTO user_dept
    FROM public.profiles 
    WHERE id = user_id;
    
    IF user_dept = file_approval_dept THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_approve_file"("file_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_delete_workflow"("workflow_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  execution_count INTEGER;
  queue_count INTEGER;
  task_count INTEGER;
BEGIN
  -- Check for executions
  SELECT COUNT(*) INTO execution_count
  FROM public.workflow_executions 
  WHERE workflow_id = workflow_id_param;
  
  -- Check for queued executions
  SELECT COUNT(*) INTO queue_count
  FROM public.workflow_queue 
  WHERE workflow_id = workflow_id_param;
  
  -- Check for workflow-generated tasks
  SELECT COUNT(*) INTO task_count
  FROM public.tasks 
  WHERE workflow_id = workflow_id_param;
  
  -- Can delete if no executions, queue items, or tasks exist
  RETURN (execution_count = 0 AND queue_count = 0 AND task_count = 0);
END;
$$;


ALTER FUNCTION "public"."can_delete_workflow"("workflow_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_modify_user_role"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Only admin and director roles can modify other users' roles
  -- Users cannot modify their own role
  IF current_user_role IN ('admin', 'director') AND target_user_id != auth.uid() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_modify_user_role"("target_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_code" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "cpf" "text" NOT NULL,
    "rg" "text",
    "email" "text",
    "position" "text" NOT NULL,
    "department_id" "uuid",
    "supervisor_id" "uuid",
    "birth_date" "date",
    "phone" "text",
    "gender" "public"."gender_type",
    "hire_date" "date" NOT NULL,
    "termination_date" "date",
    "salary" numeric(10,2),
    "contract_type" "public"."contract_type" DEFAULT 'CLT'::"public"."contract_type",
    "status" "public"."employee_status" DEFAULT 'active'::"public"."employee_status",
    "photo_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_employee_sensitive_data"("employee_record" "public"."employees") RETURNS "public"."employees"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
  result public.employees;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Copy all fields
  result := employee_record;
  
  -- Mask sensitive fields if user doesn't have access
  IF user_role NOT IN ('admin', 'director', 'hr') THEN
    result.cpf := CASE WHEN result.cpf IS NOT NULL THEN '***.***.***-**' ELSE NULL END;
    result.rg := CASE WHEN result.rg IS NOT NULL THEN '***.***.**-*' ELSE NULL END;
    result.salary := NULL;
    result.bank_account := CASE WHEN result.bank_account IS NOT NULL THEN '****' ELSE NULL END;
    result.emergency_contact_phone := CASE WHEN result.emergency_contact_phone IS NOT NULL THEN '(**) ****-****' ELSE NULL END;
  ELSE
    -- Log sensitive data access for audit
    PERFORM public.log_employee_data_access(result.id, 'sensitive_data_view');
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."can_view_employee_sensitive_data"("employee_record" "public"."employees") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_device_trust_anonymous"("device_fingerprint_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  device_count INTEGER;
BEGIN
  -- Check if device fingerprint exists and is active/valid
  SELECT COUNT(*) INTO device_count
  FROM public.trusted_devices
  WHERE device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Return true if trusted, false otherwise
  RETURN device_count > 0;
END;
$$;


ALTER FUNCTION "public"."check_device_trust_anonymous"("device_fingerprint_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_document_expiry_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  file_record RECORD;
  notification_date timestamp with time zone;
  user_id uuid;
BEGIN
  -- Buscar arquivos que precisam de notificação
  FOR file_record IN 
    SELECT cf.*, p.name as uploader_name
    FROM public.chatter_files cf
    LEFT JOIN public.profiles p ON p.id = cf.uploaded_by
    WHERE cf.expiry_date IS NOT NULL 
      AND cf.notify_before_expiry IS NOT NULL
      AND cf.approval_status = 'approved'
      AND cf.is_current_version = true
  LOOP
    notification_date := file_record.expiry_date - file_record.notify_before_expiry;
    
    -- Se chegou a hora de notificar
    IF now() >= notification_date AND now() < file_record.expiry_date THEN
      -- Notificar usuários específicos
      IF file_record.notify_users IS NOT NULL THEN
        FOREACH user_id IN ARRAY file_record.notify_users
        LOOP
          INSERT INTO public.app_notifications (user_id, type, title, message, data)
          VALUES (
            user_id,
            'document_expiry',
            'Documento próximo do vencimento',
            'O documento "' || file_record.description || '" vence em breve.',
            jsonb_build_object(
              'file_id', file_record.id,
              'description', file_record.description,
              'expiry_date', file_record.expiry_date,
              'record_type', file_record.record_type,
              'record_id', file_record.record_id
            )
          );
        END LOOP;
      END IF;
      
      -- Notificar departamento
      IF file_record.notify_department_id IS NOT NULL THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        SELECT 
          p.id,
          'document_expiry',
          'Documento próximo do vencimento',
          'O documento "' || file_record.description || '" vence em breve.',
          jsonb_build_object(
            'file_id', file_record.id,
            'description', file_record.description,
            'expiry_date', file_record.expiry_date,
            'record_type', file_record.record_type,
            'record_id', file_record.record_id
          )
        FROM public.profiles p
        WHERE p.department_id = file_record.notify_department_id;
      END IF;
    END IF;
    
    -- Se o documento já venceu, disparar trigger de documento vencido
    IF now() >= file_record.expiry_date THEN
      PERFORM public.trigger_document_expired(file_record.id);
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_document_expiry_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ip_rate_limit"("ip_hash" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Contar solicitações do mesmo IP nas últimas 24 horas
  SELECT COUNT(*) INTO request_count
  FROM public.pending_access_requests
  WHERE request_ip_hash = ip_hash
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Retornar true se estiver dentro do limite (≤20)
  RETURN request_count < 20;
END;
$$;


ALTER FUNCTION "public"."check_ip_rate_limit"("ip_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_shared_record_access"("p_record_type" "text", "p_record_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Verificar se existe compartilhamento ativo
  SELECT EXISTS(
    SELECT 1 
    FROM public.record_shares rs
    WHERE rs.record_type = p_record_type
      AND rs.record_id = p_record_id
      AND rs.status = 'active'
      AND (
        -- Compartilhado diretamente com o usuário
        rs.shared_with = p_user_id
        OR
        -- Compartilhado com algum superior hierárquico do usuário
        rs.shared_with IN (
          WITH RECURSIVE superiors AS (
            SELECT supervisor_id
            FROM public.profiles
            WHERE id = p_user_id AND supervisor_id IS NOT NULL
            
            UNION
            
            SELECT p.supervisor_id
            FROM public.profiles p
            INNER JOIN superiors s ON p.id = s.supervisor_id
            WHERE p.supervisor_id IS NOT NULL
          )
          SELECT supervisor_id FROM superiors WHERE supervisor_id IS NOT NULL
        )
      )
      AND (rs.expires_at IS NULL OR rs.expires_at > now())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;


ALTER FUNCTION "public"."check_shared_record_access"("p_record_type" "text", "p_record_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_single_open_draft"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Só verifica se está inserindo/atualizando para status 'open'
  IF NEW.status = 'open' THEN
    -- Verifica se já existe outro rascunho aberto para a mesma chave
    IF EXISTS (
      SELECT 1 
      FROM public.task_drafts 
      WHERE user_id = NEW.user_id
        AND origin = NEW.origin
        AND status = 'open'
        AND (
          (NEW.origin = 'fixed' AND fixed_type = NEW.fixed_type) OR
          (NEW.origin = 'template' AND template_id = NEW.template_id)
        )
        AND id != NEW.id  -- Excluir o próprio registro em caso de UPDATE
    ) THEN
      RAISE EXCEPTION 'Já existe um rascunho aberto para esta combinação user/origin/type';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_single_open_draft"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_audit_logs"("days_to_keep" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.field_audit_log 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."clean_audit_logs"("days_to_keep" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_message_preview"("message_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Remove menções de UUID (@uuid) e outros padrões técnicos
  RETURN regexp_replace(
    regexp_replace(message_text, '@[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '', 'g'),
    '\s+', ' ', 'g'
  );
END;
$$;


ALTER FUNCTION "public"."clean_message_preview"("message_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_access_requests"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
  rejected_count INTEGER;
BEGIN
  -- Remover solicitações pendentes expiradas
  DELETE FROM public.pending_access_requests 
  WHERE expires_at < now() AND status = 'pending';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remover solicitações rejeitadas antigas (mais de 30 dias)
  DELETE FROM public.pending_access_requests 
  WHERE status = 'rejected' 
    AND created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rejected_count = ROW_COUNT;
  
  -- Remover notificações órfãs
  DELETE FROM public.app_notifications
  WHERE type = 'access_request'
    AND NOT EXISTS (
      SELECT 1 FROM public.pending_access_requests 
      WHERE id::text = app_notifications.data->>'access_request_id'
    );
  
  -- Log da limpeza
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_requests',
    (deleted_count + rejected_count)::text,
    'automatic_cleanup',
    '00000000-0000-0000-0000-000000000000',
    'system'
  );
  
  RETURN deleted_count + rejected_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_access_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.processing_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO public.cron_job_logs (job_name, status, details)
  VALUES ('cleanup_expired_cache', 'success', 
          json_build_object('deleted_entries', deleted_count));
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_password_tokens"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover tokens expirados
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remover tokens usados há mais de 7 dias
  DELETE FROM public.password_reset_tokens 
  WHERE used_at IS NOT NULL 
    AND used_at < now() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_password_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_telegram_codes"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.profiles 
  SET telegram_setup_code = NULL,
      telegram_setup_code_expires_at = NULL
  WHERE telegram_setup_code_expires_at < NOW();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_telegram_codes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_trusted_devices"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Marcar dispositivos expirados como inativos
  UPDATE trusted_devices 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_trusted_devices',
    deleted_count::text,
    'automatic_cleanup',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'system'
  );
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_trusted_devices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_trusted_devices_enhanced"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Marcar dispositivos expirados como inativos e depois deletar
  DELETE FROM trusted_devices 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_trusted_devices_enhanced',
    deleted_count::text,
    'automatic_cleanup',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'system'
  );
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_trusted_devices_enhanced"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_whatsapp_codes"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    whatsapp_verification_code = NULL,
    whatsapp_verification_expires_at = NULL
  WHERE whatsapp_verification_expires_at IS NOT NULL 
    AND whatsapp_verification_expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_whatsapp_codes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_access_requests"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover solicitações antigas (aprovadas/rejeitadas há mais de 30 dias)
  DELETE FROM public.pending_access_requests 
  WHERE status IN ('approved', 'rejected')
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_access_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_processed_requests"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove processed requests older than 90 days
  DELETE FROM public.pending_access_requests 
  WHERE status IN ('approved', 'rejected')
    AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_processed_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_task_drafts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.task_drafts 
  SET status = 'discarded'
  WHERE status = 'open' 
    AND updated_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_task_drafts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_stuck_documents"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Atualizar documentos travados há mais de 10 minutos
  UPDATE documents 
  SET 
    status = 'Rejeitado',
    updated_at = now(),
    error_message = 'Timeout no processamento - documento foi limpo automaticamente'
  WHERE 
    status = 'Processando' 
    AND created_at < (now() - INTERVAL '10 minutes');
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_stuck_documents"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_acl_hash"("department_id" "uuid" DEFAULT NULL::"uuid", "user_id" "uuid" DEFAULT NULL::"uuid", "confidentiality_level" "text" DEFAULT NULL::"text", "folder_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  acl_string text;
BEGIN
  -- Build ACL string based on parameters
  acl_string := COALESCE(department_id::text, '') || '|' ||
                COALESCE(user_id::text, '') || '|' ||
                COALESCE(confidentiality_level::text, '') || '|' ||
                COALESCE(folder_id::text, '');
  
  -- Return MD5 hash of the ACL string
  RETURN md5(acl_string);
END;
$$;


ALTER FUNCTION "public"."compute_acl_hash"("department_id" "uuid", "user_id" "uuid", "confidentiality_level" "text", "folder_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_document_acl_hash"("doc_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  doc_record RECORD;
  acl_string text;
BEGIN
  -- Get document details
  SELECT 
    d.department_id,
    d.created_by,
    d.confidentiality_level,
    d.folder_id
  INTO doc_record
  FROM documents d
  WHERE d.id = doc_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Build ACL string based on document properties
  acl_string := COALESCE(doc_record.department_id::text, '') || '|' ||
                COALESCE(doc_record.created_by::text, '') || '|' ||
                COALESCE(doc_record.confidentiality_level::text, '') || '|' ||
                COALESCE(doc_record.folder_id::text, '');
  
  -- Return MD5 hash of the ACL string
  RETURN md5(acl_string);
END;
$$;


ALTER FUNCTION "public"."compute_document_acl_hash"("doc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_potential_without_unified"() RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.purchases_potential_suppliers ps
  left join public.purchases_unified_suppliers us
    on us.potential_supplier_id = ps.id
  where us.id is null;

  return v_count;
end;
$$;


ALTER FUNCTION "public"."count_potential_without_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_protheus_without_unified"() RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
  v_count integer := 0;
BEGIN
  -- Get union of all SA2010 tables
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    RETURN 0;
  END IF;

  -- Count protheus suppliers without unified suppliers
  EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT COUNT(DISTINCT (sa2.a2_filial, sa2.a2_cod, sa2.a2_loja))::integer
    FROM sa2_all sa2
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.purchases_unified_suppliers us
      WHERE us.protheus_filial = sa2.a2_filial
        AND us.protheus_cod = sa2.a2_cod
        AND us.protheus_loja = sa2.a2_loja
    )
  $q$, v_union_sa2) INTO v_count;

  RETURN v_count;
END;
$_$;


ALTER FUNCTION "public"."count_protheus_without_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_purchases_economic_groups"() RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.purchases_economic_groups
  );
END;
$$;


ALTER FUNCTION "public"."count_purchases_economic_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unified_suppliers_without_group"() RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.purchases_unified_suppliers us
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.purchases_economic_group_members m 
      WHERE m.unified_supplier_id = us.id
    )
  );
END;
$$;


ALTER FUNCTION "public"."count_unified_suppliers_without_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_approval_with_record_access"("p_workflow_execution_id" "uuid", "p_step_id" "text", "p_approver_id" "uuid", "p_approval_data" "jsonb" DEFAULT '{}'::"jsonb", "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_priority" "text" DEFAULT 'medium'::"text", "p_approval_type" "public"."approval_type" DEFAULT 'simple'::"public"."approval_type", "p_record_reference" "jsonb" DEFAULT '{}'::"jsonb", "p_requires_record_access" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  approval_id uuid;
BEGIN
  INSERT INTO public.workflow_approvals (
    workflow_execution_id,
    step_id,
    approver_id,
    approval_data,
    expires_at,
    priority,
    approval_type,
    record_reference,
    requires_record_access
  ) VALUES (
    p_workflow_execution_id,
    p_step_id,
    p_approver_id,
    p_approval_data,
    p_expires_at,
    p_priority,
    p_approval_type,
    p_record_reference,
    p_requires_record_access
  ) RETURNING id INTO approval_id;
  
  RETURN approval_id;
END;
$$;


ALTER FUNCTION "public"."create_approval_with_record_access"("p_workflow_execution_id" "uuid", "p_step_id" "text", "p_approver_id" "uuid", "p_approval_data" "jsonb", "p_expires_at" timestamp with time zone, "p_priority" "text", "p_approval_type" "public"."approval_type", "p_record_reference" "jsonb", "p_requires_record_access" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_customer_group"("p_table_id" "uuid", "p_nome_grupo" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_customer_group"("p_table_id" "uuid", "p_nome_grupo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dynamic_table"("table_definition" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validar que o comando é CREATE TABLE ou ALTER TABLE para constraints
  IF table_definition !~* '^(CREATE TABLE|ALTER TABLE .* ADD CONSTRAINT .* UNIQUE)' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Apenas comandos CREATE TABLE e ALTER TABLE para constraints UNIQUE são permitidos'
    );
  END IF;

  -- Executar comando DDL
  EXECUTE table_definition;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Comando executado com sucesso'
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;


ALTER FUNCTION "public"."create_dynamic_table"("table_definition" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_economic_group"("p_nome_grupo" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_group_id integer;
  v_uuid uuid;
  v_default_table_id uuid := '80f17f00-0960-44ac-b810-6f8f1a36ccdc'; -- SA1010_CLIENTES as default
  v_unique_cod text;
begin
  -- Generate unique code using epoch timestamp
  v_unique_cod := 'EG_' || extract(epoch from now())::bigint::text;

  insert into public.protheus_customer_groups (
    protheus_table_id, 
    filial, 
    cod, 
    name, 
    name_source
  )
  values (
    v_default_table_id,
    'UN', -- Unified groups filial
    v_unique_cod,
    p_nome_grupo, 
    'manual'
  )
  returning id_grupo, id into v_group_id, v_uuid;

  return json_build_object(
    'success', true,
    'group_id', v_group_id,
    'uuid', v_uuid
  );
end;
$$;


ALTER FUNCTION "public"."create_economic_group"("p_nome_grupo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_form_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_version INTEGER;
BEGIN
  -- Verificar se o formulário já tem respostas e está sendo alterado
  IF NEW.has_responses = true AND OLD.has_responses = true AND 
     (OLD.title IS DISTINCT FROM NEW.title OR 
      OLD.description IS DISTINCT FROM NEW.description OR 
      OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR 
      OLD.settings IS DISTINCT FROM NEW.settings) THEN
    
    -- Obter o número da versão atual
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO current_version
    FROM public.form_versions 
    WHERE form_id = OLD.id;
    
    -- Salvar a versão anterior (despublicada) em form_versions
    INSERT INTO public.form_versions (
      form_id,
      version_number,
      title,
      description,
      fields_definition,
      settings,
      created_by,
      response_count,
      is_current
    ) VALUES (
      OLD.id,
      current_version - 1,
      OLD.title,
      OLD.description,
      OLD.fields_definition,
      OLD.settings,
      OLD.created_by,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id),
      false
    );
    
    -- Atualizar o número da versão do formulário atual
    NEW.version_number := current_version;
    
    -- A nova versão permanece publicada (não alterar status)
    -- Resetar contador de respostas para a nova versão
    NEW.has_responses := false;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_form_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_missing_purchases_groups"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."create_missing_purchases_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_missing_unified_accounts"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_created_protheus int := 0;
  v_created_leads int := 0;
  v_linked_protheus_to_leads int := 0;
BEGIN
  -- Passo A) Vincular unidades Protheus a unificados de lead quando CNPJ coincidir
  WITH sa1 AS (
    SELECT
      a1_filial::text AS filial,
      a1_cod::text    AS cod,
      a1_loja::text   AS loja,
      a1_cgc::text    AS cnpj_raw
    FROM public.protheus_sa1010_80f17f00
    WHERE a1_cgc IS NOT NULL AND btrim(a1_cgc::text) <> ''
  ),
  matches AS (
    SELECT
      ua_lead.id AS ua_id,
      sa1.filial,
      sa1.cod,
      sa1.loja
    FROM sa1
    JOIN public.sales_leads sl
      ON regexp_replace(coalesce(sl.cnpj::text, ''), '[^0-9]', '', 'g')
       = regexp_replace(coalesce(sa1.cnpj_raw, ''), '[^0-9]', '', 'g')
    JOIN public.unified_accounts ua_lead
      ON ua_lead.lead_id = sl.id
    LEFT JOIN public.unified_accounts ua_existing
      ON ua_existing.protheus_filial = sa1.filial
     AND ua_existing.protheus_cod    = sa1.cod
     AND ua_existing.protheus_loja   = sa1.loja
    WHERE ua_existing.id IS NULL
      AND ua_lead.protheus_filial IS NULL
      AND ua_lead.protheus_cod IS NULL
      AND ua_lead.protheus_loja IS NULL
  ),
  dedup AS (
    -- se existir mais de uma unidade Protheus com o mesmo CNPJ, escolhemos a primeira para o mesmo UA
    SELECT DISTINCT ON (ua_id) ua_id, filial, cod, loja
    FROM matches
    ORDER BY ua_id, filial, cod, loja
  )
  UPDATE public.unified_accounts ua
  SET
    protheus_filial = d.filial,
    protheus_cod    = d.cod,
    protheus_loja   = d.loja,
    status          = CASE WHEN ua.status = 'lead_only' THEN 'lead_and_customer' ELSE ua.status END,
    updated_at      = now()
  FROM dedup d
  WHERE ua.id = d.ua_id;
  GET DIAGNOSTICS v_linked_protheus_to_leads = ROW_COUNT;

  -- Passo B) Criar unificados para clientes Protheus que ainda não possuem unificado
  INSERT INTO public.unified_accounts (
    status,
    protheus_filial,
    protheus_cod,
    protheus_loja,
    service_type,
    notes,
    created_by
  )
  SELECT
    'customer',
    sa1.a1_filial::text,
    sa1.a1_cod::text,
    sa1.a1_loja::text,
    'direct',
    'Criado automaticamente a partir do Protheus',
    auth.uid()
  FROM public.protheus_sa1010_80f17f00 sa1
  LEFT JOIN public.unified_accounts ua
    ON ua.protheus_filial = sa1.a1_filial::text
   AND ua.protheus_cod    = sa1.a1_cod::text
   AND ua.protheus_loja   = sa1.a1_loja::text
  WHERE ua.id IS NULL;
  GET DIAGNOSTICS v_created_protheus = ROW_COUNT;

  -- Passo C) Criar unificados para leads que ainda não possuem unificado
  INSERT INTO public.unified_accounts (
    status,
    lead_id,
    service_type,
    representative_id,
    notes,
    created_by
  )
  SELECT
    'lead_only',
    sl.id,
    CASE WHEN sl.attendance_type = 'representative' THEN 'representative' ELSE 'direct' END,
    CASE WHEN sl.attendance_type = 'representative' THEN sl.representative_id ELSE NULL END,
    'Criado automaticamente a partir do Lead',
    auth.uid()
  FROM public.sales_leads sl
  LEFT JOIN public.unified_accounts ua
    ON ua.lead_id = sl.id
  WHERE ua.id IS NULL;
  GET DIAGNOSTICS v_created_leads = ROW_COUNT;

  RETURN json_build_object(
    'created_from_protheus',        v_created_protheus,
    'created_from_leads',           v_created_leads,
    'linked_protheus_to_leads',     v_linked_protheus_to_leads
  );
END;
$$;


ALTER FUNCTION "public"."create_missing_unified_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_missing_unified_suppliers"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_created int := 0;
begin
  with to_create as (
    select
      ps.id as potential_id,
      ps.cnpj,
      ps.attendance_type,
      ps.representative_id,
      ps.assigned_buyer_cod,
      ps.assigned_buyer_filial
    from public.purchases_potential_suppliers ps
    left join public.purchases_unified_suppliers us
      on us.potential_supplier_id = ps.id
    where us.id is null
  ),
  inserted_rows as (
    insert into public.purchases_unified_suppliers(
      potential_supplier_id,
      cnpj,
      attendance_type,
      representative_id,
      assigned_buyer_cod,
      assigned_buyer_filial,
      status,
      protheus_filial,
      protheus_cod,
      protheus_loja,
      created_by
    )
    select
      potential_id,
      cnpj,
      coalesce(attendance_type, 'direct'),
      case when coalesce(attendance_type, 'direct') = 'direct' then null else representative_id end,
      assigned_buyer_cod,
      assigned_buyer_filial,
      'potential_only',
      null, null, null,
      auth.uid()
    from to_create
    returning id, potential_supplier_id
  ),
  tags_copied as (
    insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
    select
      ir.id as supplier_id,
      ppt.tag_id,
      auth.uid() as created_by
    from inserted_rows ir
    join public.purchases_potential_supplier_tags ppt
      on ppt.supplier_id = ir.potential_supplier_id
    where not exists (
      select 1
        from public.purchases_unified_supplier_tags ut
       where ut.supplier_id = ir.id
         and ut.tag_id = ppt.tag_id
    )
    returning 1
  )
  select count(*) into v_created from inserted_rows;

  return json_build_object(
    'success', true,
    'created_count', coalesce(v_created,0)
  );
end;
$$;


ALTER FUNCTION "public"."create_missing_unified_suppliers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_missing_unified_suppliers_from_protheus"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
  v_created_count integer := 0;
  v_processed_count integer := 0;
  v_errors text[] := '{}';
  v_rec record;
BEGIN
  -- Get union of all SA2010 tables
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Nenhuma tabela SA2010 encontrada',
      'created_count', 0,
      'processed_count', 0
    );
  END IF;

  -- Find and create missing unified suppliers from Protheus
  FOR v_rec IN EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    missing_protheus AS (
      SELECT DISTINCT
        sa2.a2_filial,
        sa2.a2_cod,
        sa2.a2_loja,
        sa2.a2_nome,
        sa2.a2_nreduz,
        sa2.a2_cgc
      FROM sa2_all sa2
      WHERE NOT EXISTS (
        SELECT 1 
        FROM public.purchases_unified_suppliers us
        WHERE us.protheus_filial = sa2.a2_filial
          AND us.protheus_cod = sa2.a2_cod
          AND us.protheus_loja = sa2.a2_loja
      )
    )
    SELECT * FROM missing_protheus
    ORDER BY a2_filial, a2_cod, a2_loja
  $q$, v_union_sa2)
  LOOP
    BEGIN
      v_processed_count := v_processed_count + 1;
      
      -- Create unified supplier for this Protheus supplier
      INSERT INTO public.purchases_unified_suppliers (
        protheus_filial,
        protheus_cod,
        protheus_loja,
        cnpj,
        created_by
      ) VALUES (
        v_rec.a2_filial,
        v_rec.a2_cod,
        v_rec.a2_loja,
        CASE 
          WHEN v_rec.a2_cgc IS NOT NULL 
          THEN regexp_replace(v_rec.a2_cgc, '[^0-9]', '', 'g')
          ELSE NULL 
        END,
        auth.uid()
      );
      
      v_created_count := v_created_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || format('Erro ao criar unificado para %s-%s-%s: %s', 
          v_rec.a2_filial, v_rec.a2_cod, v_rec.a2_loja, SQLERRM);
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', format('Criados %s fornecedores unificados de %s processados do Protheus', v_created_count, v_processed_count),
    'created_count', v_created_count,
    'processed_count', v_processed_count,
    'errors', v_errors
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro geral: ' || SQLERRM,
      'created_count', v_created_count,
      'processed_count', v_processed_count
    );
END;
$_$;


ALTER FUNCTION "public"."create_missing_unified_suppliers_from_protheus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchases_economic_group"("p_name" "text" DEFAULT NULL::"text") RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_id integer;
  v_final_code text;
  v_final_name text;
BEGIN
  -- Insert new group and capture the generated id
  INSERT INTO public.purchases_economic_groups (name, name_source, created_by)
  VALUES (
    NULLIF(btrim(p_name), ''),
    CASE WHEN p_name IS NOT NULL AND btrim(p_name) <> '' THEN 'manual' ELSE NULL END,
    auth.uid()
  )
  RETURNING purchases_economic_groups.id_grupo INTO v_new_id;

  -- Get the final values after trigger execution
  SELECT 
    g.code,
    COALESCE(g.name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0'))
  INTO v_final_code, v_final_name
  FROM public.purchases_economic_groups g
  WHERE g.id_grupo = v_new_id;

  -- Return the result
  RETURN QUERY SELECT v_new_id, v_final_code, v_final_name;
END;
$$;


ALTER FUNCTION "public"."create_purchases_economic_group"("p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_economic_group"("p_id_grupo" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_member_count integer;
  v_lead_count integer;
BEGIN
  -- Check if group has members or leads
  SELECT COUNT(*) INTO v_member_count
  FROM public.protheus_customer_group_units
  WHERE group_id = p_id_grupo;
  
  SELECT COUNT(*) INTO v_lead_count
  FROM public.sales_leads
  WHERE economic_group_id = p_id_grupo;
  
  -- If group has members or leads, remove them first
  IF v_member_count > 0 THEN
    DELETE FROM public.protheus_customer_group_units
    WHERE group_id = p_id_grupo;
  END IF;
  
  IF v_lead_count > 0 THEN
    UPDATE public.sales_leads
    SET economic_group_id = NULL
    WHERE economic_group_id = p_id_grupo;
  END IF;
  
  -- Delete the group
  DELETE FROM public.protheus_customer_groups
  WHERE id_grupo = p_id_grupo;
  
  RETURN json_build_object(
    'success', true,
    'removed_members', v_member_count,
    'removed_leads', v_lead_count
  );
END;
$$;


ALTER FUNCTION "public"."delete_economic_group"("p_id_grupo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drop_dynamic_table"("p_table_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'table_name é obrigatório');
  END IF;

  -- Permitir apenas nomes com letras minúsculas, números e underscore
  IF p_table_name !~ '^[a-z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Nome de tabela inválido');
  END IF;

  -- Dropar tabela com identificação segura
  EXECUTE format('DROP TABLE IF EXISTS public.%I', p_table_name);

  RETURN json_build_object('success', true, 'message', format('Tabela %s removida', p_table_name));
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$_$;


ALTER FUNCTION "public"."drop_dynamic_table"("p_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."emit_protheus_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only emit events for meaningful status changes (new or updated records)
  IF NEW.record_status IN ('new', 'updated') THEN
    -- Process workflow triggers for protheus record changes
    PERFORM public.process_workflow_triggers(
      'protheus_record_change',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'record_id', NEW.id,
        'protheus_id', NEW.protheus_id,
        'record_status', NEW.record_status,
        'is_new_record', NEW.is_new_record,
        'was_updated_last_sync', NEW.was_updated_last_sync,
        'last_synced_at', NEW.last_synced_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."emit_protheus_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_table_rls"("table_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."enable_table_rls"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_external_form_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check rate limit before allowing new session
  IF NOT public.check_external_form_rate_limit(NEW.form_id, NEW.client_ip) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Too many attempts from this IP address.' 
    USING ERRCODE = '42501';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_external_form_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_pending_requests_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  allowed boolean;
BEGIN
  IF NEW.request_ip_hash IS NULL THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (gen_random_uuid(), 'pending_access_rate_limit', NULL, 'missing_ip_hash', '00000000-0000-0000-0000-000000000000', 'system');
    RETURN NEW;
  END IF;

  allowed := public.check_ip_rate_limit(NEW.request_ip_hash);
  IF NOT allowed THEN
    RAISE EXCEPTION 'Too many requests from this IP. Please try again later.' USING ERRCODE = '42901';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_pending_requests_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_site_product_name_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_name_id uuid;
  v_creator uuid;
BEGIN
  -- Se não houver nome, não há o que vincular
  IF NEW.name IS NULL OR btrim(NEW.name) = '' THEN
    RETURN NEW;
  END IF;

  -- Se já houver name_id, não faz nada
  IF NEW.name_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tenta localizar o nome exatamente igual
  SELECT id INTO v_name_id
  FROM public.site_product_names
  WHERE name = NEW.name
  LIMIT 1;

  -- Se não existe, cria
  IF v_name_id IS NULL THEN
    v_creator := auth.uid(); -- pode ser NULL em contexto sem usuário
    INSERT INTO public.site_product_names (name, name_en, is_active, created_by)
    VALUES (NEW.name, NEW.name_en, true, v_creator)
    RETURNING id INTO v_name_id;
  END IF;

  -- Preenche o vínculo
  NEW.name_id := v_name_id;

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."ensure_site_product_name_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_unified_supplier_and_assign_group"("p_potential_id" "uuid", "p_group_id" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_unified_id uuid;
  v_assign_result json;
begin
  v_unified_id := public.ensure_unified_supplier_from_potential(p_potential_id);

  if p_group_id is not null then
    v_assign_result := public.add_unified_supplier_to_purchases_group(p_group_id, v_unified_id);
  end if;

  return json_build_object(
    'unified_id', v_unified_id,
    'assigned', p_group_id is not null,
    'assign_result', coalesce(v_assign_result, json_build_object('skipped', true))
  );
end;
$$;


ALTER FUNCTION "public"."ensure_unified_supplier_and_assign_group"("p_potential_id" "uuid", "p_group_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_unified_supplier_from_potential"("p_potential_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_unified_id uuid;
  v_buyer_cod text;
  v_buyer_filial text;
  v_cnpj text;
begin
  if p_potential_id is null then
    raise exception 'p_potential_id não pode ser nulo';
  end if;

  -- Já existe unificado para este potencial?
  select id
    into v_unified_id
  from public.purchases_unified_suppliers
  where potential_supplier_id = p_potential_id
  limit 1;

  if v_unified_id is not null then
    return v_unified_id;
  end if;

  -- Buscar alguns campos do potencial (opcionais)
  select 
    nullif(btrim(assigned_buyer_cod), '') as buyer_cod,
    nullif(btrim(assigned_buyer_filial), '') as buyer_filial,
    cnpj
  into v_buyer_cod, v_buyer_filial, v_cnpj
  from public.purchases_potential_suppliers
  where id = p_potential_id;

  if not found then
    raise exception 'Potencial fornecedor % não encontrado', p_potential_id;
  end if;

  -- Criar o unificado a partir do potencial
  insert into public.purchases_unified_suppliers (
    potential_supplier_id,
    assigned_buyer_cod,
    assigned_buyer_filial,
    cnpj,
    created_by
  ) values (
    p_potential_id,
    v_buyer_cod,
    v_buyer_filial,
    v_cnpj,
    auth.uid()
  )
  returning id into v_unified_id;

  return v_unified_id;
end;
$$;


ALTER FUNCTION "public"."ensure_unified_supplier_from_potential"("p_potential_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql_statement" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validate that the statement is ALTER TABLE
  IF sql_statement !~* '^ALTER TABLE' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Apenas comandos ALTER TABLE são permitidos'
    );
  END IF;

  -- Execute the SQL statement
  EXECUTE sql_statement;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Comando executado com sucesso'
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;


ALTER FUNCTION "public"."execute_sql"("sql_statement" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_chunk_count_inconsistencies"() RETURNS TABLE("document_id" "uuid", "old_count" integer, "new_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  UPDATE documents 
  SET chunk_count = actual_count
  FROM (
    SELECT 
      d.id,
      d.chunk_count as old_chunk_count,
      COALESCE(COUNT(dc.id), 0) as actual_count
    FROM documents d
    LEFT JOIN doc_chunks dc ON dc.document_id = d.id
    GROUP BY d.id, d.chunk_count
    HAVING d.chunk_count != COALESCE(COUNT(dc.id), 0)
  ) inconsistent
  WHERE documents.id = inconsistent.id
  RETURNING documents.id, inconsistent.old_chunk_count, documents.chunk_count;
END;
$$;


ALTER FUNCTION "public"."fix_chunk_count_inconsistencies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_approval_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório
  token := encode(gen_random_bytes(32), 'base64url');
  
  -- Retornar o token (será usado para gerar o hash no edge function)
  RETURN token;
END;
$$;


ALTER FUNCTION "public"."generate_approval_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_device_fingerprint"("user_agent_param" "text", "screen_resolution" "text", "timezone_param" "text", "language_param" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  combined_string text;
  fingerprint_hash text;
BEGIN
  -- Combinar todas as características do dispositivo
  combined_string := user_agent_param || '|' || screen_resolution || '|' || timezone_param || '|' || language_param;
  
  -- Tentar usar SHA-256 primeiro
  BEGIN
    SELECT encode(digest(combined_string, 'sha256'), 'hex') INTO fingerprint_hash;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback para MD5 se digest não funcionar
    fingerprint_hash := md5(combined_string);
  END;
  
  RETURN fingerprint_hash;
END;
$$;


ALTER FUNCTION "public"."generate_device_fingerprint"("user_agent_param" "text", "screen_resolution" "text", "timezone_param" "text", "language_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_employee_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_code := 'EMP' || LPAD(counter::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_code = new_code);
    counter := counter + 1;
  END LOOP;
  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_employee_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_form_publication_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório de 32 bytes (256 bits) em base64url
  token := encode(gen_random_bytes(32), 'base64');
  
  -- Limpar caracteres que podem causar problemas em URLs
  token := replace(token, '+', '-');
  token := replace(token, '/', '_');
  token := replace(token, '=', '');
  
  RETURN token;
END;
$$;


ALTER FUNCTION "public"."generate_form_publication_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_password_hash"("password" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;


ALTER FUNCTION "public"."generate_password_hash"("password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_password_reset_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  entropy TEXT;
BEGIN
  -- Generate a 32 character random token
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Add timestamp entropy
  entropy := extract(epoch from now())::text || random()::text;
  
  -- Combine and hash using md5 (native PostgreSQL function)
  -- MD5 produces a 32-character hex string which is sufficient for our needs
  RETURN md5(result || entropy);
END;
$$;


ALTER FUNCTION "public"."generate_password_reset_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_relationship_name"("source_table_name" "text", "target_table_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN UPPER(source_table_name || '_' || target_table_name);
END;
$$;


ALTER FUNCTION "public"."generate_relationship_name"("source_table_name" "text", "target_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_secure_form_password"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$_$;


ALTER FUNCTION "public"."generate_secure_form_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_secure_password"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$_$;


ALTER FUNCTION "public"."generate_secure_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_task_occurrences"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_url text;
  v_key text;
begin
  -- Obter configurações da tabela
  select value into v_url from public.app_settings where key = 'edge_url';
  select value into v_key from public.app_settings where key = 'edge_key';

  -- Se não encontrar configurações, retornar erro informativo
  if v_url is null or v_key is null then
    return json_build_object(
      'status', 'error',
      'message', 'Configurações edge_url/edge_key não encontradas na tabela app_settings'
    );
  end if;

  -- Fazer a chamada HTTP
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer '||v_key
    ),
    body := '{}'::jsonb
  );
  
  return json_build_object('status','triggered');
exception
  when others then
    return json_build_object(
      'status', 'error', 
      'message', SQLERRM,
      'url', v_url
    );
end;
$$;


ALTER FUNCTION "public"."generate_task_occurrences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_telegram_setup_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  code TEXT;
BEGIN
  -- Gerar código de 6 dígitos
  code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN code;
END;
$$;


ALTER FUNCTION "public"."generate_telegram_setup_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_purchases_economic_groups"() RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text", "ai_suggested_name" "text", "member_count" integer, "assigned_buyer_cod" "text", "assigned_buyer_name" "text", "created_at" timestamp with time zone, "material_types" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    peg.id_grupo,
    peg.code,
    peg.name,
    peg.ai_suggested_name,
    COALESCE(member_counts.member_count, 0)::integer AS member_count,
    peg.assigned_buyer_cod,
    COALESCE(btrim(sy1.y1_nome), peg.assigned_buyer_cod) AS assigned_buyer_name,
    peg.created_at,
    COALESCE(
      ARRAY(
        SELECT DISTINCT smt.name
        FROM public.purchases_economic_group_material_types pegmt
        JOIN public.site_material_types smt ON smt.id = pegmt.material_type_id
        WHERE pegmt.group_id = peg.id_grupo
        ORDER BY smt.name
      ),
      ARRAY[]::text[]
    ) AS material_types
  FROM public.purchases_economic_groups peg
  LEFT JOIN (
    SELECT 
      group_id,
      COUNT(*) AS member_count
    FROM public.purchases_economic_group_members
    GROUP BY group_id
  ) member_counts ON member_counts.group_id = peg.id_grupo
  LEFT JOIN public.protheus_sy1010_3249e97a sy1 
    ON btrim(sy1.y1_cod) = btrim(peg.assigned_buyer_cod)
   AND btrim(sy1.y1_filial) = COALESCE(btrim(peg.assigned_buyer_filial), '01')
  ORDER BY 
    CASE WHEN peg.name IS NOT NULL THEN peg.name 
         WHEN peg.ai_suggested_name IS NOT NULL THEN peg.ai_suggested_name 
         ELSE 'Grupo ' || peg.id_grupo::text 
    END ASC;
END;
$$;


ALTER FUNCTION "public"."get_all_purchases_economic_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_subordinates"("supervisor_uuid" "uuid") RETURNS TABLE("subordinate_id" "uuid")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  WITH RECURSIVE subordinate_tree AS (
    -- Base case: direct subordinates (excluindo usuários TEST)
    SELECT p.id as subordinate_id
    FROM public.profiles p
    WHERE p.supervisor_id = supervisor_uuid
    AND p.status = 'active'
    AND NOT public.is_test_user(p.id)
    
    UNION ALL
    
    -- Recursive case: subordinates of subordinates (excluindo usuários TEST)
    SELECT p.id as subordinate_id
    FROM public.profiles p
    INNER JOIN subordinate_tree st ON p.supervisor_id = st.subordinate_id
    WHERE p.status = 'active'
    AND NOT public.is_test_user(p.id)
  )
  SELECT DISTINCT st.subordinate_id FROM subordinate_tree st;
$$;


ALTER FUNCTION "public"."get_all_subordinates"("supervisor_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_audit_log_count"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT COUNT(*) FROM public.field_audit_log;
$$;


ALTER FUNCTION "public"."get_audit_log_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_audit_log_size"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT pg_total_relation_size('public.field_audit_log');
$$;


ALTER FUNCTION "public"."get_audit_log_size"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_customer_groups_with_id"("p_table_id" "uuid") RETURNS TABLE("id_grupo" integer, "group_id" "uuid", "filial" "text", "cod" "text", "nome_grupo" "text", "nome_grupo_sugerido" "text", "member_count" integer, "vendor_names" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_table text;
  v_has_vendor_table boolean := false;
  v_union_sa1 text;
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  end if;

  select exists (
    select 1 from information_schema.tables 
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  -- Monta união dinâmica de todas as SA1010 (clientes)
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         btrim(a1_vend::text) as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usa uma união vazia
  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_vend
                    where false';
  end if;

  return query execute format($q$
    with sa1_all as (
      %s
    )
    select 
      pcg.id_grupo,
      pcg.id as group_id,
      pcg.filial,
      pcg.cod,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      pcg.nome_grupo_sugerido,
      (
        select count(*)::int
        from public.unified_accounts ua
        where ua.economic_group_id = pcg.id_grupo
      ) as member_count,
      (
        select coalesce(
          array(
            select distinct
              case 
                when %L and sa3.a3_nome is not null then 
                  coalesce(btrim(sa3.a3_nreduz::text), btrim(sa3.a3_nome::text))
                when sa1.a1_vend is not null then sa1.a1_vend
                when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod
                else null
              end
            from public.unified_accounts ua2
            left join sa1_all sa1 on (
              ua2.protheus_filial = sa1.a1_filial and
              ua2.protheus_cod = sa1.a1_cod and
              ua2.protheus_loja = sa1.a1_loja
            )
            left join public.sales_leads sl on sl.id = ua2.lead_id
            left join public.protheus_sa3010_fc3d70f6 sa3 on 
              btrim(sa3.a3_cod::text) = coalesce(btrim(sa1.a1_vend), btrim(sl.assigned_vendor_cod))
              and btrim(sa3.a3_filial::text) = coalesce(sa1.a1_filial, btrim(sl.assigned_vendor_filial), '01')
            where ua2.economic_group_id = pcg.id_grupo
              and (
                (sa1.a1_vend is not null and btrim(sa1.a1_vend) <> '') or
                (sl.assigned_vendor_cod is not null and btrim(sl.assigned_vendor_cod) <> '')
              )
            order by 1
          ),
          array[]::text[]
        )
      ) as vendor_names
    from public.protheus_customer_groups pcg
    where pcg.protheus_table_id = %L
    order by pcg.id_grupo
  $q$, v_union_sa1, v_has_vendor_table, p_table_id);
end;
$_$;


ALTER FUNCTION "public"."get_customer_groups_with_id"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_department_name"("dept_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT name FROM public.departments WHERE id = dept_id;
$$;


ALTER FUNCTION "public"."get_department_name"("dept_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_leads"("p_id_grupo" integer) RETURNS TABLE("lead_id" "uuid", "trade_name" "text", "legal_name" "text", "assigned_vendor_cod" "text", "vendor_name" "text", "cnpj" "text", "city_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_has_vendor_table BOOLEAN := false;
BEGIN
  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sl.id as lead_id,
      sl.trade_name::text,
      sl.legal_name::text,
      sl.assigned_vendor_cod::text,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sl.assigned_vendor_cod::text 
      END as vendor_name,
      sl.cnpj::text,
      c.name::text as city_name
    FROM public.sales_leads sl
    LEFT JOIN public.site_cities c ON c.id = sl.city_id
    %s
    WHERE sl.economic_group_id = %L
    ORDER BY sl.trade_name
  $q$, 
       v_has_vendor_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sl.assigned_vendor_cod::text'
            ELSE ''
       END,
       p_id_grupo);
END;
$_$;


ALTER FUNCTION "public"."get_group_leads"("p_id_grupo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_members"("p_id_grupo" integer, "p_table_id" "uuid") RETURNS TABLE("filial" "text", "cod" "text", "loja" "text", "nome" "text", "nome_reduzido" "text", "vendor_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      pgu.filial,
      pgu.cod,
      pgu.loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sa1.a1_vend::text 
      END as vendor_name
    FROM public.protheus_customer_group_units pgu
    JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    %s
    WHERE pgu.group_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  $q$, 
       v_has_vendor_table, 
       v_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sa1.a1_vend::text'
            ELSE ''
       END,
       p_id_grupo);
END;
$_$;


ALTER FUNCTION "public"."get_group_members"("p_id_grupo" integer, "p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_group_update_results"("p_table_id" "uuid") RETURNS TABLE("filial" "text", "cod" "text", "loja" "text", "nome" "text", "action" "text", "group_name" "text", "reason" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

  -- Última execução
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
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text, ''Grupo não encontrado'') AS group_name,
      pgur.reason,
      pgur.created_at
    FROM public.protheus_group_update_results pgur
    LEFT JOIN %I sa1 ON (
      sa1.a1_filial::text = pgur.filial AND
      sa1.a1_cod::text = pgur.cod AND
      sa1.a1_loja::text = pgur.loja
    )
    -- IMPORTANTE: join por id_grupo (INTEGER) para manter tipos compatíveis
    LEFT JOIN public.protheus_customer_groups pcg 
      ON pcg.id_grupo = pgur.group_id
    WHERE pgur.run_id = %L
    ORDER BY pgur.created_at DESC
  ', v_table, v_last_run_id);
END;
$$;


ALTER FUNCTION "public"."get_last_group_update_results"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ocr_model_stats"("days_back" integer DEFAULT 7) RETURNS TABLE("model" "text", "total_pages" integer, "avg_processing_time_ms" integer, "total_cost" numeric, "avg_quality_score" numeric, "fallback_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.model_used,
    COUNT(*)::INTEGER as total_pages,
    AVG(om.processing_time_ms)::INTEGER as avg_processing_time_ms,
    SUM(om.cost_estimate) as total_cost,
    AVG(om.quality_score) as avg_quality_score,
    (COUNT(*) FILTER (WHERE om.fallback_reason IS NOT NULL)::DECIMAL / COUNT(*) * 100) as fallback_rate
  FROM public.ocr_metrics om
  WHERE om.created_at >= (now() - (days_back || ' days')::INTERVAL)
  GROUP BY om.model_used
  ORDER BY total_pages DESC;
END;
$$;


ALTER FUNCTION "public"."get_ocr_model_stats"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") RETURNS TABLE("group_id" "uuid", "a1_filial" "text", "a1_cod" "text", "display_name" "text", "unit_count" integer, "vendors" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH g AS (
      SELECT 
        a1_filial::text AS a1_filial,
        a1_cod::text    AS a1_cod,
        COUNT(*)::int   AS unit_count,
        ARRAY_AGG(DISTINCT a1_nome::text) AS nomes,
        ARRAY_AGG(DISTINCT a1_vend::text) AS vendors
      FROM %I
      GROUP BY 1,2
    )
    SELECT 
      pg.id AS group_id,
      g.a1_filial,
      g.a1_cod,
      COALESCE(
        pg.name,
        pg.ai_suggested_name,
        -- Fallback: menor nome entre as unidades (tende a ser a marca/razão sintética)
        (SELECT n FROM unnest(g.nomes) AS n ORDER BY length(n) ASC LIMIT 1)
      ) AS display_name,
      g.unit_count,
      g.vendors
    FROM g
    LEFT JOIN public.protheus_customer_groups pg
      ON pg.protheus_table_id = %L::uuid
     AND pg.filial = g.a1_filial
     AND pg.cod    = g.a1_cod
    ORDER BY display_name NULLS LAST, g.a1_cod, g.a1_filial
  $q$, v_table, p_table_id);
END;
$_$;


ALTER FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_protheus_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") RETURNS TABLE("unit_name" "text", "short_name" "text", "vendor" "text", "loja" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      a1_nome::text AS unit_name,
      a1_nreduz::text AS short_name,
      a1_vend::text AS vendor,
      a1_loja::text AS loja
    FROM %I
    WHERE a1_filial::text = %L
      AND a1_cod::text = %L
    ORDER BY a1_loja::text
  $q$, v_table, p_filial, p_cod);
END;
$_$;


ALTER FUNCTION "public"."get_protheus_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") RETURNS TABLE("unit_name" "text", "short_name" "text", "loja" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT 
      a2_nome::text   AS unit_name,
      a2_nreduz::text AS short_name,
      a2_loja::text   AS loja
    FROM %I
    WHERE a2_filial::text = %L
      AND a2_cod::text    = %L
    ORDER BY a2_loja::text
  $q$, v_table, p_filial, p_cod);
END;
$_$;


ALTER FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") RETURNS TABLE("group_id" "uuid", "a2_filial" "text", "a2_cod" "text", "display_name" "text", "unit_count" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
BEGIN
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH g AS (
      SELECT 
        a2_filial::text AS a2_filial,
        a2_cod::text    AS a2_cod,
        COUNT(*)::int   AS unit_count,
        ARRAY_AGG(DISTINCT a2_nome::text) AS nomes,
        ARRAY_AGG(DISTINCT a2_nreduz::text) AS short_names
      FROM %I
      GROUP BY 1,2
    )
    SELECT 
      pg.id AS group_id,
      g.a2_filial,
      g.a2_cod,
      COALESCE(
        pg.name,
        pg.ai_suggested_name,
        -- Fallback: menor nome entre as unidades (tende a ser a marca/razão sintética)
        (SELECT n FROM unnest(COALESCE(short_names, nomes)) AS n ORDER BY length(n) ASC LIMIT 1)
      ) AS display_name,
      g.unit_count
    FROM g
    LEFT JOIN public.protheus_supplier_groups pg
      ON pg.protheus_table_id = %L::uuid
     AND pg.filial = g.a2_filial
     AND pg.cod    = g.a2_cod
    ORDER BY display_name NULLS LAST, g.a2_cod, g.a2_filial
  $q$, v_table, p_table_id);
END;
$_$;


ALTER FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_economic_groups"() RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text", "member_count" integer, "assigned_buyer_cod" "text", "assigned_buyer_filial" "text", "protheus_filial" "text", "protheus_cod" "text", "member_buyer_names" "text"[], "group_assigned_buyer_name" "text", "material_type_names" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH group_data AS (
    SELECT 
      peg.id_grupo,
      peg.code,
      COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) AS name,
      peg.assigned_buyer_cod,
      peg.assigned_buyer_filial,
      peg.protheus_filial,
      peg.protheus_cod
    FROM public.purchases_economic_groups peg
  ),
  member_counts AS (
    SELECT 
      pegm.group_id,
      COUNT(*)::integer AS member_count
    FROM public.purchases_economic_group_members pegm
    GROUP BY pegm.group_id
  ),
  member_buyers AS (
    SELECT 
      pegm.group_id,
      array_agg(DISTINCT y1.y1_nome ORDER BY y1.y1_nome)
        FILTER (WHERE y1.y1_nome IS NOT NULL AND btrim(y1.y1_nome) <> '') AS buyer_names
    FROM public.purchases_economic_group_members pegm
    JOIN public.purchases_unified_suppliers pus ON pus.id = pegm.unified_supplier_id
    LEFT JOIN public.purchases_potential_suppliers pps ON pps.id = pus.potential_supplier_id
    LEFT JOIN public.protheus_sy1010_3249e97a y1 ON (
      btrim(y1.y1_cod) = COALESCE(
        nullif(btrim(pus.assigned_buyer_cod), ''),
        nullif(btrim(pps.assigned_buyer_cod), '')
      )
      AND btrim(y1.y1_filial) = COALESCE(
        nullif(btrim(pus.assigned_buyer_filial), ''),
        nullif(btrim(pps.assigned_buyer_filial), ''),
        '01'
      )
    )
    GROUP BY pegm.group_id
  ),
  group_buyers AS (
    SELECT 
      gd.id_grupo,
      y1g.y1_nome AS group_buyer_name
    FROM group_data gd
    LEFT JOIN public.protheus_sy1010_3249e97a y1g ON (
      btrim(y1g.y1_cod) = nullif(btrim(gd.assigned_buyer_cod), '')
      AND btrim(y1g.y1_filial) = COALESCE(nullif(btrim(gd.assigned_buyer_filial), ''), '01')
    )
  ),
  group_material_types AS (
    SELECT 
      egmt.group_id,
      array_agg(DISTINCT mt.name ORDER BY mt.name) AS material_type_names
    FROM public.purchases_economic_group_material_types egmt
    JOIN public.purchases_material_types mt ON mt.id = egmt.material_type_id
    GROUP BY egmt.group_id
  )
  SELECT 
    gd.id_grupo,
    gd.code,
    gd.name,
    COALESCE(mc.member_count, 0) AS member_count,
    gd.assigned_buyer_cod,
    gd.assigned_buyer_filial,
    gd.protheus_filial,
    gd.protheus_cod,
    COALESCE(mb.buyer_names, ARRAY[]::text[]) AS member_buyer_names,
    gb.group_buyer_name AS group_assigned_buyer_name,
    COALESCE(gmt.material_type_names, ARRAY[]::text[]) AS material_type_names
  FROM group_data gd
  LEFT JOIN member_counts mc ON mc.group_id = gd.id_grupo
  LEFT JOIN member_buyers mb ON mb.group_id = gd.id_grupo
  LEFT JOIN group_buyers gb ON gb.id_grupo = gd.id_grupo
  LEFT JOIN group_material_types gmt ON gmt.group_id = gd.id_grupo
  ORDER BY gd.id_grupo;
END;
$$;


ALTER FUNCTION "public"."get_purchases_economic_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_economic_groups_paginated"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 50, "p_search_term" "text" DEFAULT NULL::"text", "p_sort_column" "text" DEFAULT 'name'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("id_grupo" integer, "group_id" "uuid", "code" "text", "name" "text", "ai_suggested_name" "text", "name_source" "text", "member_count" bigint, "buyers" "text"[], "material_types" "text"[], "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_offset integer;
  v_search text;
  v_order_clause text;
  v_total_count bigint;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search := COALESCE(p_search_term, '');
  
  -- Validate sort parameters
  IF p_sort_column NOT IN ('name', 'ai_suggested_name', 'code', 'member_count', 'created_at') THEN
    p_sort_column := 'name';
  END IF;
  
  IF p_sort_direction NOT IN ('ASC', 'DESC') THEN
    p_sort_direction := 'ASC';
  END IF;
  
  -- Build order clause
  v_order_clause := format('%I %s', p_sort_column, p_sort_direction);
  
  -- Get total count first
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.purchases_economic_groups peg
  WHERE (v_search = '' OR 
         LOWER(COALESCE(peg.name, '')) ILIKE '%' || LOWER(v_search) || '%' OR
         LOWER(COALESCE(peg.ai_suggested_name, '')) ILIKE '%' || LOWER(v_search) || '%' OR
         LOWER(COALESCE(peg.code, '')) ILIKE '%' || LOWER(v_search) || '%');

  RETURN QUERY EXECUTE format($q$
    WITH group_members AS (
      SELECT 
        pegm.group_id,
        COUNT(*) as member_count
      FROM public.purchases_economic_group_members pegm
      GROUP BY pegm.group_id
    ),
    group_buyers AS (
      SELECT 
        pegm.group_id,
        ARRAY_AGG(DISTINCT us.assigned_buyer_cod) FILTER (WHERE us.assigned_buyer_cod IS NOT NULL) as buyers
      FROM public.purchases_economic_group_members pegm
      JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      GROUP BY pegm.group_id
    ),
    group_material_types AS (
      SELECT 
        pegm.group_id,
        ARRAY_AGG(DISTINCT pmt.name) FILTER (WHERE pmt.name IS NOT NULL) as material_types
      FROM public.purchases_economic_group_members pegm
      JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_unified_supplier_material_types pusmt ON pusmt.supplier_id = us.id
      LEFT JOIN public.purchases_material_types pmt ON pmt.id = pusmt.material_type_id
      GROUP BY pegm.group_id
    )
    SELECT 
      peg.id_grupo,
      peg.id as group_id,
      peg.code,
      peg.name,
      peg.ai_suggested_name,
      peg.name_source,
      COALESCE(gm.member_count, 0) as member_count,
      COALESCE(gb.buyers, ARRAY[]::text[]) as buyers,
      COALESCE(gmt.material_types, ARRAY[]::text[]) as material_types,
      peg.created_at,
      peg.updated_at,
      %L::bigint as total_count
    FROM public.purchases_economic_groups peg
    LEFT JOIN group_members gm ON gm.group_id = peg.id_grupo
    LEFT JOIN group_buyers gb ON gb.group_id = peg.id_grupo
    LEFT JOIN group_material_types gmt ON gmt.group_id = peg.id_grupo
    WHERE (%L = '' OR 
           LOWER(COALESCE(peg.name, '')) ILIKE '%%' || LOWER(%L) || '%%' OR
           LOWER(COALESCE(peg.ai_suggested_name, '')) ILIKE '%%' || LOWER(%L) || '%%' OR
           LOWER(COALESCE(peg.code, '')) ILIKE '%%' || LOWER(%L) || '%%')
    ORDER BY %s
    LIMIT %s OFFSET %s
  $q$, v_total_count, v_search, v_search, v_search, v_search, v_order_clause, p_page_size, v_offset);
END;
$_$;


ALTER FUNCTION "public"."get_purchases_economic_groups_paginated"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_economic_groups_paginated"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 10, "p_sort_column" "text" DEFAULT 'name'::"text", "p_sort_direction" "text" DEFAULT 'asc'::"text") RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text", "ai_suggested_name" "text", "member_count" integer, "buyers" "text"[], "material_types" "text"[], "created_at" timestamp with time zone, "total_count" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
  v_search_clause text := '';
  v_sort_clause text;
  v_offset integer;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
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
                      null::text as a2_nreduz,
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    where false';
  END IF;

  -- Construir cláusula de busca se termo fornecido
  IF p_search_term IS NOT NULL AND btrim(p_search_term) <> '' THEN
    v_search_clause := format(
      'AND (
        -- Busca no nome/código do grupo
        lower(unaccent(coalesce(peg.name, peg.ai_suggested_name, ''''))) ilike lower(unaccent(%L)) OR
        lower(unaccent(coalesce(peg.code, ''''))) ilike lower(unaccent(%L)) OR
        
        -- Busca nos membros: nomes do potencial
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(ps.trade_name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(ps.legal_name, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca nos membros: nomes do SA2010
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sa2.a2_nome, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sa2.a2_nreduz, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca no CNPJ normalizado
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          LEFT JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          WHERE pegm.group_id = peg.id_grupo
            AND regexp_replace(coalesce(us.cnpj, ps.cnpj, sa2.a2_cgc, ''''), ''[^0-9]'', '''', ''g'') ilike %L
        ) OR
        
        -- Busca nas chaves Protheus
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              coalesce(us.protheus_filial::text, '''') ilike %L OR
              coalesce(us.protheus_cod::text, '''') ilike %L OR
              coalesce(us.protheus_loja::text, '''') ilike %L
            )
        ) OR
        
        -- Busca na cidade/UF via potencial
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
          LEFT JOIN public.site_cities sc ON sc.id = ps.city_id
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sc.name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sc.uf, ''''))) ilike lower(unaccent(%L))
            )
        ) OR
        
        -- Busca na cidade/UF via SA2010
        EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members pegm
          JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
          LEFT JOIN sa2_all sa2 ON (
            sa2.a2_filial = us.protheus_filial::text AND
            sa2.a2_cod = us.protheus_cod::text AND
            sa2.a2_loja = us.protheus_loja::text
          )
          LEFT JOIN public.site_cities sc ON (
            sc.cod_munic = regexp_replace(coalesce(sa2.a2_cod_mun, ''''), ''[^0-9]'', '''', ''g'') AND
            sc.uf = upper(btrim(coalesce(sa2.a2_est, '''')))
          )
          WHERE pegm.group_id = peg.id_grupo
            AND (
              lower(unaccent(coalesce(sc.name, ''''))) ilike lower(unaccent(%L)) OR
              lower(unaccent(coalesce(sc.uf, ''''))) ilike lower(unaccent(%L))
            )
        )
      )',
      '%' || btrim(p_search_term) || '%',  -- grupo nome
      '%' || btrim(p_search_term) || '%',  -- grupo código
      '%' || btrim(p_search_term) || '%',  -- potencial trade_name
      '%' || btrim(p_search_term) || '%',  -- potencial legal_name
      '%' || btrim(p_search_term) || '%',  -- sa2 a2_nome
      '%' || btrim(p_search_term) || '%',  -- sa2 a2_nreduz
      '%' || regexp_replace(btrim(p_search_term), '[^0-9]', '', 'g') || '%',  -- cnpj
      '%' || btrim(p_search_term) || '%',  -- protheus filial
      '%' || btrim(p_search_term) || '%',  -- protheus cod
      '%' || btrim(p_search_term) || '%',  -- protheus loja
      '%' || btrim(p_search_term) || '%',  -- cidade potencial
      '%' || btrim(p_search_term) || '%',  -- uf potencial
      '%' || btrim(p_search_term) || '%',  -- cidade sa2
      '%' || btrim(p_search_term) || '%'   -- uf sa2
    );
  END IF;

  -- Construir cláusula de ordenação
  CASE p_sort_column
    WHEN 'name' THEN
      v_sort_clause := 'ORDER BY coalesce(peg.name, peg.ai_suggested_name, ''Grupo '' || peg.id_grupo::text) ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'code' THEN
      v_sort_clause := 'ORDER BY peg.code ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'member_count' THEN
      v_sort_clause := 'ORDER BY member_count ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    WHEN 'created_at' THEN
      v_sort_clause := 'ORDER BY peg.created_at ' || 
                      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
    ELSE
      v_sort_clause := 'ORDER BY coalesce(peg.name, peg.ai_suggested_name, ''Grupo '' || peg.id_grupo::text) ASC';
  END CASE;

  -- Calcular offset
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    base_groups AS (
      SELECT 
        peg.id_grupo,
        peg.code,
        peg.name,
        peg.ai_suggested_name,
        peg.created_at,
        COUNT(pegm.id)::integer AS member_count,
        
        -- Buscar compradores únicos dos membros
        COALESCE(
          array_remove(
            array_agg(DISTINCT COALESCE(
              nullif(btrim(us.assigned_buyer_cod), ''),
              nullif(btrim(ps.assigned_buyer_cod), '')
            )),
            NULL
          ),
          ARRAY[]::text[]
        ) AS buyers,
        
        -- Buscar tipos de material únicos
        COALESCE(
          array_remove(
            array_agg(DISTINCT UNNEST(COALESCE(pmt.material_types, ARRAY[]::text[]))),
            NULL
          ),
          ARRAY[]::text[]
        ) AS material_types
        
      FROM public.purchases_economic_groups peg
      LEFT JOIN public.purchases_economic_group_members pegm ON pegm.group_id = peg.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
      LEFT JOIN sa2_all sa2 ON (
        sa2.a2_filial = us.protheus_filial::text AND
        sa2.a2_cod = us.protheus_cod::text AND
        sa2.a2_loja = us.protheus_loja::text
      )
      LEFT JOIN public.purchases_group_material_types pmt ON pmt.group_id = peg.id_grupo
      WHERE 1=1 %s
      GROUP BY peg.id_grupo, peg.code, peg.name, peg.ai_suggested_name, peg.created_at
    ),
    total_count_query AS (
      SELECT COUNT(*)::integer AS total_count FROM base_groups
    )
    SELECT 
      bg.id_grupo,
      bg.code,
      bg.name,
      bg.ai_suggested_name,
      bg.member_count,
      bg.buyers,
      bg.material_types,
      bg.created_at,
      tc.total_count
    FROM base_groups bg
    CROSS JOIN total_count_query tc
    %s
    LIMIT %s OFFSET %s
  $q$, v_union_sa2, v_search_clause, v_sort_clause, p_page_size, v_offset);
END;
$_$;


ALTER FUNCTION "public"."get_purchases_economic_groups_paginated"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_economic_groups_paginated_v2"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 25, "p_search_term" "text" DEFAULT NULL::"text", "p_sort_column" "text" DEFAULT 'name'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text", "ai_suggested_name" "text", "member_count" integer, "material_types" "text"[], "assigned_buyer_cod" "text", "assigned_buyer_name" "text", "assigned_buyer_filial" "text", "protheus_filial" "text", "protheus_cod" "text", "member_buyer_names" "text"[], "group_assigned_buyer_name" "text", "material_type_names" "text"[], "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_offset integer;
  v_union_sa2 text;
  v_search text;
  v_sort_column text;
  v_sort_direction text;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search := COALESCE(trim(p_search_term), '');

  v_sort_column := CASE
    WHEN p_sort_column IN ('id_grupo', 'code', 'name', 'member_count', 'created_at')
    THEN p_sort_column
    ELSE 'name'
  END;

  v_sort_direction := CASE
    WHEN upper(p_sort_direction) IN ('ASC', 'DESC')
    THEN upper(p_sort_direction)
    ELSE 'ASC'
  END;

  -- União SA2010 agora inclui cod_mun/UF para mapear cidade
  SELECT string_agg(
    format(
      'SELECT 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
       FROM %I', 
       supabase_table_name
    ),
    ' UNION ALL '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'SELECT 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz,
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    WHERE false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    group_stats AS (
      SELECT 
        peg.id_grupo,
        peg.code,
        COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) as name,
        peg.ai_suggested_name,
        peg.assigned_buyer_cod,
        peg.assigned_buyer_filial,
        peg.protheus_filial,
        peg.protheus_cod,
        peg.created_at,
        COUNT(DISTINCT pegm.unified_supplier_id) as member_count,
        btrim(y1_group.y1_nome) as group_assigned_buyer_name,
        array_remove(
          array_agg(
            DISTINCT COALESCE(
              btrim(y1_member.y1_nome),
              COALESCE(
                nullif(btrim(us.assigned_buyer_cod), ''),
                nullif(btrim(ps.assigned_buyer_cod), '')
              )
            )
          ), NULL
        ) as member_buyer_names,
        array_remove(array_agg(DISTINCT pmt.name), NULL) as material_type_names
      FROM public.purchases_economic_groups peg
      LEFT JOIN public.purchases_economic_group_members pegm ON pegm.group_id = peg.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us.potential_supplier_id
      LEFT JOIN public.protheus_sy1010_3249e97a y1_group
        ON btrim(y1_group.y1_cod)    = btrim(peg.assigned_buyer_cod)
       AND btrim(y1_group.y1_filial) = COALESCE(btrim(peg.assigned_buyer_filial), '01')
      LEFT JOIN public.protheus_sy1010_3249e97a y1_member
        ON btrim(y1_member.y1_cod) = COALESCE(
             nullif(btrim(us.assigned_buyer_cod), ''),
             nullif(btrim(ps.assigned_buyer_cod), '')
           )
       AND btrim(y1_member.y1_filial) = COALESCE(
             nullif(btrim(us.assigned_buyer_filial), ''),
             nullif(btrim(ps.assigned_buyer_filial), ''),
             '01'
           )
      LEFT JOIN public.purchases_unified_supplier_material_types pusmt 
        ON pusmt.supplier_id = us.id
      LEFT JOIN public.purchases_material_types pmt 
        ON pmt.id = pusmt.material_type_id AND pmt.is_active = true
      GROUP BY 
        peg.id_grupo, peg.code, peg.name, peg.ai_suggested_name, 
        peg.assigned_buyer_cod, peg.assigned_buyer_filial,
        peg.protheus_filial, peg.protheus_cod, peg.created_at,
        y1_group.y1_nome
    ),
    filtered_groups AS (
      SELECT 
        gs.*,

        -- Nomes dos fornecedores (SA2010)
        COALESCE(
          array_agg(DISTINCT sa2.a2_nome) FILTER (WHERE sa2.a2_nome IS NOT NULL),
          ARRAY[]::text[]
        ) as supplier_names,
        COALESCE(
          array_agg(DISTINCT sa2.a2_nreduz) FILTER (WHERE sa2.a2_nreduz IS NOT NULL),
          ARRAY[]::text[]
        ) as supplier_short_names,

        -- CNPJs (SA2010 + Unificado + Potencial) normalizados
        COALESCE(
          array_agg(
            DISTINCT regexp_replace(
              COALESCE(us2.cnpj, ps.cnpj, sa2.a2_cgc), '[^0-9]', '', 'g'
            )
          ) FILTER (
            WHERE COALESCE(us2.cnpj, ps.cnpj, sa2.a2_cgc) IS NOT NULL 
              AND COALESCE(regexp_replace(COALESCE(us2.cnpj, ps.cnpj, sa2.a2_cgc), '[^0-9]', '', 'g'), '') <> ''
          ),
          ARRAY[]::text[]
        ) as supplier_cnpjs,

        -- Cidades/UF dos membros (Potencial via site_cities e SA2010 mapeado por cod_mun/UF)
        COALESCE(
          array_agg(
            DISTINCT COALESCE(
              CASE 
                WHEN sc_ps.id IS NOT NULL THEN sc_ps.name || ' - ' || sc_ps.uf
                ELSE NULL
              END,
              CASE
                WHEN sc_sa2.id IS NOT NULL THEN sc_sa2.name || ' - ' || sc_sa2.uf
                ELSE NULL
              END
            )
          ) FILTER (
            WHERE sc_ps.id IS NOT NULL OR sc_sa2.id IS NOT NULL
          ),
          ARRAY[]::text[]
        ) as member_city_labels

      FROM group_stats gs
      LEFT JOIN public.purchases_economic_group_members pegm2 ON pegm2.group_id = gs.id_grupo
      LEFT JOIN public.purchases_unified_suppliers us2 ON us2.id = pegm2.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers ps ON ps.id = us2.potential_supplier_id
      LEFT JOIN sa2_all sa2 
        ON sa2.a2_filial = us2.protheus_filial::text
       AND sa2.a2_cod    = us2.protheus_cod::text
       AND sa2.a2_loja   = us2.protheus_loja::text
      LEFT JOIN public.site_cities sc_ps 
        ON sc_ps.id = ps.city_id
      LEFT JOIN public.site_cities sc_sa2 
        ON sc_sa2.cod_munic = regexp_replace(COALESCE(sa2.a2_cod_mun, ''), '[^0-9]', '', 'g')
       AND sc_sa2.uf        = upper(btrim(COALESCE(sa2.a2_est, '')))
      GROUP BY 
        gs.id_grupo, gs.code, gs.name, gs.ai_suggested_name, gs.member_count,
        gs.assigned_buyer_cod, gs.assigned_buyer_filial, gs.protheus_filial, 
        gs.protheus_cod, gs.created_at, gs.group_assigned_buyer_name,
        gs.member_buyer_names, gs.material_type_names
    ),
    search_filtered AS (
      SELECT *
      FROM filtered_groups fg
      WHERE (
        %L = '' OR
        fg.name ILIKE %L OR
        fg.ai_suggested_name ILIKE %L OR
        fg.code ILIKE %L OR
        fg.protheus_filial ILIKE %L OR
        fg.protheus_cod ILIKE %L OR
        fg.group_assigned_buyer_name ILIKE %L OR
        EXISTS (SELECT 1 FROM unnest(fg.member_buyer_names)  AS buyer_name WHERE buyer_name ILIKE %L) OR
        EXISTS (SELECT 1 FROM unnest(fg.material_type_names) AS material_type WHERE material_type ILIKE %L) OR
        EXISTS (SELECT 1 FROM unnest(fg.supplier_names)      AS supplier_name WHERE supplier_name ILIKE %L) OR
        EXISTS (SELECT 1 FROM unnest(fg.supplier_short_names) AS supplier_short_name WHERE supplier_short_name ILIKE %L) OR
        EXISTS (SELECT 1 FROM unnest(fg.supplier_cnpjs)      AS supplier_cnpj WHERE supplier_cnpj ILIKE %L) OR
        EXISTS (SELECT 1 FROM unnest(fg.member_city_labels)  AS city_label WHERE city_label ILIKE %L)
      )
    ),
    total_count AS (
      SELECT COUNT(*) as total FROM search_filtered
    )
    SELECT 
      sf.id_grupo,
      sf.code,
      sf.name,
      sf.ai_suggested_name,
      sf.member_count::integer,
      sf.material_type_names as material_types,
      sf.assigned_buyer_cod,
      COALESCE(sf.group_assigned_buyer_name, sf.assigned_buyer_cod) as assigned_buyer_name,
      sf.assigned_buyer_filial,
      sf.protheus_filial,
      sf.protheus_cod,
      sf.member_buyer_names,
      sf.group_assigned_buyer_name,
      sf.material_type_names,
      sf.created_at,
      tc.total as total_count
    FROM search_filtered sf, total_count tc
    ORDER BY 
      CASE WHEN %L = 'ASC' THEN
        CASE %L
          WHEN 'id_grupo'     THEN sf.id_grupo::text
          WHEN 'code'         THEN sf.code
          WHEN 'name'         THEN sf.name
          WHEN 'member_count' THEN lpad(sf.member_count::text, 10, '0')
          WHEN 'created_at'   THEN sf.created_at::text
          ELSE sf.name
        END
      END ASC,
      CASE WHEN %L = 'DESC' THEN
        CASE %L
          WHEN 'id_grupo'     THEN sf.id_grupo::text
          WHEN 'code'         THEN sf.code
          WHEN 'name'         THEN sf.name
          WHEN 'member_count' THEN lpad(sf.member_count::text, 10, '0')
          WHEN 'created_at'   THEN sf.created_at::text
          ELSE sf.name
        END
      END DESC
    LIMIT %L OFFSET %L
  $q$, 
    v_union_sa2,
    v_search,
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    '%' || v_search || '%',
    v_sort_direction,
    v_sort_column,
    v_sort_direction,
    v_sort_column,
    p_page_size,
    v_offset
  );
END;
$_$;


ALTER FUNCTION "public"."get_purchases_economic_groups_paginated_v2"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_group_members"("p_id_grupo" integer) RETURNS TABLE("unified_id" "uuid", "display_name" "text", "trade_name" "text", "legal_name" "text", "cnpj" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "assigned_buyer_cod" "text", "assigned_buyer_filial" "text", "assigned_buyer_name" "text", "city_name" "text", "city_uf" "text", "city_label" "text", "distance_km_to_indaiatuba" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores) com campos para cidade/UF
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
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
                      null::text as a2_nreduz,
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT 
      us.id AS unified_id,

      -- Nome para exibição (mantém compatibilidade)
      COALESCE(
        sa2.a2_nreduz,
        ps.trade_name,
        sa2.a2_nome,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
      ) AS display_name,

      -- Nomes detalhados
      COALESCE(sa2.a2_nreduz, ps.trade_name) AS trade_name,
      COALESCE(sa2.a2_nome,   ps.legal_name) AS legal_name,
      
      -- CNPJ normalizado
      CASE 
        WHEN COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj) IS NOT NULL 
        THEN regexp_replace(COALESCE(us.cnpj, sa2.a2_cgc, ps.cnpj), '[^0-9]', '', 'g')
        ELSE NULL 
      END AS cnpj,

      us.status::text AS unified_status,
      us.protheus_filial::text,
      us.protheus_cod::text,
      us.protheus_loja::text,

      -- Comprador designado (código/filial normalizados)
      COALESCE(
        nullif(btrim(us.assigned_buyer_cod), ''),
        nullif(btrim(ps.assigned_buyer_cod), '')
      ) AS assigned_buyer_cod,
      
      COALESCE(
        nullif(btrim(us.assigned_buyer_filial), ''),
        nullif(btrim(ps.assigned_buyer_filial), ''),
        '01'
      ) AS assigned_buyer_filial,
      
      -- Nome do comprador (join com SY1010, com trims)
      btrim(y1.y1_nome) AS assigned_buyer_name,

      -- Cidade/UF e distância: prioridade para cidade do potencial; fallback SA2010
      COALESCE(sc_ps.name, sc_sa2.name) AS city_name,
      COALESCE(sc_ps.uf,   sc_sa2.uf)   AS city_uf,
      CASE 
        WHEN sc_ps.id IS NOT NULL THEN sc_ps.name || ' - ' || sc_ps.uf
        WHEN sc_sa2.id IS NOT NULL THEN sc_sa2.name || ' - ' || sc_sa2.uf
        ELSE NULL
      END AS city_label,
      COALESCE(sc_ps.distance_km_to_indaiatuba, sc_sa2.distance_km_to_indaiatuba) AS distance_km_to_indaiatuba

    FROM public.purchases_economic_group_members m
    JOIN public.purchases_unified_suppliers us
      ON us.id = m.unified_supplier_id
    LEFT JOIN public.purchases_potential_suppliers ps
      ON ps.id = us.potential_supplier_id
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = us.protheus_filial::text
     AND sa2.a2_cod    = us.protheus_cod::text
     AND sa2.a2_loja   = us.protheus_loja::text
    LEFT JOIN public.protheus_sy1010_3249e97a y1
      ON btrim(y1.y1_cod) = COALESCE(
           nullif(btrim(us.assigned_buyer_cod), ''),
           nullif(btrim(ps.assigned_buyer_cod), '')
         )
     AND btrim(y1.y1_filial) = COALESCE(
           nullif(btrim(us.assigned_buyer_filial), ''),
           nullif(btrim(ps.assigned_buyer_filial), ''),
           '01'
         )
    -- Cidade do potencial
    LEFT JOIN public.site_cities sc_ps 
      ON sc_ps.id = ps.city_id
    -- Cidade mapeada via SA2010 (cod_mun + UF)
    LEFT JOIN public.site_cities sc_sa2 
      ON sc_sa2.cod_munic = regexp_replace(COALESCE(sa2.a2_cod_mun, ''), '[^0-9]', '', 'g')
     AND sc_sa2.uf        = upper(btrim(COALESCE(sa2.a2_est, '')))
    WHERE m.group_id = %L
    ORDER BY display_name
  $q$, v_union_sa2, p_id_grupo);
END;
$_$;


ALTER FUNCTION "public"."get_purchases_group_members"("p_id_grupo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchases_supplier_totalizers"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_union_sa2         text;
  v_unified           integer := 0;
  v_potential         integer := 0;
  v_protheus          integer := 0;
  v_missing           integer := 0;
begin
  -- Contagens diretas
  select count(*)::int into v_unified   from public.purchases_unified_suppliers;
  select count(*)::int into v_potential from public.purchases_potential_suppliers;

  -- União dinâmica de SA2010 para contar Protheus
  select string_agg(
           format('select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja from %I', supabase_table_name),
           ' union all '
         )
    into v_union_sa2
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2 is not null then
    execute format($q$
      with sa2_all as (%s)
      select count(*)::int from sa2_all
    $q$, v_union_sa2)
    into v_protheus;
  end if;

  -- Faltantes = tamanho da lista consolidada
  select count(*)::int into v_missing
  from public.list_missing_unified_suppliers();

  return json_build_object(
    'unified',   v_unified,
    'potential', v_potential,
    'protheus',  v_protheus,
    'missing',   v_missing
  );
end;
$_$;


ALTER FUNCTION "public"."get_purchases_supplier_totalizers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_account_names"("p_unified_id" "uuid") RETURNS TABLE("trade_name" "text", "legal_name" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_union_sa1 text;
begin
  -- Monta a união de todas as SA1010 dinâmicas
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial,
         a1_cod::text    as a1_cod,
         a1_loja::text   as a1_loja,
         a1_nreduz::text as a1_nreduz,
         a1_nome::text   as a1_nome
       from %I',
       supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial,
                      null::text as a1_cod,
                      null::text as a1_loja,
                      null::text as a1_nreduz,
                      null::text as a1_nome
                    where false';
  end if;

  return query execute format($q$
    with sa1_all as (
      %s
    )
    select
      -- Linha 1 (prioridade Fantasia/Reduzido do Protheus)
      coalesce(sa1.a1_nreduz, sl.trade_name, sa1.a1_nome, sl.legal_name) as trade_name,
      -- Linha 2 (prioridade Razão Social do Protheus)
      coalesce(sa1.a1_nome,   sl.legal_name, sa1.a1_nreduz, sl.trade_name) as legal_name,
      ua.protheus_filial::text,
      ua.protheus_cod::text,
      ua.protheus_loja::text
    from public.unified_accounts ua
    left join sa1_all sa1
      on sa1.a1_filial = ua.protheus_filial::text
     and sa1.a1_cod    = ua.protheus_cod::text
     and sa1.a1_loja   = ua.protheus_loja::text
    left join public.sales_leads sl
      on sl.id = ua.lead_id
    where ua.id = %L
    limit 1
  $q$, v_union_sa1, p_unified_id);
end;
$_$;


ALTER FUNCTION "public"."get_unified_account_names"("p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_customer_groups"() RETURNS TABLE("id_grupo" integer, "group_id" "uuid", "nome_grupo" "text", "member_count" integer, "vendor_names" "text"[], "group_vendor_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa1 text;
  v_union_sa3 text;
BEGIN
  -- União dinâmica de todas as SA1010 (clientes)
  SELECT string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         btrim(a1_vend::text) as a1_vend
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_vend
                    where false';
  END IF;

  -- União dinâmica de todas as SA3010 (vendedores)
  SELECT string_agg(
    format(
      'select 
         btrim(a3_filial::text) as a3_filial, 
         btrim(a3_cod::text)    as a3_cod, 
         btrim(a3_nreduz::text) as a3_nreduz, 
         btrim(a3_nome::text)   as a3_nome
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa3
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa3010%';

  IF v_union_sa3 IS NULL THEN
    v_union_sa3 := 'select 
                      null::text as a3_filial, 
                      null::text as a3_cod, 
                      null::text as a3_nreduz, 
                      null::text as a3_nome
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa1_all AS (
      %s
    ),
    sa3_all AS (
      %s
    ),
    groups AS (
      SELECT
        pcg.id_grupo,
        pcg.id AS group_id,
        coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) AS nome_grupo,
        -- Extrair vendor do array vendors (primeiro elemento)
        CASE 
          WHEN pcg.vendors IS NOT NULL AND array_length(pcg.vendors, 1) > 0
          THEN btrim(pcg.vendors[1]::text)
          ELSE NULL 
        END AS group_vendor_cod
      FROM public.protheus_customer_groups pcg
    ),
    members AS (
      SELECT
        ua.economic_group_id AS id_grupo,
        ua.id AS unified_id,
        ua.lead_id,
        ua.protheus_filial,
        ua.protheus_cod,
        ua.protheus_loja
      FROM public.unified_accounts ua
      WHERE ua.economic_group_id IS NOT NULL
    ),
    lead_vendors AS (
      SELECT
        m.id_grupo,
        btrim(sl.assigned_vendor_cod)                  AS vendor_cod,
        coalesce(btrim(sl.assigned_vendor_filial), '01') AS vendor_filial
      FROM members m
      JOIN public.sales_leads sl ON sl.id = m.lead_id
      WHERE sl.assigned_vendor_cod IS NOT NULL 
        AND btrim(sl.assigned_vendor_cod) <> ''
    ),
    client_vendors AS (
      SELECT
        m.id_grupo,
        sa1.a1_vend                 AS vendor_cod,
        btrim(sa1.a1_filial)        AS vendor_filial
      FROM members m
      JOIN sa1_all sa1
        ON sa1.a1_filial = m.protheus_filial
       AND sa1.a1_cod    = m.protheus_cod
       AND sa1.a1_loja   = m.protheus_loja
      WHERE sa1.a1_vend IS NOT NULL 
        AND btrim(sa1.a1_vend) <> ''
    ),
    all_vendor_codes AS (
      SELECT id_grupo, vendor_cod, vendor_filial FROM lead_vendors
      UNION
      SELECT id_grupo, vendor_cod, vendor_filial FROM client_vendors
    ),
    vendor_names_per_group AS (
      SELECT
        av.id_grupo,
        coalesce(sa3.a3_nreduz, sa3.a3_nome, av.vendor_cod) AS vendor_name
      FROM all_vendor_codes av
      LEFT JOIN sa3_all sa3
        ON sa3.a3_cod    = av.vendor_cod
       AND sa3.a3_filial = av.vendor_filial
      WHERE coalesce(coalesce(sa3.a3_nreduz, sa3.a3_nome, av.vendor_cod), '') <> ''
    ),
    group_vendor_resolved AS (
      SELECT
        g.id_grupo,
        coalesce(sa3g.a3_nreduz, sa3g.a3_nome, g.group_vendor_cod) AS group_vendor_name
      FROM groups g
      LEFT JOIN sa3_all sa3g
        ON sa3g.a3_cod = g.group_vendor_cod
       AND sa3g.a3_filial = '01'  -- Assumindo filial padrão
    )
    SELECT
      g.id_grupo,
      g.group_id,
      g.nome_grupo,
      coalesce(count(distinct m.unified_id), 0)::int AS member_count,
      coalesce(
        array(
          SELECT distinct vn.vendor_name
          FROM vendor_names_per_group vn
          WHERE vn.id_grupo = g.id_grupo
          ORDER BY vn.vendor_name
        ),
        array[]::text[]
      ) AS vendor_names,
      gvr.group_vendor_name
    FROM groups g
    LEFT JOIN members m ON m.id_grupo = g.id_grupo
    LEFT JOIN group_vendor_resolved gvr ON gvr.id_grupo = g.id_grupo
    GROUP BY g.id_grupo, g.group_id, g.nome_grupo, gvr.group_vendor_name
    ORDER BY g.id_grupo
  $q$, v_union_sa1, v_union_sa3);

END;
$_$;


ALTER FUNCTION "public"."get_unified_customer_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer) RETURNS TABLE("unified_id" "uuid", "display_name" "text", "short_name" "text", "commercial_name" "text", "legal_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "vendor_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa1 text;
  v_union_sa3 text;
BEGIN
  -- União dinâmica de todas as SA1010 (clientes)
  SELECT string_agg(
    format(
      'select 
         btrim(a1_filial::text) as a1_filial, 
         btrim(a1_cod::text)    as a1_cod, 
         btrim(a1_loja::text)   as a1_loja, 
         btrim(a1_nome::text)   as a1_nome, 
         btrim(a1_nreduz::text) as a1_nreduz,
         btrim(a1_vend::text)   as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
                      null::text as a1_vend
                    where false';
  END IF;

  -- União dinâmica de todas as SA3010 (vendedores)
  SELECT string_agg(
    format(
      'select 
         btrim(a3_filial::text) as a3_filial, 
         btrim(a3_cod::text)    as a3_cod, 
         btrim(a3_nreduz::text) as a3_nreduz, 
         btrim(a3_nome::text)   as a3_nome
       from %I', supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa3
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa3010%';

  IF v_union_sa3 IS NULL THEN
    v_union_sa3 := 'select 
                      null::text as a3_filial, 
                      null::text as a3_cod, 
                      null::text as a3_nreduz, 
                      null::text as a3_nome
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa1_all AS (
      %s
    ),
    sa3_all AS (
      %s
    ),
    base AS (
      SELECT
        ua.id                               AS unified_id,
        ua.status::text                     AS unified_status,
        btrim(ua.protheus_filial::text)     AS protheus_filial,
        btrim(ua.protheus_cod::text)        AS protheus_cod,
        btrim(ua.protheus_loja::text)       AS protheus_loja,
        ua.lead_id,
        sa1.a1_nome,
        sa1.a1_nreduz,
        sa1.a1_vend,
        btrim(sl.trade_name::text)          AS trade_name,
        btrim(sl.legal_name::text)          AS lead_legal_name,
        btrim(sl.assigned_vendor_cod::text) AS lead_vendor_cod,
        btrim(coalesce(sl.assigned_vendor_filial::text, '01')) AS lead_vendor_filial
      FROM public.unified_accounts ua
      LEFT JOIN sa1_all sa1
        ON sa1.a1_filial = btrim(ua.protheus_filial::text)
       AND sa1.a1_cod    = btrim(ua.protheus_cod::text)
       AND sa1.a1_loja   = btrim(ua.protheus_loja::text)
      LEFT JOIN public.sales_leads sl
        ON sl.id = ua.lead_id
      WHERE ua.economic_group_id = %L
    )
    SELECT
      b.unified_id,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name, 'Cliente ' || coalesce(b.protheus_cod,'')) AS display_name,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name)                                          AS short_name,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name)                                          AS commercial_name,
      coalesce(nullif(b.lead_legal_name, ''), nullif(b.a1_nome, ''))                                             AS legal_name,
      b.unified_status,
      b.protheus_filial,
      b.protheus_cod,
      b.protheus_loja,
      coalesce(sa3.a3_nreduz, sa3.a3_nome, v.vendor_cod)                                                         AS vendor_name
    FROM base b
    LEFT JOIN LATERAL (
      SELECT 
        coalesce(btrim(b.a1_vend), btrim(b.lead_vendor_cod))                        AS vendor_cod,
        coalesce(btrim(b.lead_vendor_filial), btrim(b.protheus_filial), '01')       AS vendor_filial
    ) v ON TRUE
    LEFT JOIN sa3_all sa3
      ON sa3.a3_cod    = v.vendor_cod
     AND sa3.a3_filial = v.vendor_filial
    ORDER BY display_name
  $q$, v_union_sa1, v_union_sa3, p_id_grupo);
END;
$_$;


ALTER FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer, "p_table_id" "uuid") RETURNS TABLE("unified_id" "uuid", "display_name" "text", "short_name" "text", "vendor_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_table text;
  v_has_vendor_table boolean := false;
begin
  -- Tabela SA1 correspondente ao table_id (para nomes de clientes Protheus)
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  -- Tabela de vendedores SA3 existe?
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  return query execute format($q$
    select
      ua.id as unified_id,
      coalesce(sa1.a1_nome::text, sl.trade_name::text, sl.legal_name::text, 'Sem nome') as display_name,
      coalesce(sa1.a1_nreduz::text, sl.legal_name::text, sl.trade_name::text) as short_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja
    from public.unified_accounts ua
    left join %I sa1 on (
      ua.protheus_filial::text = sa1.a1_filial::text and
      ua.protheus_cod::text    = sa1.a1_cod::text and
      ua.protheus_loja::text   = sa1.a1_loja::text
    )
    left join public.sales_leads sl on sl.id = ua.lead_id
    %s
    where ua.economic_group_id = %L
    order by display_name
  $q$,
    v_has_vendor_table,
    v_table,
    case when v_has_vendor_table 
      then 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      else ''
    end,
    p_id_grupo
  );
end;
$_$;


ALTER FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer, "p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role_and_department"("user_id" "uuid") RETURNS TABLE("user_role" "text", "user_department" "uuid", "is_user_leader" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.role, p.department_id, p.is_leader
  FROM public.profiles p 
  WHERE p.id = user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_role_and_department"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_chatter_file_versioning"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  existing_group_id uuid;
  max_version integer;
BEGIN
  -- Se é um novo upload para o mesmo record + descrição, é uma nova versão
  IF NEW.document_group_id IS NULL THEN
    -- Procurar por grupo existente com mesma descrição
    SELECT document_group_id INTO existing_group_id
    FROM public.chatter_files 
    WHERE record_type = NEW.record_type 
      AND record_id = NEW.record_id 
      AND description = NEW.description 
      AND id != NEW.id
    LIMIT 1;
    
    IF existing_group_id IS NOT NULL THEN
      -- É uma nova versão de documento existente
      NEW.document_group_id := existing_group_id;
      
      -- Marcar versões anteriores como não atuais
      UPDATE public.chatter_files 
      SET is_current_version = false 
      WHERE document_group_id = existing_group_id;
      
      -- Calcular novo número de versão
      SELECT COALESCE(MAX(version_number), 0) + 1 INTO max_version
      FROM public.chatter_files 
      WHERE document_group_id = existing_group_id;
      
      NEW.version_number := max_version;
      NEW.is_current_version := true;
    ELSE
      -- É um documento completamente novo
      NEW.document_group_id := gen_random_uuid();
      NEW.version_number := 1;
      NEW.is_current_version := true;
    END IF;
  END IF;
  
  -- Se requer aprovação, definir status como pending
  IF NEW.requires_approval = true AND NEW.approval_status IS NULL THEN
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_chatter_file_versioning"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_expired_shares"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update expired shares
  UPDATE public.record_shares 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
  -- Create notifications for users whose shared access has expired
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT 
    shared_with,
    'share_expired',
    'Acesso compartilhado expirou',
    'Seu acesso ao registro "' || record_name || '" expirou',
    jsonb_build_object(
      'share_id', id,
      'record_type', record_type,
      'record_id', record_id,
      'record_name', record_name,
      'expired_at', now()
    )
  FROM public.record_shares
  WHERE status = 'expired' 
    AND expires_at IS NOT NULL 
    AND expires_at BETWEEN (now() - INTERVAL '1 hour') AND now();
END;
$$;


ALTER FUNCTION "public"."handle_expired_shares"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_form_versioning"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  max_version integer;
BEGIN
  -- Se o formulário tem respostas e está sendo modificado (exceto campos específicos)
  IF OLD.has_responses = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR
    OLD.settings IS DISTINCT FROM NEW.settings
  ) THEN
    -- Encontrar próximo número de versão
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO max_version
    FROM public.form_versions 
    WHERE form_id = OLD.id;
    
    -- Criar nova versão com os dados antigos
    INSERT INTO public.form_versions (
      form_id, 
      version_number, 
      title, 
      description, 
      fields_definition, 
      settings,
      created_by,
      response_count,
      is_current
    ) 
    SELECT 
      OLD.id,
      OLD.version_number,
      OLD.title,
      OLD.description, 
      OLD.fields_definition,
      OLD.settings,
      OLD.created_by,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id),
      false;
    
    -- Atualizar formulário principal com nova versão
    NEW.version_number := max_version;
    NEW.has_responses := false; -- Resetar para nova versão
    NEW.publication_status := 'draft'; -- Nova versão começa como rascunho
    NEW.is_published := false;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_form_versioning"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'department', 'Geral')
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_ocr_error"("p_document_id" "uuid", "p_error_message" "text", "p_should_retry" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result json;
BEGIN
  -- Atualizar status do documento
  IF p_should_retry THEN
    UPDATE documents 
    SET 
      status = 'Processando',
      updated_at = now(),
      error_message = p_error_message,
      retry_count = COALESCE(retry_count, 0) + 1
    WHERE id = p_document_id;
  ELSE
    UPDATE documents 
    SET 
      status = 'Rejeitado',
      updated_at = now(),
      error_message = CASE 
        WHEN p_error_message ILIKE '%memory%' OR p_error_message ILIKE '%timeout%' 
        THEN 'Falha no processamento: arquivo muito grande. Tente reduzir o tamanho da imagem.'
        ELSE p_error_message
      END
    WHERE id = p_document_id;
  END IF;
  
  result := json_build_object(
    'success', true,
    'document_id', p_document_id,
    'action', CASE WHEN p_should_retry THEN 'retry' ELSE 'rejected' END
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."handle_ocr_error"("p_document_id" "uuid", "p_error_message" "text", "p_should_retry" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_form_token"("token_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  token_hash TEXT;
BEGIN
  -- Criar hash SHA-256 do token
  SELECT encode(digest(token_text, 'sha256'), 'hex') INTO token_hash;
  RETURN token_hash;
END;
$$;


ALTER FUNCTION "public"."hash_form_token"("token_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_device_trusted"("user_id_param" "uuid", "device_fingerprint_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Verificar se existe dispositivo ativo e não expirado para o usuário especificado
  SELECT EXISTS (
    SELECT 1 
    FROM trusted_devices 
    WHERE user_id = user_id_param
      AND device_fingerprint = device_fingerprint_param
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  RETURN is_trusted;
END;
$$;


ALTER FUNCTION "public"."is_device_trusted"("user_id_param" "uuid", "device_fingerprint_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_test_user"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (
      email ILIKE '%test%' 
      OR name ILIKE '%[TEST]%'
    )
  );
$$;


ALTER FUNCTION "public"."is_test_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_group_units"("p_table_id" "uuid") RETURNS TABLE("filial" "text", "cod" "text", "loja" "text", "nome" "text", "group_id" "uuid", "group_name" "text", "assigned_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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
      pcg.id AS group_id,  -- Use UUID from protheus_customer_groups.id
      COALESCE(pcg.name, pcg.ai_suggested_name, sa1.a1_nome::text) AS group_name,
      pgu.assigned_at
    FROM public.protheus_customer_group_units pgu
    INNER JOIN %I sa1 ON (
      sa1.a1_filial::text = pgu.filial AND
      sa1.a1_cod::text = pgu.cod AND
      sa1.a1_loja::text = pgu.loja
    )
    INNER JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = pgu.group_id
    WHERE pgu.protheus_table_id = %L
    ORDER BY pgu.filial, pgu.cod, pgu.loja
  ', v_table, p_table_id);
END;
$$;


ALTER FUNCTION "public"."list_group_units"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_missing_unified_suppliers"() RETURNS TABLE("source" "text", "potential_id" "uuid", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "trade_name" "text", "legal_name" "text", "cnpj" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_union_sa2 text;
begin
  -- União dinâmica de todas as SA2010 (fornecedores Protheus)
  select string_agg(
           format(
             'select 
                a2_filial::text as filial, 
                a2_cod::text    as cod, 
                a2_loja::text   as loja, 
                a2_nome::text   as legal_name, 
                a2_nreduz::text as trade_name, 
                a2_cgc::text    as cnpj
              from %I',
             supabase_table_name
           ),
           ' union all '
         )
    into v_union_sa2
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  -- 1A) Potenciais sem unificado
  return query
  select
    'potential'::text as source,
    ps.id             as potential_id,
    null::text        as protheus_filial,
    null::text        as protheus_cod,
    null::text        as protheus_loja,
    coalesce(ps.trade_name, ps.legal_name) as trade_name,
    ps.legal_name     as legal_name,
    case when ps.cnpj is not null then regexp_replace(ps.cnpj, '[^0-9]', '', 'g') else null end as cnpj
  from public.purchases_potential_suppliers ps
  left join public.purchases_unified_suppliers us
    on us.potential_supplier_id = ps.id
  where us.id is null;

  -- 1B) Protheus sem unificado (se houver SA2010)
  if v_union_sa2 is not null then
    return query execute format($q$
      with sa2_all as (%s)
      select
        'protheus'::text as source,
        null::uuid       as potential_id,
        s.filial         as protheus_filial,
        s.cod            as protheus_cod,
        s.loja           as protheus_loja,
        s.trade_name,
        s.legal_name,
        case when s.cnpj is not null then regexp_replace(s.cnpj, '[^0-9]', '', 'g') else null end as cnpj
      from sa2_all s
      where not exists (
        select 1
          from public.purchases_unified_suppliers us
         where us.protheus_filial = s.filial
           and us.protheus_cod    = s.cod
           and us.protheus_loja   = s.loja
      )
    $q$, v_union_sa2);
  end if;
end;
$_$;


ALTER FUNCTION "public"."list_missing_unified_suppliers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_document_access"("p_document_id" "uuid", "p_folder_id" "uuid", "p_access_type" "text", "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.document_access_logs (
    user_id,
    document_id,
    folder_id,
    access_type,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid(),
    p_document_id,
    p_folder_id,
    p_access_type,
    p_user_agent,
    p_ip_address
  );
END;
$$;


ALTER FUNCTION "public"."log_document_access"("p_document_id" "uuid", "p_folder_id" "uuid", "p_access_type" "text", "p_user_agent" "text", "p_ip_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "event_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.field_audit_log (
    record_id,
    field_name,
    old_value,
    new_value,
    changed_by,
    record_type
  )
  VALUES (
    gen_random_uuid(),
    'security_event',
    event_type,
    event_data::text,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'security_audit'
  );
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "event_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."matches_protheus_trigger"("trigger_config" "jsonb", "event_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  configured_table_id UUID;
  configured_statuses TEXT[];
  event_table_name TEXT;
  event_status TEXT;
BEGIN
  -- Extract configuration
  configured_table_id := (trigger_config->>'table_id')::UUID;
  configured_statuses := ARRAY(SELECT jsonb_array_elements_text(trigger_config->'statuses'));
  
  -- Extract event data
  event_table_name := event_data->>'table_name';
  event_status := event_data->>'record_status';
  
  -- Check if table matches (by looking up table name from protheus_tables)
  IF NOT EXISTS (
    SELECT 1 FROM protheus_tables pt 
    WHERE pt.id = configured_table_id 
    AND 'protheus_' || LOWER(pt.table_name) || '_' || SUBSTRING(pt.id::text, 1, 8) = event_table_name
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if status matches
  IF event_status = ANY(configured_statuses) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."matches_protheus_trigger"("trigger_config" "jsonb", "event_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_all_sa2010_to_unified"("p_table_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table_name text;
  v_supplier record;
  v_result json;
  v_merged_count int := 0;
  v_created_count int := 0;
  v_processed_count int := 0;
  v_error_count int := 0;
BEGIN
  -- Buscar nome da tabela dinâmica
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tabela dinâmica não encontrada para o table_id fornecido'
    );
  END IF;

  -- Processar todos os fornecedores da tabela
  FOR v_supplier IN EXECUTE format($q$
    SELECT DISTINCT
      a2_filial::text as filial,
      a2_cod::text as cod,
      a2_loja::text as loja
    FROM %I
    WHERE a2_filial IS NOT NULL
      AND a2_cod IS NOT NULL  
      AND a2_loja IS NOT NULL
  $q$, v_table_name)
  LOOP
    BEGIN
      -- Chamar função de mesclagem para cada fornecedor
      SELECT merge_unified_supplier_with_protheus(
        p_table_id,
        v_supplier.filial,
        v_supplier.cod,
        v_supplier.loja
      ) INTO v_result;

      v_processed_count := v_processed_count + 1;

      -- Contar ações
      IF (v_result->>'success')::boolean THEN
        IF v_result->>'action' = 'merged' THEN
          v_merged_count := v_merged_count + 1;
        ELSIF v_result->>'action' = 'created' THEN
          v_created_count := v_created_count + 1;
        END IF;
      ELSE
        v_error_count := v_error_count + 1;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_processed_count := v_processed_count + 1;
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'merged_count', v_merged_count,
    'created_count', v_created_count,
    'error_count', v_error_count
  );
END;
$_$;


ALTER FUNCTION "public"."merge_all_sa2010_to_unified"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_unified_supplier_with_protheus"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table_name text;
  v_supplier_data record;
  v_cnpj_normalized text;
  v_existing_unified record;
  v_result json;
BEGIN
  -- Buscar nome da tabela dinâmica
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tabela dinâmica não encontrada para o table_id fornecido'
    );
  END IF;

  -- Buscar dados do fornecedor Protheus
  EXECUTE format($q$
    SELECT 
      a2_filial::text as filial,
      a2_cod::text as cod,
      a2_loja::text as loja,
      a2_cgc::text as cnpj
    FROM %I
    WHERE a2_filial::text = %L
      AND a2_cod::text = %L
      AND a2_loja::text = %L
    LIMIT 1
  $q$, v_table_name, p_filial, p_cod, p_loja)
  INTO v_supplier_data;

  IF v_supplier_data IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Fornecedor não encontrado na tabela Protheus'
    );
  END IF;

  -- Normalizar CNPJ (apenas dígitos)
  v_cnpj_normalized := regexp_replace(coalesce(v_supplier_data.cnpj, ''), '[^0-9]', '', 'g');

  IF length(v_cnpj_normalized) = 0 THEN
    -- Se não há CNPJ, criar novo registro
    INSERT INTO purchases_unified_suppliers (
      protheus_filial,
      protheus_cod,
      protheus_loja,
      attendance_type,
      status,
      created_by
    ) VALUES (
      v_supplier_data.filial,
      v_supplier_data.cod,
      v_supplier_data.loja,
      'direct',
      'supplier',
      auth.uid()
    );

    RETURN json_build_object(
      'success', true,
      'action', 'created',
      'reason', 'no_cnpj'
    );
  END IF;

  -- Procurar fornecedor unificado existente com mesmo CNPJ
  -- Priorizar: potential_supplier_id IS NOT NULL e protheus_* IS NULL
  SELECT *
  INTO v_existing_unified
  FROM purchases_unified_suppliers
  WHERE regexp_replace(coalesce(cnpj, ''), '[^0-9]', '', 'g') = v_cnpj_normalized
  ORDER BY 
    -- Priorizar registros com potential_supplier_id
    (potential_supplier_id IS NOT NULL)::int DESC,
    -- Priorizar registros sem dados Protheus
    (protheus_filial IS NULL AND protheus_cod IS NULL AND protheus_loja IS NULL)::int DESC,
    -- Em caso de empate, o mais antigo
    created_at ASC
  LIMIT 1;

  IF v_existing_unified IS NOT NULL THEN
    -- Atualizar o registro existente com dados Protheus
    UPDATE purchases_unified_suppliers
    SET 
      protheus_filial = v_supplier_data.filial,
      protheus_cod = v_supplier_data.cod,
      protheus_loja = v_supplier_data.loja,
      updated_at = now()
    WHERE id = v_existing_unified.id;

    RETURN json_build_object(
      'success', true,
      'action', 'merged',
      'unified_id', v_existing_unified.id,
      'had_potential', v_existing_unified.potential_supplier_id IS NOT NULL,
      'had_protheus', v_existing_unified.protheus_filial IS NOT NULL
    );
  ELSE
    -- Criar novo fornecedor unificado
    INSERT INTO purchases_unified_suppliers (
      cnpj,
      protheus_filial,
      protheus_cod,
      protheus_loja,
      attendance_type,
      status,
      created_by
    ) VALUES (
      v_supplier_data.cnpj,
      v_supplier_data.filial,
      v_supplier_data.cod,
      v_supplier_data.loja,
      'direct',
      'supplier',
      auth.uid()
    );

    RETURN json_build_object(
      'success', true,
      'action', 'created',
      'reason', 'no_match'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$_$;


ALTER FUNCTION "public"."merge_unified_supplier_with_protheus"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_text"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Handle null input
  IF input_text IS NULL THEN
    RETURN '';
  END IF;
  
  -- Normalize: unaccent, lowercase, remove extra spaces
  RETURN regexp_replace(
    lower(unaccent(trim(input_text))), 
    '\s+', ' ', 'g'
  );
END;
$$;


ALTER FUNCTION "public"."normalize_text"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_access_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Criar notificação apenas para administradores e diretores
  -- Evitar duplicações verificando se já existe notificação para esta solicitação
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT DISTINCT
    p.id,
    'access_request',
    'Nova solicitação de acesso',
    'Usuário ' || NEW.name || ' solicitou acesso ao sistema',
    jsonb_build_object(
      'access_request_id', NEW.id,
      'requester_name', NEW.name,
      'requester_email', NEW.email,
      'department', NEW.department,
      'role', NEW.role
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'director') 
    AND p.notification_app = true
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.app_notifications 
      WHERE user_id = p.id 
        AND type = 'access_request'
        AND data->>'access_request_id' = NEW.id::text
    );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_access_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_chatter_general"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  record_owner_id UUID;
  author_name TEXT;
  record_name TEXT;
  page_name TEXT;
  message_preview TEXT;
  clean_preview TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  
  -- Determinar página e nome do registro baseado no record_type
  CASE NEW.record_type
    WHEN 'user' THEN
      SELECT name INTO record_name FROM public.profiles WHERE id = NEW.record_id::UUID;
      page_name := 'Usuários';
    WHEN 'department' THEN
      SELECT name INTO record_name FROM public.departments WHERE id = NEW.record_id::UUID;
      page_name := 'Departamentos';
    ELSE
      page_name := NEW.record_type;
      record_name := NEW.record_id;
  END CASE;

  -- Limpar e criar preview da mensagem
  clean_preview := public.clean_message_preview(NEW.message);
  message_preview := LEFT(clean_preview, 100);
  IF LENGTH(clean_preview) > 100 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Para mensagens no chatter de usuários, notificar o dono do perfil
  IF NEW.record_type = 'user' THEN
    record_owner_id := NEW.record_id::UUID;
    
    -- Não notificar o próprio autor
    IF record_owner_id != NEW.author_id THEN
      -- Verificar se o usuário quer receber notificações
      IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = record_owner_id 
        AND notification_app = true 
        AND (notification_types->'chatter')::boolean = true
      ) THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        VALUES (
          record_owner_id,
          'chatter_message',
          author_name || ' enviou uma mensagem no seu perfil',
          message_preview,
          jsonb_build_object(
            'chatter_message_id', NEW.id,
            'record_type', NEW.record_type,
            'record_id', NEW.record_id,
            'record_name', record_name,
            'page_name', page_name,
            'author_id', NEW.author_id,
            'author_name', author_name,
            'message_preview', message_preview,
            'navigation_url', '/usuarios'
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_chatter_general"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_chatter_mentions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  mentioned_user UUID;
  author_name TEXT;
  record_name TEXT;
  page_name TEXT;
  message_preview TEXT;
  clean_preview TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  
  -- Determinar página e nome do registro baseado no record_type
  CASE NEW.record_type
    WHEN 'user' THEN
      SELECT name INTO record_name FROM public.profiles WHERE id = NEW.record_id::UUID;
      page_name := 'Usuários';
    WHEN 'department' THEN
      SELECT name INTO record_name FROM public.departments WHERE id = NEW.record_id::UUID;
      page_name := 'Departamentos';
    ELSE
      page_name := NEW.record_type;
      record_name := NEW.record_id;
  END CASE;

  -- Limpar e criar preview da mensagem
  clean_preview := public.clean_message_preview(NEW.message);
  message_preview := LEFT(clean_preview, 100);
  IF LENGTH(clean_preview) > 100 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Criar notificações para usuários mencionados
  IF NEW.mentioned_users IS NOT NULL THEN
    FOREACH mentioned_user IN ARRAY NEW.mentioned_users
    LOOP
      -- Verificar se o usuário quer receber notificações
      IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = mentioned_user 
        AND notification_app = true 
        AND (notification_types->'mentions')::boolean = true
      ) THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        VALUES (
          mentioned_user,
          'mention',
          author_name || ' te mencionou em ' || page_name,
          message_preview,
          jsonb_build_object(
            'chatter_message_id', NEW.id,
            'record_type', NEW.record_type,
            'record_id', NEW.record_id,
            'record_name', record_name,
            'page_name', page_name,
            'author_id', NEW.author_id,
            'author_name', author_name,
            'message_preview', message_preview,
            'navigation_url', CASE 
              WHEN NEW.record_type = 'user' THEN '/usuarios'
              WHEN NEW.record_type = 'department' THEN '/departamentos'
              ELSE '/'
            END
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_chatter_mentions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_expiring_shares"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Notify about shares expiring in 24 hours
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT DISTINCT
    shared_with,
    'share_expiring',
    'Acesso compartilhado expira em breve',
    'Seu acesso ao registro "' || record_name || '" expira em 24 horas',
    jsonb_build_object(
      'share_id', id,
      'record_type', record_type,
      'record_id', record_id,
      'record_name', record_name,
      'expires_at', expires_at
    )
  FROM public.record_shares
  WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at BETWEEN now() AND (now() + INTERVAL '24 hours')
    AND NOT EXISTS (
      -- Don't send duplicate notifications
      SELECT 1 FROM public.app_notifications 
      WHERE user_id = record_shares.shared_with 
        AND type = 'share_expiring'
        AND (data->>'share_id') = record_shares.id::text
        AND created_at > (now() - INTERVAL '25 hours')
    );
END;
$$;


ALTER FUNCTION "public"."notify_expiring_shares"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_access_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Criar notificações para admins e diretores
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'access_request',
    'Nova solicitação de acesso',
    'Usuário ' || NEW.name || ' solicitou acesso ao sistema',
    jsonb_build_object(
      'access_request_id', NEW.id,
      'requester_name', NEW.name,
      'requester_email', NEW.email,
      'department', NEW.department,
      'role', NEW.role
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'director') 
    AND p.status = 'active'
    AND p.notification_app = true;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_new_access_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_record_shared"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  shared_by_name TEXT;
  shared_with_name TEXT;
BEGIN
  -- Get names for notification
  SELECT name INTO shared_by_name FROM public.profiles WHERE id = NEW.shared_by;
  SELECT name INTO shared_with_name FROM public.profiles WHERE id = NEW.shared_with;
  
  -- Create notification for the person receiving the share
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  VALUES (
    NEW.shared_with,
    'record_shared',
    shared_by_name || ' compartilhou um registro com você',
    'Registro "' || NEW.record_name || '" foi compartilhado com você',
    jsonb_build_object(
      'share_id', NEW.id,
      'record_type', NEW.record_type,
      'record_id', NEW.record_id,
      'record_name', NEW.record_name,
      'shared_by', NEW.shared_by,
      'shared_by_name', shared_by_name,
      'permissions', NEW.permissions
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_record_shared"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_delete_linked_protheus_table"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.linked_outside_protheus = true THEN
    RAISE EXCEPTION 'Esta tabela está linkada fora do Protheus e não pode ser deletada.'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_delete_linked_protheus_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_access_request_approval"("request_id" "uuid", "approved" boolean, "rejection_reason" "text" DEFAULT NULL::"text", "supervisor_id" "uuid" DEFAULT NULL::"uuid", "edited_data" "jsonb" DEFAULT NULL::"jsonb", "current_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  request_record RECORD;
  user_data JSONB;
  result JSON;
  temp_user_id UUID;
BEGIN
  -- Validate current user ID is provided
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não autenticado');
  END IF;

  -- Get the access request
  SELECT * INTO request_record
  FROM public.pending_access_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada');
  END IF;

  -- Delete related notifications for ALL users
  DELETE FROM public.app_notifications
  WHERE type = 'access_request' 
    AND (data->>'access_request_id') = request_record.id::text;

  -- Handle REJECTION - Simple and silent
  IF NOT approved THEN
    -- Log the rejection
    INSERT INTO public.access_rejections (
      original_request_id,
      rejected_by,
      rejection_reason,
      requester_name,
      requester_email,
      requested_role,
      requested_department
    ) VALUES (
      request_record.id,
      current_user_id,
      rejection_reason,
      request_record.name,
      request_record.email,
      request_record.role,
      request_record.department
    );
    
    -- Delete the request (this will free up the email for new requests)
    DELETE FROM public.pending_access_requests 
    WHERE id = request_record.id;
    
    RETURN json_build_object('success', true, 'message', 'Solicitação rejeitada com sucesso');
  END IF;

  -- Handle APPROVAL
  -- Generate a temporary UUID for the user (will be replaced with auth user ID)
  temp_user_id := gen_random_uuid();
  
  -- Prepare user data for creation
  user_data := jsonb_build_object(
    'name', COALESCE((edited_data->>'name')::text, request_record.name),
    'email', request_record.email,
    'role', COALESCE((edited_data->>'role')::text, request_record.role),
    'department', COALESCE((edited_data->>'department')::text, request_record.department),
    'department_id', COALESCE((edited_data->>'department_id')::uuid, request_record.department_id),
    'supervisor_id', supervisor_id,
    'notification_email', request_record.notification_email,
    'notification_app', request_record.notification_app,
    'notification_frequency', request_record.notification_frequency,
    'notification_types', COALESCE(edited_data->'notification_types', jsonb_build_object(
      'changes', jsonb_build_object('app', true, 'email', true),
      'chatter', jsonb_build_object('app', true, 'email', true),
      'mentions', jsonb_build_object('app', true, 'email', true),
      'assignments', jsonb_build_object('app', true, 'email', true),
      'approvals', jsonb_build_object('app', true, 'email', true),
      'corrections', jsonb_build_object('app', true, 'email', true),
      'tasks', jsonb_build_object('app', true, 'email', true),
      'access_requests', jsonb_build_object('app', true, 'email', true)
    )),
    'status', 'pending_password_setup'
  );

  -- Log the approval
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    request_record.id,
    'access_request_approved',
    'pending',
    'approved',
    current_user_id,
    'access_request'
  );

  -- DELETE the request instead of updating (this resolves the unique constraint issue)
  DELETE FROM public.pending_access_requests 
  WHERE id = request_record.id;

  -- Return success with all necessary user data for edge function to create auth user
  RETURN json_build_object(
    'success', true, 
    'message', 'Usuário aprovado com sucesso',
    'user_id', temp_user_id,
    'name', user_data->>'name',
    'email', user_data->>'email',
    'role', user_data->>'role',
    'department', user_data->>'department',
    'department_id', (user_data->>'department_id')::uuid,
    'supervisor_id', supervisor_id,
    'notification_types', user_data->'notification_types',
    'notification_email', (user_data->>'notification_email')::boolean,
    'notification_app', (user_data->>'notification_app')::boolean,
    'notification_frequency', user_data->>'notification_frequency'
  );
END;
$$;


ALTER FUNCTION "public"."process_access_request_approval"("request_id" "uuid", "approved" boolean, "rejection_reason" "text", "supervisor_id" "uuid", "edited_data" "jsonb", "current_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_token approval_tokens%ROWTYPE;
  v_request_id uuid;
  v_approval_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar se a ação é válida
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid action'
    );
  END IF;

  -- Buscar o token válido e não usado
  SELECT * INTO v_token
  FROM approval_tokens 
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL;

  -- Verificar se o token foi encontrado
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid or expired token'
    );
  END IF;

  -- Marcar o token como usado
  UPDATE approval_tokens 
  SET used_at = now(), used_by = auth.uid()
  WHERE id = v_token.id;

  -- Processar baseado no tipo de token
  IF v_token.access_request_id IS NOT NULL THEN
    -- É uma solicitação de acesso
    v_request_id := v_token.access_request_id;
    
    IF p_action = 'approve' THEN
      -- Aprovar solicitação de acesso
      UPDATE access_requests 
      SET status = 'approved', 
          approved_at = now(),
          approved_by = auth.uid()
      WHERE id = v_request_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Solicitação de acesso aprovada com sucesso',
        'type', 'access_request'
      );
    ELSE
      -- Rejeitar solicitação de acesso
      UPDATE access_requests 
      SET status = 'rejected',
          rejected_at = now(),
          rejected_by = auth.uid()
      WHERE id = v_request_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Solicitação de acesso rejeitada',
        'type', 'access_request'
      );
    END IF;
    
  ELSIF v_token.approval_id IS NOT NULL THEN
    -- É uma aprovação de workflow
    v_approval_id := v_token.approval_id;
    
    IF p_action = 'approve' THEN
      -- Aprovar workflow
      UPDATE workflow_approvals 
      SET status = 'approved',
          approved_at = now(),
          approved_by = auth.uid()
      WHERE id = v_approval_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Aprovação de workflow confirmada',
        'type', 'workflow_approval'
      );
    ELSE
      -- Rejeitar workflow
      UPDATE workflow_approvals 
      SET status = 'rejected',
          rejected_at = now(),
          rejected_by = auth.uid()
      WHERE id = v_approval_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Aprovação de workflow rejeitada',
        'type', 'workflow_approval'
      );
    END IF;
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Invalid token type'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Internal server error: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  token_record RECORD;
  approval_record RECORD;
  access_request_record RECORD;
  result JSON;
BEGIN
  -- Buscar token válido
  SELECT * INTO token_record
  FROM public.approval_tokens
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL
    AND action = p_action;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Token inválido ou expirado');
  END IF;
  
  -- Marcar token como usado
  UPDATE public.approval_tokens 
  SET used_at = now(), used_by = p_user_id
  WHERE id = token_record.id;
  
  -- Processar aprovação de workflow
  IF token_record.approval_id IS NOT NULL THEN
    SELECT * INTO approval_record
    FROM public.workflow_approvals
    WHERE id = token_record.approval_id;
    
    IF FOUND THEN
      -- Atualizar aprovação
      UPDATE public.workflow_approvals
      SET 
        status = CASE WHEN p_action = 'approve' THEN 'approved'::approval_status ELSE 'rejected'::approval_status END,
        approved_at = now(),
        approved_by = token_record.created_by,
        comments = 'Aprovado via email em ' || now()
      WHERE id = token_record.approval_id;
      
      result := json_build_object(
        'success', true,
        'type', 'workflow_approval',
        'message', CASE WHEN p_action = 'approve' THEN 'Aprovação realizada com sucesso' ELSE 'Rejeição realizada com sucesso' END
      );
    END IF;
  END IF;
  
  -- Processar solicitação de acesso
  IF token_record.access_request_id IS NOT NULL THEN
    SELECT * INTO access_request_record
    FROM public.pending_access_requests
    WHERE id = token_record.access_request_id;
    
    IF FOUND THEN
      -- Processar usando função existente
      SELECT public.process_access_request_approval(
        token_record.access_request_id,
        p_action = 'approve',
        CASE WHEN p_action = 'reject' THEN 'Rejeitado via email em ' || now() ELSE NULL END
      ) INTO result;
    END IF;
  END IF;
  
  -- Log da ação
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    token_record.id,
    'email_approval_processed',
    p_action,
    'token_used',
    token_record.created_by,
    'approval_token'
  );
  
  RETURN COALESCE(result, json_build_object('success', false, 'message', 'Erro ao processar aprovação'));
END;
$$;


ALTER FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "text", "p_comments" "text" DEFAULT ''::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  approval_record RECORD;
  request_record RECORD;
  result json;
BEGIN
  -- Get the approval record
  SELECT * INTO approval_record
  FROM public.workflow_approvals
  WHERE id = p_approval_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Approval not found');
  END IF;
  
  -- Update the approval status
  UPDATE public.workflow_approvals
  SET 
    status = p_action::approval_status,
    comments = p_comments,
    approved_at = CASE WHEN p_action = 'approved' THEN now() ELSE NULL END,
    approved_by = auth.uid(),
    updated_at = now()
  WHERE id = p_approval_id;
  
  -- Handle access request approvals specifically
  IF approval_record.approval_type = 'access_request' THEN
    -- Get the access request ID from approval_data
    DECLARE
      request_id uuid;
    BEGIN
      request_id := (approval_record.approval_data->>'request_id')::uuid;
      
      IF request_id IS NOT NULL THEN
        -- Process the access request using existing function
        SELECT public.process_access_request_approval(
          request_id,
          p_action = 'approved',
          CASE WHEN p_action = 'rejected' THEN p_comments ELSE NULL END
        ) INTO result;
        
        -- Return the result from access request processing
        RETURN result;
      END IF;
    END;
  END IF;
  
  -- For other approval types, just update status and return success
  RETURN json_build_object(
    'success', true,
    'message', 'Approval processed successfully',
    'approval_id', p_approval_id,
    'action', p_action
  );
END;
$$;


ALTER FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "text", "p_comments" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "public"."approval_status", "p_comments" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  approval_rec RECORD;
  step_complete BOOLEAN := false;
  all_approved BOOLEAN := false;
  result JSONB;
BEGIN
  -- Buscar aprovação e verificar se ainda está pendente
  SELECT * INTO approval_rec
  FROM public.workflow_approvals 
  WHERE id = p_approval_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aprovação não encontrada ou já processada');
  END IF;
  
  -- Atualizar status da aprovação
  UPDATE public.workflow_approvals 
  SET 
    status = p_action,
    approved_at = CASE WHEN p_action = 'approved' THEN NOW() ELSE NULL END,
    approved_by = auth.uid(),
    comments = p_comments,
    updated_at = NOW()
  WHERE id = p_approval_id;
  
  -- Log da ação para auditoria
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    p_approval_id,
    'approval_action',
    'pending',
    p_action::text,
    auth.uid(),
    'workflow_approval'
  );
  
  -- Verificar se o step está completo baseado no formato de aprovação
  DECLARE
    approval_format text;
    total_approvals integer;
    approved_count integer;
    pending_count integer;
  BEGIN
    approval_format := approval_rec.approval_data->>'approval_format';
    
    IF approval_format IS NULL OR approval_format = 'single' THEN
      -- Formato single - sempre completo após primeira ação
      step_complete := true;
      all_approved := (p_action = 'approved');
      
    ELSIF approval_format = 'any' THEN
      -- Formato any - completo após primeira ação (outros serão cancelados automaticamente)
      step_complete := true;
      all_approved := (p_action = 'approved');
      
    ELSIF approval_format = 'all' THEN
      -- Formato all - precisa verificar se todos aprovaram
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      INTO total_approvals, approved_count, pending_count
      FROM public.workflow_approvals
      WHERE workflow_execution_id = approval_rec.workflow_execution_id
        AND step_id = approval_rec.step_id;
      
      -- Step completo se não há mais pendentes OU se foi rejeitado/precisa correção
      step_complete := (pending_count = 0) OR (p_action IN ('rejected', 'needs_correction'));
      all_approved := (pending_count = 0 AND approved_count = total_approvals);
      
    END IF;
  END;
  
  -- Se step foi rejeitado ou precisa correção, cancelar outras aprovações pendentes do mesmo step
  IF p_action IN ('rejected', 'needs_correction') THEN
    UPDATE public.workflow_approvals 
    SET 
      status = 'auto_cancelled',
      comments = 'Cancelado devido a rejeição ou solicitação de correção'
    WHERE workflow_execution_id = approval_rec.workflow_execution_id
      AND step_id = approval_rec.step_id
      AND status = 'pending'
      AND id != p_approval_id;
  END IF;
  
  -- Atualizar status da execução do workflow se necessário
  IF step_complete THEN
    IF all_approved THEN
      -- Marcar step como completo e continuar workflow
      UPDATE public.workflow_execution_steps
      SET 
        status = 'completed',
        completed_at = NOW(),
        output_data = jsonb_build_object('approval_result', 'approved')
      WHERE execution_id = approval_rec.workflow_execution_id
        AND node_id = approval_rec.step_id;
        
      -- TODO: Trigger workflow continuation (pode ser implementado com um job assíncrono)
      
    ELSE
      -- Marcar step como falhado se rejeitado
      IF p_action = 'rejected' THEN
        UPDATE public.workflow_execution_steps
        SET 
          status = 'failed',
          completed_at = NOW(),
          output_data = jsonb_build_object('approval_result', 'rejected', 'reason', p_comments),
          error_message = 'Aprovação rejeitada'
        WHERE execution_id = approval_rec.workflow_execution_id
          AND node_id = approval_rec.step_id;
          
        -- Marcar execução do workflow como falhada
        UPDATE public.workflow_executions
        SET 
          status = 'failed',
          completed_at = NOW(),
          error_message = 'Aprovação rejeitada'
        WHERE id = approval_rec.workflow_execution_id;
        
      ELSIF p_action = 'needs_correction' THEN
        -- Criar entrada de correção
        INSERT INTO public.workflow_corrections (
          workflow_execution_id,
          approval_id,
          assigned_to,
          requested_by,
          correction_details,
          status
        ) VALUES (
          approval_rec.workflow_execution_id,
          p_approval_id,
          approval_rec.approver_id,
          auth.uid(),
          p_comments,
          'pending'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Aprovação processada com sucesso',
    'step_complete', step_complete,
    'all_approved', all_approved,
    'approval_format', approval_rec.approval_data->>'approval_format'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao processar aprovação: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "public"."approval_status", "p_comments" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_workflow_triggers"("trigger_type_param" "text", "trigger_data_param" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  workflow_record RECORD;
  execution_id uuid;
  trigger_log_id uuid;
  triggered_count integer := 0;
  total_workflows integer := 0;
BEGIN
  -- Log do trigger recebido
  INSERT INTO workflow_trigger_logs (
    workflow_id, trigger_type, trigger_data, status
  ) VALUES (
    NULL, trigger_type_param, trigger_data_param, 'processing'
  ) RETURNING id INTO trigger_log_id;

  -- Buscar workflows ativos com triggers compatíveis
  FOR workflow_record IN
    SELECT w.id, w.name, w.workflow_definition
    FROM workflows w
    JOIN workflow_auto_triggers wat ON wat.workflow_id = w.id
    WHERE w.is_active = true 
      AND wat.trigger_type = trigger_type_param
      AND (
        wat.trigger_config IS NULL 
        OR wat.trigger_config = '{}'::jsonb
        OR (
          trigger_type_param = 'protheus_record_change' 
          AND (
            wat.trigger_config->>'selectedTableId' IS NULL
            OR EXISTS (
              SELECT 1 FROM protheus_dynamic_tables pdt
              WHERE pdt.id::text = wat.trigger_config->>'selectedTableId'
                AND pdt.supabase_table_name = trigger_data_param->>'table_name'
            )
          )
          AND (
            wat.trigger_config->>'selectedStatuses' IS NULL
            OR trigger_data_param->>'record_status' = ANY(
              SELECT jsonb_array_elements_text(wat.trigger_config->'selectedStatuses')
            )
          )
        )
      )
  LOOP
    total_workflows := total_workflows + 1;
    
    -- Criar execução do workflow
    INSERT INTO workflow_executions (
      workflow_id, trigger_data, status, record_type, record_id
    ) VALUES (
      workflow_record.id,
      trigger_data_param,
      'pending',
      trigger_data_param->>'table_name',
      (trigger_data_param->>'record_id')::uuid
    ) RETURNING id INTO execution_id;

    -- Atualizar log do trigger
    UPDATE workflow_trigger_logs 
    SET execution_id = execution_id, status = 'triggered'
    WHERE id = trigger_log_id;

    triggered_count := triggered_count + 1;
  END LOOP;

  -- Se nenhum workflow foi encontrado, marcar como não processado
  IF triggered_count = 0 THEN
    UPDATE workflow_trigger_logs 
    SET status = 'no_workflows_matched'
    WHERE id = trigger_log_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'triggered_workflows', triggered_count,
    'total_active_workflows', total_workflows,
    'trigger_log_id', trigger_log_id,
    'trigger_type', trigger_type_param
  );
EXCEPTION WHEN OTHERS THEN
  -- Log do erro
  UPDATE workflow_trigger_logs 
  SET status = 'error', trigger_data = trigger_data_param || jsonb_build_object('error', SQLERRM)
  WHERE id = trigger_log_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'trigger_log_id', trigger_log_id
  );
END;
$$;


ALTER FUNCTION "public"."process_workflow_triggers"("trigger_type_param" "text", "trigger_data_param" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchases_suppliers_validate_source"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Detalhe obrigatório se canal = Indicação/Referência
  if new.source_channel = 'indicacao_referencia' then
    if new.source_detail is null or btrim(new.source_detail) = '' then
      raise exception 'source_detail is required when source_channel = indicacao_referencia';
    end if;
  end if;

  -- Detalhe obrigatório se canal = Outros e subcanal = Outro (especificar)
  if new.source_channel = 'outros' and new.source_subchannel = 'outro_especificar' then
    if new.source_detail is null or btrim(new.source_detail) = '' then
      raise exception 'source_detail is required when source_channel = outros and source_subchannel = outro_especificar';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."purchases_suppliers_validate_source"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchases_unified_suppliers_validate_attendance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.attendance_type = 'representative' THEN
    IF NEW.representative_id IS NULL THEN
      RAISE EXCEPTION 'representative_id is required when attendance_type = representative';
    END IF;
  ELSE
    -- Para atendimento direto, garantimos representative_id nulo
    NEW.representative_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."purchases_unified_suppliers_validate_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text" DEFAULT NULL::"text", "column_filters" "jsonb" DEFAULT '{}'::"jsonb", "limit_param" integer DEFAULT 50, "offset_param" integer DEFAULT 0, "order_fields" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("total_count" bigint, "filtered_count" bigint, "data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  sql_query       text;
  count_query     text;
  where_clause    text := '';
  filter_conditions text[] := '{}';
  search_conditions text[] := '{}';
  column_list     text;
  key_text        text;
  value_text      text;
  safe_table_name text;
  order_clause    text := '';
  esc_search      text;
BEGIN
  -- Validação do nome da tabela
  IF table_name_param IS NULL OR btrim(table_name_param) = '' THEN
    RAISE EXCEPTION 'Table name cannot be null or empty';
  END IF;

  IF table_name_param !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid table name format';
  END IF;

  safe_table_name := table_name_param;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
  ) THEN
    RAISE EXCEPTION 'Table % does not exist', safe_table_name;
  END IF;

  -- Lista de colunas preservando a ordem
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = safe_table_name;

  -- Termo de busca (escapando % _ e \)
  IF search_term IS NOT NULL AND btrim(search_term) <> '' THEN
    esc_search := replace(replace(replace(search_term, '\', '\\'), '%', '\%'), '_', '\_');

    SELECT COALESCE(array_agg(
      format('%I::text ILIKE %L ESCAPE %L', column_name, '%' || esc_search || '%', '\')
    ), '{}')
    INTO search_conditions
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
      AND data_type IN ('text', 'character varying', 'character');
  END IF;

  -- Filtros por coluna (também escapando)
  IF column_filters IS NOT NULL AND jsonb_typeof(column_filters) = 'object' THEN
    FOR key_text, value_text IN
      SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF value_text IS NOT NULL AND btrim(value_text) <> '' THEN
        -- apenas se a coluna existir
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = safe_table_name
            AND column_name = key_text
        ) THEN
          value_text := replace(replace(replace(value_text, '\', '\\'), '%', '\%'), '_', '\_');
          filter_conditions := array_append(
            filter_conditions,
            format('%I::text ILIKE %L ESCAPE %L', key_text, '%' || value_text || '%', '\')
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Monta WHERE
  IF COALESCE(array_length(search_conditions, 1), 0) > 0
     OR COALESCE(array_length(filter_conditions, 1), 0) > 0 THEN
    where_clause := ' WHERE ';

    IF COALESCE(array_length(search_conditions, 1), 0) > 0 THEN
      where_clause := where_clause || '(' || array_to_string(search_conditions, ' OR ') || ')';
    END IF;

    IF COALESCE(array_length(filter_conditions, 1), 0) > 0 THEN
      IF COALESCE(array_length(search_conditions, 1), 0) > 0 THEN
        where_clause := where_clause || ' AND ';
      END IF;
      where_clause := where_clause || array_to_string(filter_conditions, ' AND ');
    END IF;
  END IF;

  -- ORDER BY: usa o primeiro campo da tabela por padrão
  IF order_fields IS NOT NULL AND array_length(order_fields, 1) > 0 THEN
    order_clause := ' ORDER BY ' || array_to_string(order_fields, ', ');
  ELSE
    SELECT ' ORDER BY ' || format('%I', column_name)
    INTO order_clause
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
    ORDER BY ordinal_position
    LIMIT 1;
  END IF;

  -- Contagem total
  sql_query := format('SELECT COUNT(*) FROM %I', safe_table_name);
  EXECUTE sql_query INTO total_count;

  -- Contagem filtrada
  count_query := format('SELECT COUNT(*) FROM %I%s', safe_table_name, where_clause);
  EXECUTE count_query INTO filtered_count;

  -- Consulta principal
  sql_query := format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT %s FROM %I%s%s LIMIT %s OFFSET %s) t',
    column_list,
    safe_table_name,
    where_clause,
    order_clause,
    limit_param,
    offset_param
  );
  EXECUTE sql_query INTO data;

  IF data IS NULL THEN
    data := '[]'::jsonb;
  END IF;

  RETURN NEXT;
END;
$_$;


ALTER FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "order_fields" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text" DEFAULT ''::"text", "column_filters" "jsonb" DEFAULT '{}'::"jsonb", "limit_param" integer DEFAULT 50, "offset_param" integer DEFAULT 0, "count_only" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  query_text text;
  result jsonb;
  total_count integer;
  where_clause text := '';
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name_param !~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name_param;
  END IF;

  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name_param
  ) THEN
    RAISE EXCEPTION 'Table does not exist: %', table_name_param;
  END IF;

  -- Build simple WHERE clause for search only
  IF search_term IS NOT NULL AND length(trim(search_term)) > 0 THEN
    where_clause := format(' WHERE CAST(%I AS text) ILIKE %L', 
                          'protheus_id', 
                          '%' || trim(search_term) || '%');
  END IF;

  -- If only counting, return count
  IF count_only THEN
    query_text := format('SELECT COUNT(*) FROM %I%s', table_name_param, where_clause);
    EXECUTE query_text INTO total_count;
    RETURN jsonb_build_object('count', total_count);
  END IF;

  -- Get total count for pagination
  query_text := format('SELECT COUNT(*) FROM %I%s', table_name_param, where_clause);
  EXECUTE query_text INTO total_count;

  -- Build main query with simple ordering by first column
  query_text := format(
    'SELECT json_agg(row_to_json(t.*)) FROM (SELECT * FROM %I%s ORDER BY %I LIMIT %s OFFSET %s) t',
    table_name_param,
    where_clause,
    'id', -- Simple ordering by id
    limit_param,
    offset_param
  );

  -- Execute query
  EXECUTE query_text INTO result;

  -- Return result with metadata
  RETURN jsonb_build_object(
    'data', COALESCE(result, '[]'::jsonb),
    'total_count', total_count,
    'limit', limit_param,
    'offset', offset_param
  );

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error executing query: %', SQLERRM;
END;
$_$;


ALTER FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "count_only" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_dynamic_table"("p_table_id" "uuid", "p_columns" "text"[] DEFAULT NULL::"text"[], "p_where_conditions" "text" DEFAULT NULL::"text", "p_order_by" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_table_name text;
  v_columns_list text[];
  v_columns_str text;
  v_query text;
  v_count_query text;
  v_result jsonb;
  v_total_count integer;
  v_column_info jsonb;
  v_data jsonb;
BEGIN
  -- Buscar nome da tabela
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Tabela não encontrada para ID: %', p_table_id;
  END IF;

  -- Se colunas específicas foram fornecidas, usar elas
  IF p_columns IS NOT NULL AND array_length(p_columns, 1) > 0 THEN
    v_columns_list := p_columns;
  ELSE
    -- Buscar todas as colunas da tabela
    SELECT array_agg(column_name ORDER BY ordinal_position)
    INTO v_columns_list
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = v_table_name
      AND column_name NOT IN ('id', 'created_at', 'updated_at');
  END IF;

  -- Construir string de colunas
  v_columns_str := array_to_string(v_columns_list, ', ');

  -- Construir query de contagem
  v_count_query := 'SELECT COUNT(*) FROM ' || quote_ident(v_table_name);
  IF p_where_conditions IS NOT NULL AND p_where_conditions != '' THEN
    v_count_query := v_count_query || ' WHERE ' || p_where_conditions;
  END IF;

  -- Executar contagem
  EXECUTE v_count_query INTO v_total_count;

  -- Construir query principal
  v_query := 'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT ' || v_columns_str || ' FROM ' || quote_ident(v_table_name);
  
  IF p_where_conditions IS NOT NULL AND p_where_conditions != '' THEN
    v_query := v_query || ' WHERE ' || p_where_conditions;
  END IF;
  
  IF p_order_by IS NOT NULL AND p_order_by != '' THEN
    v_query := v_query || ' ORDER BY ' || p_order_by;
  END IF;
  
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset || ') t';

  -- Executar query principal
  EXECUTE v_query INTO v_data;

  -- Obter informações das colunas para metadados
  SELECT jsonb_object_agg(
    column_name,
    jsonb_build_object(
      'data_type', data_type,
      'is_nullable', is_nullable = 'YES',
      'ordinal_position', ordinal_position
    )
  ) INTO v_column_info
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = v_table_name
    AND column_name = ANY(v_columns_list);

  -- Construir resultado final
  v_result := jsonb_build_object(
    'data', COALESCE(v_data, '[]'::jsonb),
    'total_count', v_total_count,
    'columns', v_column_info,
    'query_info', jsonb_build_object(
      'table_name', v_table_name,
      'limit', p_limit,
      'offset', p_offset,
      'where_conditions', COALESCE(p_where_conditions, ''),
      'order_by', COALESCE(p_order_by, '')
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao executar query na tabela %: %', v_table_name, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."query_dynamic_table"("p_table_id" "uuid", "p_columns" "text"[], "p_where_conditions" "text", "p_order_by" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text" DEFAULT NULL::"text", "column_filters" "jsonb" DEFAULT NULL::"jsonb", "sort_column" "text" DEFAULT NULL::"text", "sort_direction" "text" DEFAULT 'asc'::"text", "limit_param" integer DEFAULT 50, "offset_param" integer DEFAULT 0) RETURNS TABLE("data" "jsonb", "total_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_query text;
  v_count_query text;
  v_columns_str text;
  v_where_clause text := '';
  where_clauses text[] := '{}';
  text_columns text[];
  numeric_columns text[];
  date_columns text[];
  boolean_columns text[];
  normalized_search_term text;
  filter_key text;
  filter_value text;
  normalized_filter_value text;
  v_total_count integer;
  column_data_type text;
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name_param
  ) THEN
    RAISE EXCEPTION 'Table % does not exist or is not accessible', table_name_param;
  END IF;

  -- Get all columns for this table
  SELECT array_agg(column_name ORDER BY ordinal_position)
  INTO v_columns_str
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param;

  -- Build columns string for SELECT
  v_columns_str := array_to_string(
    ARRAY(SELECT format('%I', col) FROM unnest(string_to_array(array_to_string(v_columns_str, ','), ',')) AS col), 
    ', '
  );

  -- Get text columns for search
  SELECT array_agg(column_name)
  INTO text_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('text', 'character varying', 'character');

  -- Get numeric columns for search
  SELECT array_agg(column_name)
  INTO numeric_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision');

  -- Get date columns for search
  SELECT array_agg(column_name)
  INTO date_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone');

  -- Get boolean columns for search
  SELECT array_agg(column_name)
  INTO boolean_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type = 'boolean';

  -- Handle search term with normalization
  IF search_term IS NOT NULL AND trim(search_term) != '' THEN
    -- Normalize search term
    normalized_search_term := normalize_text(search_term);
    
    -- Search in text columns using normalized comparison
    IF text_columns IS NOT NULL AND array_length(text_columns, 1) > 0 THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(text_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in numeric columns (if search term is numeric)
    IF numeric_columns IS NOT NULL AND array_length(numeric_columns, 1) > 0 AND search_term ~ '^[0-9]+\.?[0-9]*$' THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I::text) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(numeric_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in date columns (if search term looks like a date)
    IF date_columns IS NOT NULL AND array_length(date_columns, 1) > 0 AND (
      search_term ~ '^\d{4}-\d{2}-\d{2}' OR 
      search_term ~ '^\d{2}/\d{2}/\d{4}' OR
      search_term ~ '^\d{1,2}/\d{1,2}/\d{2,4}'
    ) THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I::text) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(date_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in boolean columns (if search term is 'true' or 'false')
    IF boolean_columns IS NOT NULL AND array_length(boolean_columns, 1) > 0 AND lower(trim(search_term)) IN ('true', 'false') THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('%I = %s', c, lower(trim(search_term)))
            FROM unnest(boolean_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;
  END IF;

  -- Handle column filters with proper type handling
  IF column_filters IS NOT NULL THEN
    FOR filter_key, filter_value IN
      SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF filter_value IS NOT NULL AND trim(filter_value) != '' THEN
        -- Get the data type of the filter column
        SELECT data_type INTO column_data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = table_name_param 
          AND column_name = filter_key;
        
        -- Handle boolean columns differently
        IF column_data_type = 'boolean' AND lower(trim(filter_value)) IN ('true', 'false') THEN
          where_clauses := array_append(
            where_clauses,
            format('%I = %s', filter_key, lower(trim(filter_value)))
          );
        ELSE
          -- For non-boolean columns, use normalize_text
          normalized_filter_value := normalize_text(filter_value);
          where_clauses := array_append(
            where_clauses,
            format('normalize_text(%I::text) ILIKE %L', filter_key, '%' || normalized_filter_value || '%')
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Build WHERE clause
  IF array_length(where_clauses, 1) > 0 THEN
    v_where_clause := ' WHERE (' || array_to_string(where_clauses, ') AND (') || ')';
  END IF;

  -- Build count query
  v_count_query := format('SELECT COUNT(*) FROM %I%s', table_name_param, v_where_clause);

  -- Execute count query
  EXECUTE v_count_query INTO v_total_count;

  -- Build main query with sorting and pagination
  v_query := format(
    'SELECT row_to_json(t) FROM (SELECT %s FROM %I%s',
    v_columns_str,
    table_name_param,
    v_where_clause
  );

  -- Add sorting
  IF sort_column IS NOT NULL THEN
    v_query := v_query || format(
      ' ORDER BY %I %s',
      sort_column,
      CASE WHEN lower(sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END
    );
  END IF;

  -- Add pagination
  v_query := v_query || format(' LIMIT %s OFFSET %s', limit_param, offset_param);
  v_query := v_query || ') t';

  -- Return results
  RETURN QUERY EXECUTE format('
    SELECT 
      COALESCE(jsonb_agg(row_data), ''[]''::jsonb) as data,
      %s as total_count
    FROM (%s) as subquery(row_data)',
    v_total_count,
    v_query
  );
END;
$_$;


ALTER FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "sort_column" "text", "sort_direction" "text", "limit_param" integer, "offset_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text" DEFAULT ''::"text", "column_filters" "jsonb" DEFAULT '{}'::"jsonb", "limit_param" integer DEFAULT 50, "offset_param" integer DEFAULT 0, "sort_by" "text" DEFAULT NULL::"text", "sort_dir" "text" DEFAULT 'asc'::"text", "count_only" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  sql_where text := '';
  sql_order text := '';
  total_count bigint := 0;
  result_rows jsonb := '[]'::jsonb;
  allowed_columns text[];
  text_columns text[];
  filter_key text;
  filter_val text;
  where_clauses text[] := ARRAY[]::text[];
  is_desc boolean := lower(sort_dir) = 'desc';
  escaped_search_term text;
  escaped_filter_val text;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', 0);
  END IF;

  -- Whitelist columns from information_schema
  SELECT array_agg(column_name::text) INTO allowed_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param;

  IF allowed_columns IS NULL THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', 0);
  END IF;

  -- Identify text-like columns for full-text-ish search
  SELECT array_agg(column_name::text) INTO text_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param
    AND data_type IN ('text', 'character varying', 'character', 'uuid');

  -- Global search across text columns with proper escaping
  IF search_term IS NOT NULL AND btrim(search_term) <> '' AND text_columns IS NOT NULL THEN
    -- Escape special LIKE characters: %, _, \ and also handle parentheses and other special chars
    escaped_search_term := replace(replace(replace(replace(search_term, '\', '\\'), '%', '\%'), '_', '\_'), '''', '''''');
    
    where_clauses := where_clauses || '(' ||
      array_to_string(ARRAY(
        SELECT format('%I ILIKE %L ESCAPE %L', c, '%' || escaped_search_term || '%', '\') FROM unnest(text_columns) AS c
      ), ' OR ')
    || ')';
  END IF;

  -- Column filters (substring match, case-insensitive) with proper escaping
  IF column_filters IS NOT NULL THEN
    FOR filter_key, filter_val IN
      SELECT key, value::text FROM jsonb_each_text(column_filters)
    LOOP
      IF filter_key = ANY(allowed_columns) AND filter_val IS NOT NULL AND btrim(filter_val) <> '' THEN
        -- Escape special LIKE characters for column filters too
        escaped_filter_val := replace(replace(replace(replace(filter_val, '\', '\\'), '%', '\%'), '_', '\_'), '''', '''''');
        where_clauses := where_clauses || format('%I ILIKE %L ESCAPE %L', filter_key, '%' || escaped_filter_val || '%', '\');
      END IF;
    END LOOP;
  END IF;

  IF array_length(where_clauses,1) IS NOT NULL THEN
    sql_where := ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;

  -- Order by whitelisted column if provided
  IF sort_by IS NOT NULL AND sort_by = ANY(allowed_columns) THEN
    sql_order := format(' ORDER BY %I %s', sort_by, CASE WHEN is_desc THEN 'DESC' ELSE 'ASC' END);
  ELSE
    sql_order := '';
  END IF;

  -- Total count with same filters
  EXECUTE format('SELECT COUNT(*) FROM %I%s', table_name_param, sql_where) INTO total_count;

  IF count_only THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', total_count);
  END IF;

  -- Fetch rows as JSONB array
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb)
     FROM (SELECT * FROM %I%s%s LIMIT %s OFFSET %s) t',
    table_name_param,
    sql_where,
    sql_order,
    GREATEST(limit_param,0),
    GREATEST(offset_param,0)
  ) INTO result_rows;

  RETURN json_build_object('data', result_rows, 'total_count', total_count);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty result instead of failing
    RAISE LOG 'Error in query_dynamic_table: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', 0, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "sort_by" "text", "sort_dir" "text", "count_only" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rebuild_economic_groups_from_unified"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result json;
  v_groups_created integer := 0;
  v_groups_updated integer := 0;
  v_accounts_processed integer := 0;
  v_group_id integer;
  v_existing_group_id integer;
  v_rec record;
  v_default_table_id uuid;
BEGIN
  -- Get a default SA1010 table_id (first available)
  SELECT protheus_table_id INTO v_default_table_id
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%'
  LIMIT 1;

  -- If no SA1010 table found, generate a UUID as fallback
  IF v_default_table_id IS NULL THEN
    v_default_table_id := gen_random_uuid();
  END IF;

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
      -- Criar novo grupo com protheus_table_id
      INSERT INTO public.protheus_customer_groups (
        protheus_table_id,
        filial,
        cod,
        name_source
      ) VALUES (
        v_default_table_id,
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
$$;


ALTER FUNCTION "public"."rebuild_economic_groups_from_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_lead_from_group"("p_id_grupo" integer, "p_lead_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_remaining_members integer;
  v_remaining_leads integer;
BEGIN
  -- Remove lead from group
  UPDATE public.sales_leads
  SET economic_group_id = NULL
  WHERE id = p_lead_id AND economic_group_id = p_id_grupo;

  -- Check if group is now empty
  SELECT COUNT(*) INTO v_remaining_members
  FROM public.protheus_customer_group_units
  WHERE group_id = p_id_grupo;
  
  SELECT COUNT(*) INTO v_remaining_leads
  FROM public.sales_leads
  WHERE economic_group_id = p_id_grupo;

  -- Delete group if empty
  IF v_remaining_members = 0 AND v_remaining_leads = 0 THEN
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
$$;


ALTER FUNCTION "public"."remove_lead_from_group"("p_id_grupo" integer, "p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_member_from_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."remove_member_from_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_unified_from_group"("p_id_grupo" integer, "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_remaining_members integer;
begin
  update public.unified_accounts
  set economic_group_id = null
  where id = p_unified_id
    and economic_group_id = p_id_grupo;

  select count(*) into v_remaining_members
  from public.unified_accounts
  where economic_group_id = p_id_grupo;

  if v_remaining_members = 0 then
    delete from public.protheus_customer_groups
    where id_grupo = p_id_grupo;

    return json_build_object(
      'success', true,
      'group_deleted', true
    );
  end if;

  return json_build_object(
    'success', true,
    'group_deleted', false
  );
end;
$$;


ALTER FUNCTION "public"."remove_unified_from_group"("p_id_grupo" integer, "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_unified_supplier_from_group"("p_group_id" "uuid", "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_remaining integer;
begin
  update public.purchases_unified_suppliers
  set economic_group_id = null
  where id = p_unified_id
    and economic_group_id = p_group_id;

  select count(*) into v_remaining
  from public.purchases_unified_suppliers
  where economic_group_id = p_group_id;

  if v_remaining = 0 then
    delete from public.protheus_supplier_groups
    where id = p_group_id;

    return json_build_object(
      'success', true,
      'group_deleted', true
    );
  end if;

  return json_build_object(
    'success', true,
    'group_deleted', false
  );
end;
$$;


ALTER FUNCTION "public"."remove_unified_supplier_from_group"("p_group_id" "uuid", "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_unified_supplier_from_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_remaining integer;
BEGIN
  DELETE FROM public.purchases_economic_group_members
  WHERE group_id = p_id_grupo AND unified_supplier_id = p_unified_id;

  SELECT COUNT(*) INTO v_remaining
  FROM public.purchases_economic_group_members
  WHERE group_id = p_id_grupo;

  IF v_remaining = 0 THEN
    DELETE FROM public.purchases_economic_groups
    WHERE id_grupo = p_id_grupo;

    RETURN json_build_object('success', true, 'group_deleted', true);
  END IF;

  RETURN json_build_object('success', true, 'group_deleted', false);
END;
$$;


ALTER FUNCTION "public"."remove_unified_supplier_from_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_purchases_economic_groups"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Somente admins ou diretores podem resetar
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'Apenas admins/diretores podem resetar grupos';
  END IF;

  DELETE FROM public.purchases_economic_group_members;
  DELETE FROM public.purchases_economic_groups;
END;
$$;


ALTER FUNCTION "public"."reset_purchases_economic_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_form_token"("token_text" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  token_hash TEXT;
  form_id_result UUID;
BEGIN
  -- Criar hash do token
  token_hash := public.hash_form_token(token_text);
  
  -- Buscar token válido e ativo
  SELECT form_id INTO form_id_result
  FROM public.form_publication_tokens
  WHERE token_hash = public.hash_form_token(token_text)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_access_count IS NULL OR access_count < max_access_count);
  
  -- Se encontrou o token, incrementar contador de acesso
  IF form_id_result IS NOT NULL THEN
    UPDATE public.form_publication_tokens
    SET access_count = access_count + 1
    WHERE token_hash = public.hash_form_token(token_text);
  END IF;
  
  RETURN form_id_result;
END;
$$;


ALTER FUNCTION "public"."resolve_form_token"("token_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_auto_share_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Se status mudou para approved, rejected ou needs_correction e existe compartilhamento automático
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'needs_correction') 
     AND NEW.auto_shared_record_id IS NOT NULL THEN
    
    -- Revogar o compartilhamento automático
    UPDATE public.record_shares 
    SET status = 'revoked',
        updated_at = NOW()
    WHERE id = NEW.auto_shared_record_id;
    
    -- Criar notificação informando que acesso foi revogado
    INSERT INTO public.app_notifications (user_id, type, title, message, data)
    VALUES (
      NEW.approver_id,
      'share_revoked',
      'Acesso ao registro revogado',
      'Seu acesso temporário ao registro foi revogado após a aprovação.',
      jsonb_build_object(
        'approval_id', NEW.id,
        'record_reference', NEW.record_reference,
        'approval_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."revoke_auto_share_on_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_leads_validate_source"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se for indicação, exigir nome de quem indicou
  IF NEW.source_channel = 'referral'::public.lead_source_channel THEN
    IF NEW.referral_name IS NULL OR btrim(NEW.referral_name) = '' THEN
      RAISE EXCEPTION 'referral_name is required when source_channel = referral';
    END IF;
  END IF;

  -- Se for "outro", exigir a especificação no subchannel
  IF NEW.source_channel = 'other'::public.lead_source_channel THEN
    IF NEW.source_subchannel IS NULL OR btrim(NEW.source_subchannel) = '' THEN
      RAISE EXCEPTION 'source_subchannel is required when source_channel = other';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_leads_validate_source"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_customers_for_groups"("p_table_id" "uuid", "p_search_term" "text") RETURNS TABLE("filial" "text", "cod" "text", "loja" "text", "nome" "text", "nome_reduzido" "text", "vendor_name" "text", "current_group_id" integer, "current_group_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
  v_escaped_search TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  SELECT supabase_table_name INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Verifica se existe a tabela de vendedores padrão
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  -- Escapa o termo de busca
  v_escaped_search := replace(replace(replace(p_search_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sa1.a1_filial::text as filial,
      sa1.a1_cod::text as cod,
      sa1.a1_loja::text as loja,
      sa1.a1_nome::text as nome,
      sa1.a1_nreduz::text as nome_reduzido,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sa1.a1_vend::text 
      END as vendor_name,
      pgu.group_id as current_group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name
    FROM %I sa1
    %s
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
    LIMIT 100
  $q$, 
     v_has_vendor_table,
     v_table,
     CASE WHEN v_has_vendor_table 
          THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sa1.a1_vend::text'
          ELSE ''
     END,
     p_table_id,
     '%' || v_escaped_search || '%',
     '%' || v_escaped_search || '%',
     '%' || v_escaped_search || '%'
  );
END;
$_$;


ALTER FUNCTION "public"."search_customers_for_groups"("p_table_id" "uuid", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "include_archived" boolean DEFAULT false, "include_hidden" boolean DEFAULT false, "max_results" integer DEFAULT 20) RETURNS TABLE("document_id" "uuid", "filename" "text", "folder_id" "uuid", "chunk_index" integer, "content" "text", "section" "text", "distance" real)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.document_id,
    d.name as filename,
    d.folder_id,
    dc.chunk_index,
    dc.content,
    dc.section,
    (dc.embedding <=> query_embedding)::real as distance
  FROM public.doc_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE 
    (include_archived OR d.status != 'archived')
    AND (include_hidden OR d.status != 'hidden')
    AND d.status != 'error'
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;


ALTER FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "include_archived" boolean, "include_hidden" boolean, "max_results" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "department_id" "uuid" DEFAULT NULL::"uuid", "folder_statuses" "text"[] DEFAULT ARRAY['active'::"text"], "result_limit" integer DEFAULT 12) RETURNS TABLE("document_id" "uuid", "filename" "text", "folder_id" "uuid", "chunk_index" integer, "content" "text", "section" "text", "distance" double precision)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.name as filename,
    d.folder_id,
    dc.chunk_index,
    dc.content,
    dc.section,
    (dc.embedding <=> query_embedding) as distance
  FROM doc_chunks dc
  JOIN documents d ON d.id = dc.document_id
  LEFT JOIN folders f ON f.id = d.folder_id
  WHERE dc.acl_hash = search_documents.acl_hash
    AND d.status = 'active'
    AND (search_documents.department_id IS NULL OR d.department_id = search_documents.department_id)
    AND (f.id IS NULL OR f.status::text = ANY(folder_statuses))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;


ALTER FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_documents_by_type"("query_embedding" "public"."vector", "p_embedding_type" "text", "acl_hash" "text", "department_id" "uuid" DEFAULT NULL::"uuid", "folder_statuses" "text"[] DEFAULT ARRAY['active'::"text"], "result_limit" integer DEFAULT 32) RETURNS TABLE("document_id" "uuid", "filename" "text", "folder_id" "uuid", "chunk_index" integer, "content" "text", "section" "text", "distance" double precision, "embedding_type" "text", "extraction_source" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.document_id,
    d.name as filename,
    d.folder_id,
    dc.chunk_index,
    dc.content,
    dc.section,
    (dc.embedding <=> query_embedding) as distance,
    dc.embedding_type,
    dc.extraction_source
  FROM doc_chunks dc
  JOIN documents d ON d.id = dc.document_id
  JOIN folders f ON f.id = d.folder_id
  WHERE 
    dc.embedding_type = p_embedding_type
    AND d.status IN ('active', 'Aprovado')  -- Allow both 'active' and 'Aprovado' status
    AND f.status::text = ANY(folder_statuses)  -- Explicit cast to text
    AND (search_documents_by_type.department_id IS NULL OR d.department_id = search_documents_by_type.department_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;


ALTER FUNCTION "public"."search_documents_by_type"("query_embedding" "public"."vector", "p_embedding_type" "text", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_leads_for_groups"("p_search_term" "text") RETURNS TABLE("lead_id" "uuid", "trade_name" "text", "legal_name" "text", "cnpj" "text", "assigned_vendor_cod" "text", "vendor_name" "text", "current_group_id" integer, "current_group_name" "text", "city_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_escaped_search TEXT;
  v_has_vendor_table BOOLEAN := false;
BEGIN
  -- Check if vendor table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  -- Escape search term
  v_escaped_search := replace(replace(replace(p_search_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY EXECUTE format($q$
    SELECT 
      sl.id as lead_id,
      sl.trade_name::text,
      sl.legal_name::text,
      sl.cnpj::text,
      sl.assigned_vendor_cod::text,
      CASE 
        WHEN %L AND sa3.a3_nome IS NOT NULL THEN sa3.a3_nome::text 
        ELSE sl.assigned_vendor_cod::text 
      END as vendor_name,
      sl.economic_group_id as current_group_id,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      c.name::text as city_name
    FROM public.sales_leads sl
    LEFT JOIN public.site_cities c ON c.id = sl.city_id
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = sl.economic_group_id
    %s
    WHERE (
      sl.trade_name::text ILIKE %L ESCAPE '\' OR
      sl.legal_name::text ILIKE %L ESCAPE '\' OR
      sl.cnpj::text ILIKE %L ESCAPE '\'
    )
    ORDER BY sl.trade_name
    LIMIT 50
  $q$, 
       v_has_vendor_table,
       CASE WHEN v_has_vendor_table 
            THEN 'LEFT JOIN protheus_sa3010_fc3d70f6 sa3 ON sa3.a3_cod::text = sl.assigned_vendor_cod::text'
            ELSE ''
       END,
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%',
       '%' || v_escaped_search || '%');
END;
$_$;


ALTER FUNCTION "public"."search_leads_for_groups"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_purchases_economic_groups"("p_search" "text") RETURNS TABLE("id_grupo" integer, "code" "text", "name" "text", "member_count" integer, "assigned_buyer_cod" "text", "assigned_buyer_filial" "text", "protheus_filial" "text", "protheus_cod" "text", "member_buyer_names" "text"[], "group_assigned_buyer_name" "text", "material_type_names" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
  v_term text := normalize_text(coalesce(p_search,''));
  v_like text := '%' || v_term || '%';
  v_digits text := regexp_replace(coalesce(p_search,''), '[^0-9]', '', 'g');
  v_uf text := upper(btrim(coalesce(p_search,'')));
BEGIN
  -- Se não houver termo, retorna a listagem completa existente
  IF coalesce(btrim(p_search),'') = '' THEN
    RETURN QUERY SELECT * FROM public.get_purchases_economic_groups();
    RETURN;
  END IF;

  -- União dinâmica de SA2010 para dados dos fornecedores (nomes, CNPJ, cidade/UF)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
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
                      null::text as a2_nreduz,
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    group_data AS (
      SELECT 
        peg.id_grupo,
        peg.code,
        COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) AS name,
        peg.assigned_buyer_cod,
        peg.assigned_buyer_filial,
        peg.protheus_filial,
        peg.protheus_cod
      FROM public.purchases_economic_groups peg
    ),
    member_counts AS (
      SELECT 
        pegm.group_id,
        COUNT(*)::integer AS member_count
      FROM public.purchases_economic_group_members pegm
      GROUP BY pegm.group_id
    ),
    member_buyers AS (
      SELECT 
        pegm.group_id,
        array_agg(DISTINCT y1.y1_nome ORDER BY y1.y1_nome)
          FILTER (WHERE y1.y1_nome IS NOT NULL AND btrim(y1.y1_nome) <> '') AS buyer_names
      FROM public.purchases_economic_group_members pegm
      JOIN public.purchases_unified_suppliers pus ON pus.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers pps ON pps.id = pus.potential_supplier_id
      LEFT JOIN public.protheus_sy1010_3249e97a y1 ON (
        btrim(y1.y1_cod) = COALESCE(
          nullif(btrim(pus.assigned_buyer_cod), ''),
          nullif(btrim(pps.assigned_buyer_cod), '')
        )
        AND btrim(y1.y1_filial) = COALESCE(
          nullif(btrim(pus.assigned_buyer_filial), ''),
          nullif(btrim(pps.assigned_buyer_filial), ''),
          '01'
        )
      )
      GROUP BY pegm.group_id
    ),
    group_buyers AS (
      SELECT 
        gd.id_grupo,
        y1g.y1_nome AS group_buyer_name
      FROM group_data gd
      LEFT JOIN public.protheus_sy1010_3249e97a y1g ON (
        btrim(y1g.y1_cod) = nullif(btrim(gd.assigned_buyer_cod), '')
        AND btrim(y1g.y1_filial) = COALESCE(nullif(btrim(gd.assigned_buyer_filial), ''), '01')
      )
    ),
    group_material_types AS (
      SELECT 
        egmt.group_id,
        array_agg(DISTINCT mt.name ORDER BY mt.name) AS material_type_names
      FROM public.purchases_economic_group_material_types egmt
      JOIN public.purchases_material_types mt ON mt.id = egmt.material_type_id
      GROUP BY egmt.group_id
    ),
    members_info AS (
      SELECT 
        gm.group_id,
        -- Nome para filtrar: fantasia, comercial (nreduz), razão (nome)
        coalesce(pps.trade_name, sa2.a2_nreduz, sa2.a2_nome, pps.legal_name) as any_name,
        -- CNPJ normalizado
        regexp_replace(coalesce(pus.cnpj, sa2.a2_cgc, pps.cnpj), '[^0-9]', '', 'g') as cnpj_digits,
        pus.protheus_cod,
        pus.protheus_filial,
        -- Cidade/UF
        coalesce(sc_ps.name, sc_sa2.name) as city_name,
        coalesce(sc_ps.uf,   sc_sa2.uf)   as city_uf,
        -- Compradores
        coalesce(nullif(btrim(pus.assigned_buyer_cod), ''), nullif(btrim(pps.assigned_buyer_cod), '')) as buyer_cod,
        btrim(y1.y1_nome) as buyer_name
      FROM public.purchases_economic_group_members gm
      JOIN public.purchases_unified_suppliers pus ON pus.id = gm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers pps ON pps.id = pus.potential_supplier_id
      LEFT JOIN sa2_all sa2
        ON sa2.a2_filial = pus.protheus_filial::text
       AND sa2.a2_cod    = pus.protheus_cod::text
       AND sa2.a2_loja   = pus.protheus_loja::text
      LEFT JOIN public.site_cities sc_ps ON sc_ps.id = pps.city_id
      LEFT JOIN public.site_cities sc_sa2 
        ON sc_sa2.cod_munic = regexp_replace(coalesce(sa2.a2_cod_mun,''), '[^0-9]', '', 'g')
       AND sc_sa2.uf        = upper(btrim(coalesce(sa2.a2_est, '')))
      LEFT JOIN public.protheus_sy1010_3249e97a y1 
        ON btrim(y1.y1_cod) = coalesce(nullif(btrim(pus.assigned_buyer_cod), ''), nullif(btrim(pps.assigned_buyer_cod), ''))
       AND btrim(y1.y1_filial) = coalesce(nullif(btrim(pus.assigned_buyer_filial), ''), nullif(btrim(pps.assigned_buyer_filial), ''), '01')
    ),
    matches AS (
      SELECT DISTINCT gd.id_grupo
      FROM group_data gd
      LEFT JOIN group_buyers gb ON gb.id_grupo = gd.id_grupo
      LEFT JOIN members_info mi ON mi.group_id = gd.id_grupo
      WHERE 
        -- Grupo: nome/código/Protheus
        normalize_text(gd.name) LIKE %L
        OR gd.code ILIKE %L
        OR gd.protheus_cod ILIKE %L
        OR gd.protheus_filial ILIKE %L
        -- Membros: nomes (fantasia/comercial/razão)
        OR normalize_text(mi.any_name) LIKE %L
        -- Membros: CNPJ (se termo contiver dígitos)
        OR (%L <> '' AND mi.cnpj_digits = %L)
        -- Membros: Protheus (código/filial)
        OR mi.protheus_cod ILIKE %L
        OR mi.protheus_filial ILIKE %L
        -- Compradores (grupo e membros: nome e código)
        OR mi.buyer_name ILIKE %L
        OR mi.buyer_cod ILIKE %L
        OR gb.group_buyer_name ILIKE %L
        -- Cidade e UF
        OR normalize_text(mi.city_name) LIKE %L
        OR mi.city_uf ILIKE %L
        OR mi.city_uf = %L
    )
    SELECT 
      gd.id_grupo,
      gd.code,
      gd.name,
      COALESCE(mc.member_count, 0) AS member_count,
      gd.assigned_buyer_cod,
      gd.assigned_buyer_filial,
      gd.protheus_filial,
      gd.protheus_cod,
      COALESCE(mb.buyer_names, ARRAY[]::text[]) AS member_buyer_names,
      gb.group_buyer_name AS group_assigned_buyer_name,
      COALESCE(gmt.material_type_names, ARRAY[]::text[]) AS material_type_names
    FROM group_data gd
    LEFT JOIN member_counts mc ON mc.group_id = gd.id_grupo
    LEFT JOIN member_buyers mb ON mb.group_id = gd.id_grupo
    LEFT JOIN group_buyers gb ON gb.id_grupo = gd.id_grupo
    LEFT JOIN group_material_types gmt ON gmt.group_id = gd.id_grupo
    WHERE gd.id_grupo IN (SELECT id_grupo FROM matches)
    ORDER BY gd.id_grupo
  $q$,
    v_union_sa2,
    -- Literais substituídos na ordem dos %L acima:
    v_like,  -- nome do grupo normalizado
    v_like,  -- code
    v_like,  -- protheus_cod
    v_like,  -- protheus_filial
    v_like,  -- nome de membro normalizado
    v_digits, v_digits, -- check de CNPJ (não-vazio e igualdade)
    v_like,  -- membro protheus_cod
    v_like,  -- membro protheus_filial
    v_like,  -- buyer_name
    v_like,  -- buyer_cod
    v_like,  -- group_buyer_name
    v_like,  -- city_name normalizado
    v_like,  -- city_uf like
    v_uf     -- city_uf igual (para UF curta)
  );
END;
$_$;


ALTER FUNCTION "public"."search_purchases_economic_groups"("p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_purchases_unified_suppliers"("p_search_term" "text") RETURNS TABLE("unified_id" "uuid", "display_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "current_group_id" integer, "current_group_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_union_sa2 text;
  v_term   text;
  v_digits text;
BEGIN
  v_term   := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc
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
                      null::text as a2_nreduz,
                      null::text as a2_cgc
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT
      us.id AS unified_id,
      COALESCE(
        sa2.a2_nreduz,
        sa2.a2_nome,
        ps.trade_name,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
      ) AS display_name,
      us.status::text AS unified_status,
      us.protheus_filial::text,
      us.protheus_cod::text,
      us.protheus_loja::text,
      m.group_id AS current_group_id,
      CASE 
        WHEN m.group_id IS NOT NULL 
        THEN COALESCE(g.name, g.ai_suggested_name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0'))
        ELSE NULL
      END AS current_group_name
    FROM public.purchases_unified_suppliers us
    LEFT JOIN public.purchases_potential_suppliers ps
      ON ps.id = us.potential_supplier_id
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = us.protheus_filial::text
     AND sa2.a2_cod    = us.protheus_cod::text
     AND sa2.a2_loja   = us.protheus_loja::text
    LEFT JOIN public.purchases_economic_group_members m
      ON m.unified_supplier_id = us.id
    LEFT JOIN public.purchases_economic_groups g
      ON g.id_grupo = m.group_id
    WHERE
         COALESCE(sa2.a2_nome,'')    ILIKE %L ESCAPE '\'
      OR COALESCE(sa2.a2_nreduz,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(ps.trade_name,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(ps.legal_name,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(us.protheus_cod,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(us.protheus_loja,'') ILIKE %L ESCAPE '\'
      OR (
        length(%L) > 0 AND (
             regexp_replace(COALESCE(sa2.a2_cgc,''), '[^0-9]', '', 'g') ILIKE %L ESCAPE '\'
          OR regexp_replace(COALESCE(ps.cnpj,''),    '[^0-9]', '', 'g') ILIKE %L ESCAPE '\'
        )
      )
    ORDER BY display_name
    LIMIT 50
  $q$,
    v_union_sa2,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    v_digits,
    '%' || v_digits || '%',
    '%' || v_digits || '%'
  );
END;
$_$;


ALTER FUNCTION "public"."search_purchases_unified_suppliers"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_unified_accounts_for_groups"("p_search_term" "text", "p_table_id" "uuid") RETURNS TABLE("unified_id" "uuid", "display_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "current_group_id" integer, "current_group_name" "text", "vendor_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_table text;
  v_has_vendor_table boolean := false;
  v_term text;
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  -- Escapar curinga/escape
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');

  return query execute format($q$
    select
      ua.id as unified_id,
      coalesce(sa1.a1_nome::text, sl.trade_name::text, sl.legal_name::text, 'Sem nome') as display_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja,
      ua.economic_group_id as current_group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name
    from public.unified_accounts ua
    left join public.protheus_customer_groups pcg on pcg.id_grupo = ua.economic_group_id
    left join %I sa1 on (
      ua.protheus_filial::text = sa1.a1_filial::text and
      ua.protheus_cod::text    = sa1.a1_cod::text and
      ua.protheus_loja::text   = sa1.a1_loja::text
    )
    left join public.sales_leads sl on sl.id = ua.lead_id
    %s
    where 
      (
        sa1.a1_nome::text ilike %L escape '\' or
        sa1.a1_nreduz::text ilike %L escape '\' or
        sl.trade_name::text ilike %L escape '\' or
        sl.legal_name::text ilike %L escape '\' or
        coalesce(ua.protheus_cod::text,'') ilike %L escape '\' or
        coalesce(ua.protheus_loja::text,'') ilike %L escape '\'
      )
    order by display_name
    limit 50
  $q$,
    v_has_vendor_table,
    v_table,
    case when v_has_vendor_table 
      then 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      else ''
    end,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%'
  );
end;
$_$;


ALTER FUNCTION "public"."search_unified_accounts_for_groups"("p_search_term" "text", "p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_unified_accounts_for_groups_simple"("p_search_term" "text") RETURNS TABLE("unified_id" "uuid", "display_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "current_group_id" integer, "current_group_name" "text", "vendor_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_term text;
  v_digits text;
  v_has_vendor_table boolean := false;
  v_union_sa1 text;
  v_vendor_join text := '';
  v_cnpj_clause text := '';
BEGIN
  -- Escapar curinga/escape para ILIKE
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  -- Normalizar dígitos para busca por CNPJ
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  -- Verifica se a tabela de vendedores existe (para exibir nome do vendedor quando possível)
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'protheus_sa3010_fc3d70f6'
  ) INTO v_has_vendor_table;

  IF v_has_vendor_table THEN
    v_vendor_join := 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)';
  END IF;

  -- Monta união dinâmica de todas as SA1010 (clientes)
  SELECT string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         a1_nome::text   as a1_nome, 
         a1_nreduz::text as a1_nreduz,
         a1_cgc::text    as a1_cgc,
         a1_vend::text   as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usa uma união vazia
  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
                      null::text as a1_cgc,
                      null::text as a1_vend
                    where false';
  END IF;

  -- Se houver dígitos no termo (possível CNPJ), adiciona cláusula específica normalizando ambos os lados
  IF length(v_digits) > 0 THEN
    v_cnpj_clause := format(
      ' OR (
          regexp_replace(coalesce(sl.cnpj::text, ''''), ''[^0-9]'', '''', ''g'') ILIKE %L ESCAPE ''\'' OR
          regexp_replace(coalesce(sa1.a1_cgc::text, ''''), ''[^0-9]'', '''', ''g'') ILIKE %L ESCAPE ''\''
        )',
      '%' || v_digits || '%',
      '%' || v_digits || '%'
    );
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa1 AS (
      %s
    )
    SELECT
      ua.id as unified_id,
      coalesce(
        sa1.a1_nreduz, 
        sa1.a1_nome, 
        sl.trade_name, 
        sl.legal_name, 
        'Cliente ' || ua.protheus_cod
      ) as display_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja,
      ua.economic_group_id as current_group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name
    FROM public.unified_accounts ua
    LEFT JOIN public.protheus_customer_groups pcg ON pcg.id_grupo = ua.economic_group_id
    LEFT JOIN public.sales_leads sl ON sl.id = ua.lead_id
    LEFT JOIN sa1 ON (
      ua.protheus_filial::text = sa1.a1_filial AND
      ua.protheus_cod::text    = sa1.a1_cod AND
      ua.protheus_loja::text   = sa1.a1_loja
    )
    %s
    WHERE
      (
        sa1.a1_nome    ILIKE %L ESCAPE '\' OR
        sa1.a1_nreduz  ILIKE %L ESCAPE '\' OR
        sl.trade_name  ILIKE %L ESCAPE '\' OR
        sl.legal_name  ILIKE %L ESCAPE '\' OR
        coalesce(ua.protheus_cod,'') ILIKE %L ESCAPE '\' OR
        coalesce(ua.protheus_loja,'') ILIKE %L ESCAPE '\'
        %s
      )
    ORDER BY display_name
    LIMIT 50
  $q$,
    v_union_sa1,
    v_has_vendor_table,
    v_vendor_join,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    v_cnpj_clause
  );

END;
$_$;


ALTER FUNCTION "public"."search_unified_accounts_for_groups_simple"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") RETURNS TABLE("unified_id" "uuid", "display_name" "text", "unified_status" "text", "protheus_filial" "text", "protheus_cod" "text", "protheus_loja" "text", "current_group_id" "uuid", "current_group_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_term text;
  v_digits text;
  v_union_sa2010 text;
begin
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  select string_agg(
    format(
      'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja, a2_nome::text as a2_nome, a2_nreduz::text as a2_nreduz, a2_cgc::text as a2_cgc from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select null::text as a2_filial, null::text as a2_cod, null::text as a2_loja, null::text as a2_nome, null::text as a2_nreduz, null::text as a2_cgc where false';
  end if;

  return query execute format($q$
    with sa as (%s)
    select
      u.id as unified_id,
      coalesce(p.trade_name::text, p.legal_name::text, sa.a2_nreduz::text, sa.a2_nome::text, 'Fornecedor '||coalesce(u.protheus_cod::text,'')) as display_name,
      u.status::text as unified_status,
      u.protheus_filial,
      u.protheus_cod,
      u.protheus_loja,
      u.economic_group_id as current_group_id,
      coalesce(psg.name, psg.ai_suggested_name) as current_group_name
    from public.purchases_unified_suppliers u
    left join public.protheus_supplier_groups psg on psg.id = u.economic_group_id
    left join public.purchases_potential_suppliers p on p.id = u.potential_supplier_id
    left join sa on (
      u.protheus_filial = sa.a2_filial
      and u.protheus_cod = sa.a2_cod
      and u.protheus_loja = sa.a2_loja
    )
    where
      (
        coalesce(p.trade_name,'') ilike %L escape '\'
        or coalesce(p.legal_name,'') ilike %L escape '\'
        or coalesce(sa.a2_nome,'') ilike %L escape '\'
        or coalesce(sa.a2_nreduz,'') ilike %L escape '\'
        or coalesce(u.protheus_cod,'') ilike %L escape '\'
        or coalesce(u.protheus_loja,'') ilike %L escape '\'
        or (length(%L) > 0 and (
          regexp_replace(coalesce(p.cnpj,''), '[^0-9]', '', 'g') ilike %L escape '\'
          or regexp_replace(coalesce(u.cnpj,''), '[^0-9]', '', 'g') ilike %L escape '\'
          or regexp_replace(coalesce(sa.a2_cgc,''), '[^0-9]', '', 'g') ilike %L escape '\'
        ))
      )
    order by 2
    limit 50
  $q$,
    v_union_sa2010,
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    v_digits,
    '%'||v_digits||'%',
    '%'||v_digits||'%',
    '%'||v_digits||'%'
  );
end;
$_$;


ALTER FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_created_by_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_created_by_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_document_acl_hash"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.acl_hash := public.compute_acl_hash(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_document_acl_hash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_purchases_group_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := 'GEC-' || lpad(NEW.id_grupo::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_purchases_group_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_purchases_group_code_after"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.purchases_economic_groups
  SET code = COALESCE(NEW.code, 'GEC-' || lpad(NEW.id_grupo::text, 6, '0'))
  WHERE id_grupo = NEW.id_grupo;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_purchases_group_code_after"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_purchases_group_material_types"("p_group_id" integer, "p_material_type_ids" "text"[]) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_inserted_count integer := 0;
  v_deleted_count integer := 0;
BEGIN
  -- Delete all existing material types for this group
  DELETE FROM public.purchases_economic_group_material_types
  WHERE group_id = p_group_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Insert new material types if provided
  IF p_material_type_ids IS NOT NULL AND array_length(p_material_type_ids, 1) > 0 THEN
    INSERT INTO public.purchases_economic_group_material_types (group_id, material_type_id, created_by)
    SELECT 
      p_group_id,
      mt.id,
      auth.uid()
    FROM public.purchases_material_types mt
    WHERE mt.id = ANY(p_material_type_ids::uuid[]);
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'inserted_count', v_inserted_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."set_purchases_group_material_types"("p_group_id" integer, "p_material_type_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_unified_supplier_material_types"("p_supplier_id" "uuid", "p_material_type_ids" "text"[]) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_inserted_count integer := 0;
  v_deleted_count integer := 0;
BEGIN
  -- Delete all existing material types for this supplier
  DELETE FROM public.purchases_unified_supplier_material_types
  WHERE supplier_id = p_supplier_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Insert new material types if provided
  IF p_material_type_ids IS NOT NULL AND array_length(p_material_type_ids, 1) > 0 THEN
    INSERT INTO public.purchases_unified_supplier_material_types (supplier_id, material_type_id, created_by)
    SELECT 
      p_supplier_id,
      mt.id,
      auth.uid()
    FROM public.purchases_material_types mt
    WHERE mt.id = ANY(p_material_type_ids::uuid[]);
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'inserted_count', v_inserted_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."set_unified_supplier_material_types"("p_supplier_id" "uuid", "p_material_type_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_protheus_table_workflow"("table_name_param" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar se a tabela tem as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'is_new_record'
  ) THEN
    RAISE NOTICE 'Tabela % não possui coluna is_new_record, pulando...', table_name_param;
    RETURN;
  END IF;

  -- Adicionar coluna record_status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param 
      AND column_name = 'record_status'
  ) THEN
    EXECUTE format('
      ALTER TABLE public.%I
      ADD COLUMN record_status protheus_record_status
      GENERATED ALWAYS AS (
        CASE
          WHEN is_new_record = true THEN ''new''::protheus_record_status
          WHEN was_updated_last_sync = true THEN ''updated''::protheus_record_status
          ELSE ''unchanged''::protheus_record_status
        END
      ) STORED', table_name_param);
    RAISE NOTICE 'Coluna record_status adicionada à tabela %', table_name_param;
  END IF;

  -- Criar trigger se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = table_name_param
      AND trigger_name = table_name_param || '_status_change_trigger'
  ) THEN
    EXECUTE format('
      CREATE TRIGGER %I_status_change_trigger
        AFTER INSERT OR UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.emit_protheus_status_change()', 
      table_name_param, table_name_param);
    RAISE NOTICE 'Trigger criado para tabela %', table_name_param;
  END IF;
END;
$$;


ALTER FUNCTION "public"."setup_protheus_table_workflow"("table_name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_workflow"("workflow_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Mark workflow as deleted
  UPDATE public.workflows 
  SET 
    deleted_at = NOW(),
    is_active = false,
    status = 'deleted'
  WHERE id = workflow_id_param;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."soft_delete_workflow"("workflow_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_existing_unified_to_potential_material_types"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_synced_count integer := 0;
  v_cleaned_count integer := 0;
BEGIN
  -- 1) Limpar tipos de materiais do potencial que não existem no unificado
  WITH to_clean AS (
    DELETE FROM public.purchases_potential_supplier_material_types psmt
    WHERE EXISTS (
      SELECT 1 
      FROM public.purchases_unified_suppliers us
      WHERE us.potential_supplier_id = psmt.supplier_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.purchases_unified_supplier_material_types usmt
      JOIN public.purchases_unified_suppliers us2 ON us2.id = usmt.supplier_id
      WHERE us2.potential_supplier_id = psmt.supplier_id
        AND usmt.material_type_id = psmt.material_type_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_cleaned_count FROM to_clean;

  -- 2) Sincronizar tipos do unificado para o potencial
  WITH to_sync AS (
    INSERT INTO public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
    SELECT 
      us.potential_supplier_id,
      usmt.material_type_id,
      usmt.created_by
    FROM public.purchases_unified_supplier_material_types usmt
    JOIN public.purchases_unified_suppliers us ON us.id = usmt.supplier_id
    WHERE us.potential_supplier_id IS NOT NULL
    ON CONFLICT (supplier_id, material_type_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_synced_count FROM to_sync;

  RETURN json_build_object(
    'success', true,
    'synced_count', v_synced_count,
    'cleaned_count', v_cleaned_count,
    'message', format('Sincronização concluída: %s tipos adicionados, %s tipos removidos', v_synced_count, v_cleaned_count)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro durante a sincronização'
    );
END;
$$;


ALTER FUNCTION "public"."sync_existing_unified_to_potential_material_types"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_purchases_group_material_types_from_members"("p_id_grupo" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_inserted int := 0;
  v_total_after int := 0;
  v_union_count int := 0;
begin
  -- Insere no grupo a união dos tipos dos membros, ignorando duplicados
  with union_types as (
    select distinct material_type_id
    from (
      -- Tipos de materiais diretamente no fornecedor unificado
      select mt.material_type_id
      from public.purchases_economic_group_members m
      join public.purchases_unified_supplier_material_types mt
        on mt.supplier_id = m.unified_supplier_id
      where m.group_id = p_id_grupo

      union

      -- Fallback: tipos de materiais no potencial fornecedor vinculado ao unificado
      select pmt.material_type_id
      from public.purchases_economic_group_members m
      join public.purchases_unified_suppliers us
        on us.id = m.unified_supplier_id
      join public.purchases_potential_supplier_material_types pmt
        on pmt.supplier_id = us.potential_supplier_id
      where m.group_id = p_id_grupo
    ) s
  )
  insert into public.purchases_economic_group_material_types (group_id, material_type_id, created_by)
  select p_id_grupo, ut.material_type_id, auth.uid()
  from union_types ut
  on conflict (group_id, material_type_id) do nothing;

  get diagnostics v_inserted = ROW_COUNT;

  -- Total de tipos no grupo após a inserção
  select count(*) into v_total_after
  from public.purchases_economic_group_material_types
  where group_id = p_id_grupo;

  -- Quantidade de tipos distintos encontrados nos membros (para referência)
  select count(*) into v_union_count
  from (
    select mt.material_type_id
    from public.purchases_economic_group_members m
    join public.purchases_unified_supplier_material_types mt
      on mt.supplier_id = m.unified_supplier_id
    where m.group_id = p_id_grupo
    union
    select pmt.material_type_id
    from public.purchases_economic_group_members m
    join public.purchases_unified_suppliers us
      on us.id = m.unified_supplier_id
    join public.purchases_potential_supplier_material_types pmt
      on pmt.supplier_id = us.potential_supplier_id
    where m.group_id = p_id_grupo
  ) s;

  return json_build_object(
    'success', true,
    'inserted', v_inserted,
    'total_group_types', v_total_after,
    'union_member_types', v_union_count
  );
end;
$$;


ALTER FUNCTION "public"."sync_purchases_group_material_types_from_members"("p_id_grupo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."table_exists"("table_name_param" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name_param
  );
$$;


ALTER FUNCTION "public"."table_exists"("table_name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_claim_unified_supplier_ownership"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Se o registro não tem criador (created_by NULL) e está sendo atualizado,
  -- definir o usuário atual como criador
  IF OLD.created_by IS NULL AND NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_claim_unified_supplier_ownership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_cleanup_empty_purchases_group"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_group_id integer;
  v_remaining integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_group_id := OLD.group_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Só interessa quando mudou o grupo
    IF NEW.group_id IS DISTINCT FROM OLD.group_id THEN
      v_group_id := OLD.group_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_remaining
  FROM public.purchases_economic_group_members
  WHERE group_id = v_group_id;

  IF v_remaining = 0 THEN
    DELETE FROM public.purchases_economic_groups
    WHERE id_grupo = v_group_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."tg_cleanup_empty_purchases_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if (old.economic_group_id is null and new.economic_group_id is not null)
     and new.potential_supplier_id is not null
  then
    insert into public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    select new.economic_group_id, psmt.material_type_id, coalesce(auth.uid(), psmt.created_by)
      from public.purchases_potential_supplier_material_types psmt
     where psmt.supplier_id = new.potential_supplier_id
       and not exists (
         select 1
           from public.purchases_supplier_group_material_types g
          where g.group_id = new.economic_group_id
            and g.material_type_id = psmt.material_type_id
       );
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_copy_potential_material_types_to_group"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (COALESCE(OLD.economic_group_id::text,'') IS DISTINCT FROM COALESCE(NEW.economic_group_id::text,''))
     AND NEW.economic_group_id IS NOT NULL
     AND NEW.potential_supplier_id IS NOT NULL
  THEN
    INSERT INTO public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    SELECT NEW.economic_group_id, pmt.material_type_id, COALESCE(NEW.created_by, auth.uid())
      FROM public.purchases_potential_supplier_material_types pmt
     WHERE pmt.supplier_id = NEW.potential_supplier_id
       AND NOT EXISTS (
         SELECT 1 
           FROM public.purchases_supplier_group_material_types g
          WHERE g.group_id = NEW.economic_group_id
            AND g.material_type_id = pmt.material_type_id
       );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_copy_potential_material_types_to_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_mirror_expected_to_due_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.expected_completion_at is distinct from old.expected_completion_at then
    new.due_date := new.expected_completion_at;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."tg_mirror_expected_to_due_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_normalize_attendance_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Normalizar valor
  if new.attendance_type is null or btrim(new.attendance_type) = '' then
    new.attendance_type := 'direct';
  else
    new.attendance_type := lower(btrim(new.attendance_type));
  end if;

  -- Se direto, zera representante
  if new.attendance_type = 'direct' then
    new.representative_id := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_normalize_attendance_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_normalize_cnpj"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    NEW.cnpj := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_normalize_cnpj"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_normalize_tags"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare v_norm text[];
begin
  if new.tags is not null then
    select coalesce(array_agg(t order by t), '{}') into v_norm
    from (
      select distinct lower(trim(x)) as t
      from unnest(new.tags) as x
      where coalesce(trim(x),'') <> ''
    ) s;
    new.tags := v_norm;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."tg_normalize_tags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_prevent_fu_id_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.fu_id IS DISTINCT FROM OLD.fu_id THEN
    RAISE EXCEPTION 'fu_id is immutable and cannot be changed';
  END IF;
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."tg_prevent_fu_id_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_unified_supplier_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Se usuário marcou 'archived', preserve
  if new.status = 'archived' then
    return new;
  end if;

  if new.potential_supplier_id is not null
     and new.protheus_filial is not null
     and new.protheus_cod is not null
     and new.protheus_loja is not null then
    new.status := 'potential_and_supplier';
  elsif new.protheus_filial is not null
     and new.protheus_cod is not null
     and new.protheus_loja is not null then
    new.status := 'supplier';
  else
    new.status := 'potential_only';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_set_unified_supplier_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_attendance_potential_to_unified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_guard text;
begin
  -- Evitar recursão
  v_guard := current_setting('app.attendance_sync', true);
  if v_guard = '1' then
    return new;
  end if;

  -- Em INSERT sempre sincroniza; em UPDATE, só se mudou algo relevante
  if tg_op = 'INSERT'
     or new.attendance_type is distinct from old.attendance_type
     or coalesce(new.representative_id, '00000000-0000-0000-0000-000000000000')
        is distinct from coalesce(old.representative_id, '00000000-0000-0000-0000-000000000000')
  then
    perform set_config('app.attendance_sync','1', true);
    update public.purchases_unified_suppliers
       set attendance_type  = new.attendance_type,
           representative_id = case when new.attendance_type = 'direct' then null else new.representative_id end,
           updated_at = now()
     where potential_supplier_id = new.id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_sync_attendance_potential_to_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_attendance_unified_to_potential"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_guard text;
begin
  -- Evitar recursão
  v_guard := current_setting('app.attendance_sync', true);
  if v_guard = '1' then
    return new;
  end if;

  -- Só se houver potencial vinculado
  if new.potential_supplier_id is null then
    return new;
  end if;

  -- Em INSERT sempre sincroniza; em UPDATE, só se mudou algo relevante
  if tg_op = 'INSERT'
     or new.attendance_type is distinct from old.attendance_type
     or coalesce(new.representative_id, '00000000-0000-0000-0000-000000000000')
        is distinct from coalesce(old.representative_id, '00000000-0000-0000-0000-000000000000')
  then
    perform set_config('app.attendance_sync','1', true);
    update public.purchases_potential_suppliers
       set attendance_type  = new.attendance_type,
           representative_id = case when new.attendance_type = 'direct' then null else new.representative_id end,
           updated_at = now()
     where id = new.potential_supplier_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_sync_attendance_unified_to_potential"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(btrim(NEW.assigned_buyer_cod),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_cod),'')
       OR COALESCE(btrim(NEW.assigned_buyer_filial),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_filial),'') THEN
      UPDATE public.purchases_unified_suppliers u
         SET assigned_buyer_cod    = NULLIF(btrim(NEW.assigned_buyer_cod), ''),
             assigned_buyer_filial = NULLIF(btrim(NEW.assigned_buyer_filial), ''),
             updated_at            = now()
       WHERE u.potential_supplier_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Só sincroniza se houver potencial vinculado
  IF NEW.potential_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sincroniza em INSERT ou quando houver mudança em qualquer um dos campos
  IF TG_OP = 'INSERT'
     OR COALESCE(btrim(NEW.assigned_buyer_cod),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_cod),'')
     OR COALESCE(btrim(NEW.assigned_buyer_filial),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_filial),'')
  THEN
    UPDATE public.purchases_potential_suppliers
       SET assigned_buyer_cod    = nullif(btrim(NEW.assigned_buyer_cod), ''),
           assigned_buyer_filial = nullif(btrim(NEW.assigned_buyer_filial), ''),
           updated_at            = now()
     WHERE id = NEW.potential_supplier_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_buyer_potential_to_unified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.assigned_buyer_cod is distinct from old.assigned_buyer_cod
     or new.assigned_buyer_filial is distinct from old.assigned_buyer_filial
  then
    update public.purchases_unified_suppliers
       set assigned_buyer_cod = new.assigned_buyer_cod,
           assigned_buyer_filial = new.assigned_buyer_filial,
           updated_at = now()
     where potential_supplier_id = new.id;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."tg_sync_buyer_potential_to_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_buyer_unified_to_potential"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Só sincroniza se houver potencial vinculado
  if new.potential_supplier_id is null then
    return new;
  end if;

  -- Sincroniza em INSERT ou quando houver mudança em qualquer um dos campos
  if tg_op = 'INSERT'
     or coalesce(btrim(new.assigned_buyer_cod),'') is distinct from coalesce(btrim(old.assigned_buyer_cod),'')
     or coalesce(btrim(new.assigned_buyer_filial),'') is distinct from coalesce(btrim(old.assigned_buyer_filial),'')
  then
    update public.purchases_potential_suppliers
       set assigned_buyer_cod    = nullif(btrim(new.assigned_buyer_cod), ''),
           assigned_buyer_filial = nullif(btrim(new.assigned_buyer_filial), ''),
           updated_at            = now()
     where id = new.potential_supplier_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_sync_buyer_unified_to_potential"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_lead_group_from_unified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Se não houver lead vinculado, não faz nada
  if coalesce(new.lead_id, old.lead_id) is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    -- Espelha o grupo econômico do unified para o lead
    update public.sales_leads sl
       set economic_group_id = new.economic_group_id
     where sl.id = new.lead_id;

  elsif tg_op = 'DELETE' then
    -- Ao deletar/vincular a null, só limpa no lead se não houver outro unified com grupo
    update public.sales_leads sl
       set economic_group_id = null
     where sl.id = old.lead_id
       and not exists (
         select 1
           from public.unified_accounts ua
          where ua.lead_id = old.lead_id
            and ua.economic_group_id is not null
       );
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."tg_sync_lead_group_from_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_potential_material_types_to_group"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_group_id uuid;
begin
  -- localizar um unificado com grupo para este potencial
  select economic_group_id
    into v_group_id
    from public.purchases_unified_suppliers
   where potential_supplier_id = coalesce(new.supplier_id, old.supplier_id)
     and economic_group_id is not null
   limit 1;

  if v_group_id is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    values (v_group_id, new.material_type_id, coalesce(auth.uid(), new.created_by))
    on conflict do nothing;
  elsif tg_op = 'DELETE' then
    delete from public.purchases_supplier_group_material_types
     where group_id = v_group_id
       and material_type_id = old.material_type_id;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."tg_sync_potential_material_types_to_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_potential_tags_to_unified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_unified uuid;
  v_guard text;
begin
  -- Evitar recursão entre triggers
  v_guard := current_setting('app.tags_sync', true);
  if v_guard = '1' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    select id
      into v_unified
      from public.purchases_unified_suppliers
     where potential_supplier_id = new.supplier_id
     limit 1;

    if v_unified is not null then
      perform set_config('app.tags_sync', '1', true);
      insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
      values (v_unified, new.tag_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;

    return new;

  elsif tg_op = 'DELETE' then
    select id
      into v_unified
      from public.purchases_unified_suppliers
     where potential_supplier_id = old.supplier_id
     limit 1;

    if v_unified is not null then
      perform set_config('app.tags_sync', '1', true);
      delete from public.purchases_unified_supplier_tags
       where supplier_id = v_unified
         and tag_id = old.tag_id;
    end if;

    return old;

  elsif tg_op = 'UPDATE' then
    if new.tag_id is distinct from old.tag_id then
      select id
        into v_unified
        from public.purchases_unified_suppliers
       where potential_supplier_id = new.supplier_id
       limit 1;

      if v_unified is not null then
        perform set_config('app.tags_sync', '1', true);
        delete from public.purchases_unified_supplier_tags
         where supplier_id = v_unified
           and tag_id = old.tag_id;

        insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
        values (v_unified, new.tag_id, coalesce(new.created_by, auth.uid()))
        on conflict do nothing;
      end if;
    end if;

    return new;
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."tg_sync_potential_tags_to_unified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_purchases_unified_has_group"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Marca o fornecedor como pertencente a algum grupo
    UPDATE public.purchases_unified_suppliers
       SET has_economic_group = true
     WHERE id = NEW.unified_supplier_id;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Se trocou o fornecedor, ajustar ambos (antigo/novo)
    IF NEW.unified_supplier_id IS DISTINCT FROM OLD.unified_supplier_id THEN
      -- Antigo: se ficou sem vínculos, seta false
      IF NOT EXISTS (
        SELECT 1
        FROM public.purchases_economic_group_members
        WHERE unified_supplier_id = OLD.unified_supplier_id
      ) THEN
        UPDATE public.purchases_unified_suppliers
           SET has_economic_group = false
         WHERE id = OLD.unified_supplier_id;
      END IF;

      -- Novo: garantir true
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = true
       WHERE id = NEW.unified_supplier_id;

    ELSE
      -- Mesmo fornecedor; garantir true
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = true
       WHERE id = NEW.unified_supplier_id;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Se o fornecedor apagado ficou sem vínculos, seta false
    IF NOT EXISTS (
      SELECT 1
      FROM public.purchases_economic_group_members
      WHERE unified_supplier_id = OLD.unified_supplier_id
    ) THEN
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = false
       WHERE id = OLD.unified_supplier_id;
    END IF;

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."tg_sync_purchases_unified_has_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_unified_material_types_to_potential"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_potential_id uuid;
begin
  -- Encontrar o potencial vinculado ao fornecedor unificado
  select potential_supplier_id
    into v_potential_id
  from public.purchases_unified_suppliers
  where id = coalesce(new.supplier_id, old.supplier_id)
  limit 1;

  -- Se não houver potencial vinculado, não faz nada
  if v_potential_id is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
    values (v_potential_id, new.material_type_id, coalesce(new.created_by, auth.uid()))
    on conflict do nothing;

  elsif tg_op = 'DELETE' then
    delete from public.purchases_potential_supplier_material_types
     where supplier_id = v_potential_id
       and material_type_id = old.material_type_id;

  elsif tg_op = 'UPDATE' then
    -- Em caso de mudança do tipo, espelhar como delete antigo + insert novo
    if new.material_type_id is distinct from old.material_type_id then
      delete from public.purchases_potential_supplier_material_types
       where supplier_id = v_potential_id
         and material_type_id = old.material_type_id;

      insert into public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
      values (v_potential_id, new.material_type_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."tg_sync_unified_material_types_to_potential"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_unified_supplier_has_group"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.unified_supplier_id IS NOT NULL THEN
      UPDATE public.purchases_unified_suppliers
      SET has_economic_group = true, updated_at = now()
      WHERE id = NEW.unified_supplier_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.unified_supplier_id IS NOT NULL THEN
      UPDATE public.purchases_unified_suppliers
      SET has_economic_group = EXISTS (
        SELECT 1 FROM public.purchases_economic_group_members m
        WHERE m.unified_supplier_id = OLD.unified_supplier_id
      ), updated_at = now()
      WHERE id = OLD.unified_supplier_id;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o unified_supplier_id mudou, liga o novo e recalcula o antigo
    IF NEW.unified_supplier_id IS DISTINCT FROM OLD.unified_supplier_id THEN
      IF NEW.unified_supplier_id IS NOT NULL THEN
        UPDATE public.purchases_unified_suppliers
        SET has_economic_group = true, updated_at = now()
        WHERE id = NEW.unified_supplier_id;
      END IF;

      IF OLD.unified_supplier_id IS NOT NULL THEN
        UPDATE public.purchases_unified_suppliers
        SET has_economic_group = EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members m
          WHERE m.unified_supplier_id = OLD.unified_supplier_id
        ), updated_at = now()
        WHERE id = OLD.unified_supplier_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."tg_sync_unified_supplier_has_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_unified_tags_to_potential"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_potential uuid;
  v_guard text;
begin
  -- Evitar recursão entre triggers
  v_guard := current_setting('app.tags_sync', true);
  if v_guard = '1' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    select potential_supplier_id
      into v_potential
      from public.purchases_unified_suppliers
     where id = new.supplier_id
     limit 1;

    if v_potential is not null then
      perform set_config('app.tags_sync', '1', true);
      insert into public.purchases_potential_supplier_tags (supplier_id, tag_id, created_by)
      values (v_potential, new.tag_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;

    return new;

  elsif tg_op = 'DELETE' then
    select potential_supplier_id
      into v_potential
      from public.purchases_unified_suppliers
     where id = old.supplier_id
     limit 1;

    if v_potential is not null then
      perform set_config('app.tags_sync', '1', true);
      delete from public.purchases_potential_supplier_tags
       where supplier_id = v_potential
         and tag_id = old.tag_id;
    end if;

    return old;

  elsif tg_op = 'UPDATE' then
    if new.tag_id is distinct from old.tag_id then
      select potential_supplier_id
        into v_potential
        from public.purchases_unified_suppliers
       where id = new.supplier_id
       limit 1;

      if v_potential is not null then
        perform set_config('app.tags_sync', '1', true);
        delete from public.purchases_potential_supplier_tags
         where supplier_id = v_potential
           and tag_id = old.tag_id;

        insert into public.purchases_potential_supplier_tags (supplier_id, tag_id, created_by)
        values (v_potential, new.tag_id, coalesce(new.created_by, auth.uid()))
        on conflict do nothing;
      end if;
    end if;

    return new;
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."tg_sync_unified_tags_to_potential"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_update_acl_hash"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.acl_hash := public.compute_acl_hash(NEW.department_id, NEW.folder_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_update_acl_hash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_validate_sales_lead_city_not_null"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.city_id IS NULL THEN
      RAISE EXCEPTION 'city_id é obrigatório para criar um lead';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_validate_sales_lead_city_not_null"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_validate_site_cities_codes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- Normalizações simples
  IF NEW.country IS NOT NULL THEN
    NEW.country := btrim(NEW.country);
  END IF;
  IF NEW.uf IS NOT NULL THEN
    NEW.uf := upper(btrim(NEW.uf));
  END IF;

  -- País é Brasil? (considera variações comuns)
  IF lower(coalesce(NEW.country, '')) IN ('brasil','brazil','br') THEN
    -- Exigir códigos brasileiros
    IF NEW.cod_munic IS NULL OR btrim(NEW.cod_munic) = '' THEN
      RAISE EXCEPTION 'Cód. Munic é obrigatório para cidades do Brasil';
    END IF;
    IF NEW.cod_uf IS NULL OR btrim(NEW.cod_uf) = '' THEN
      RAISE EXCEPTION 'Cód. UF é obrigatório para cidades do Brasil';
    END IF;
    -- Validar numéricos
    IF NEW.cod_munic !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Cód. Munic deve conter apenas números';
    END IF;
    IF NEW.cod_uf !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Cód. UF deve conter apenas números';
    END IF;
  ELSE
    -- Para cidades fora do Brasil, limpar strings vazias para NULL
    IF NEW.cod_munic IS NOT NULL AND btrim(NEW.cod_munic) = '' THEN
      NEW.cod_munic := NULL;
    END IF;
    IF NEW.cod_uf IS NOT NULL AND btrim(NEW.cod_uf) = '' THEN
      NEW.cod_uf := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."tg_validate_site_cities_codes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_document_expired"("document_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.process_workflow_triggers(
    'system_event',
    jsonb_build_object(
      'event_type', 'document_expired',
      'document_id', document_id,
      'expired_at', now()
    )
  );
END;
$$;


ALTER FUNCTION "public"."trigger_document_expired"("document_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_field_change"("p_table_name" "text", "p_record_id" "uuid", "p_field_name" "text", "p_old_value" "text", "p_new_value" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Buscar workflows que monitoram este campo específico
  PERFORM public.process_workflow_triggers(
    'field_change',
    jsonb_build_object(
      'table_name', p_table_name,
      'record_id', p_record_id,
      'field_name', p_field_name,
      'old_value', p_old_value,
      'new_value', p_new_value,
      'changed_at', now(),
      'changed_by', auth.uid()
    )
  );
END;
$$;


ALTER FUNCTION "public"."trigger_field_change"("p_table_name" "text", "p_record_id" "uuid", "p_field_name" "text", "p_old_value" "text", "p_new_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_file_uploaded"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.process_workflow_triggers(
    'system_event',
    jsonb_build_object(
      'event_type', 'file_uploaded',
      'file_id', NEW.id,
      'uploaded_by', NEW.uploaded_by,
      'record_type', NEW.record_type,
      'record_id', NEW.record_id,
      'uploaded_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_file_uploaded"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_record_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Processar triggers de registro criado para diferentes tabelas
  PERFORM public.process_workflow_triggers(
    'record_created',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'record_id', NEW.id,
      'created_by', COALESCE(NEW.created_by, auth.uid()),
      'created_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_record_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_task_edited"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Apenas disparar se não for mudança de status (já coberto por outro trigger)
  IF (OLD.title IS DISTINCT FROM NEW.title OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.priority IS DISTINCT FROM NEW.priority OR
      OLD.due_date IS DISTINCT FROM NEW.due_date OR
      OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'task_edited',
        'task_id', NEW.id,
        'edited_by', auth.uid(),
        'edited_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_task_edited"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_task_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Processar triggers de mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.process_workflow_triggers(
      'status_change',
      jsonb_build_object(
        'task_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'assigned_to', NEW.assigned_to,
        'changed_at', now()
      )
    );
  END IF;
  
  -- Processar triggers de tarefa completada
  IF OLD.status != 'done' AND NEW.status = 'done' THEN
    PERFORM public.process_workflow_triggers(
      'task_completed',
      jsonb_build_object(
        'task_id', NEW.id,
        'assigned_to', NEW.assigned_to,
        'completed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_task_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_user_department_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_department_changed',
        'user_id', NEW.id,
        'old_department_id', OLD.department_id,
        'new_department_id', NEW.department_id,
        'changed_at', now()
      )
    );
  END IF;
  
  -- Trigger para mudanças de role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_role_changed',
        'user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_user_department_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_user_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Apenas disparar se last_login foi realmente atualizado (não era igual antes)
  IF OLD.last_login IS DISTINCT FROM NEW.last_login AND NEW.last_login IS NOT NULL THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_login',
        'user_id', NEW.id,
        'login_at', NEW.last_login
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_user_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_conversation_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_conversation_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cache_access"("p_cache_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.processing_cache 
  SET access_count = access_count + 1,
      last_accessed = now()
  WHERE cache_key = p_cache_key;
END;
$$;


ALTER FUNCTION "public"."update_cache_access"("p_cache_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_last_used"("user_id_param" "uuid", "device_fingerprint_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Atualizar last_used_at se dispositivo for confiável
  UPDATE trusted_devices 
  SET last_used_at = now()
  WHERE user_id = user_id_param
    AND device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_device_last_used"("user_id_param" "uuid", "device_fingerprint_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_acl_hash"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the document's ACL hash
    NEW.acl_hash = compute_document_acl_hash(NEW.id);
    
    -- Also update all chunks for this document
    UPDATE doc_chunks 
    SET acl_hash = NEW.acl_hash
    WHERE document_id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_acl_hash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_rag_capabilities"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  doc_id uuid;
  capabilities jsonb := '{}'::jsonb;
  text_count integer := 0;
  ocr_count integer := 0;
  semantic_count integer := 0;
  total_pages integer := 0;
  processed_pages integer := 0;
BEGIN
  -- Determinar document_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    doc_id := OLD.document_id;
  ELSE
    doc_id := NEW.document_id;
  END IF;

  -- Contar chunks por tipo de extração
  SELECT 
    COUNT(*) FILTER (WHERE extraction_source IN ('pdf_js', 'text_extraction')) as text_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'ocr') as ocr_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'semantic_chunker') as semantic_extraction,
    COUNT(DISTINCT COALESCE(page_number, slide_number, 1)) as processed_page_count
  INTO text_count, ocr_count, semantic_count, processed_pages
  FROM public.doc_chunks 
  WHERE document_id = doc_id;

  -- Obter total de páginas do documento
  SELECT COALESCE(page_count, 1) INTO total_pages
  FROM public.documents 
  WHERE id = doc_id;

  -- Construir objeto capabilities
  capabilities := jsonb_build_object(
    'has_text_extraction', text_count > 0,
    'has_ocr', ocr_count > 0,
    'has_semantic', semantic_count > 0,
    'text_chunks', text_count,
    'ocr_chunks', ocr_count,
    'semantic_chunks', semantic_count,
    'total_chunks', text_count + ocr_count + semantic_count,
    'processed_pages', processed_pages,
    'total_pages', total_pages,
    'coverage_percentage', CASE 
      WHEN total_pages > 0 THEN ROUND((processed_pages::numeric / total_pages::numeric) * 100, 1)
      ELSE 0
    END
  );

  -- Atualizar documento
  UPDATE public.documents 
  SET rag_capabilities = capabilities
  WHERE id = doc_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_document_rag_capabilities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_rag_capabilities_manual"("doc_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  capabilities jsonb := '{}'::jsonb;
  text_count integer := 0;
  ocr_count integer := 0;
  semantic_count integer := 0;
  total_pages integer := 0;
  processed_pages integer := 0;
BEGIN
  -- Contar chunks por tipo de extração
  SELECT 
    COUNT(*) FILTER (WHERE extraction_source IN ('pdf_js', 'text_extraction')) as text_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'ocr') as ocr_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'semantic_chunker') as semantic_extraction,
    COUNT(DISTINCT COALESCE(page_number, slide_number, 1)) as processed_page_count
  INTO text_count, ocr_count, semantic_count, processed_pages
  FROM public.doc_chunks 
  WHERE document_id = doc_id;

  -- Obter total de páginas do documento
  SELECT COALESCE(page_count, 1) INTO total_pages
  FROM public.documents 
  WHERE id = doc_id;

  -- Construir objeto capabilities
  capabilities := jsonb_build_object(
    'has_text_extraction', text_count > 0,
    'has_ocr', ocr_count > 0,
    'has_semantic', semantic_count > 0,
    'text_chunks', text_count,
    'ocr_chunks', ocr_count,
    'semantic_chunks', semantic_count,
    'total_chunks', text_count + ocr_count + semantic_count,
    'processed_pages', processed_pages,
    'total_pages', total_pages,
    'coverage_percentage', CASE 
      WHEN total_pages > 0 THEN ROUND((processed_pages::numeric / total_pages::numeric) * 100, 1)
      ELSE 0
    END
  );

  -- Atualizar documento
  UPDATE public.documents 
  SET rag_capabilities = capabilities
  WHERE id = doc_id;
END;
$$;


ALTER FUNCTION "public"."update_document_rag_capabilities_manual"("doc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_storage"("doc_id" "uuid", "new_storage_key" "text", "new_mime_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.documents 
  SET 
    storage_key = new_storage_key,
    mime_type = new_mime_type,
    updated_at = now()
  WHERE id = doc_id;
END;
$$;


ALTER FUNCTION "public"."update_document_storage"("doc_id" "uuid", "new_storage_key" "text", "new_mime_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_documents_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_documents_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_signatures_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_email_signatures_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_form_external_invitations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_form_external_invitations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_group_name"("p_id_grupo" integer, "p_nome_grupo" "text" DEFAULT NULL::"text", "p_nome_grupo_sugerido" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.protheus_customer_groups
  SET 
    name = COALESCE(p_nome_grupo, name),
    nome_grupo_sugerido = COALESCE(p_nome_grupo_sugerido, nome_grupo_sugerido),
    name_source = CASE WHEN p_nome_grupo IS NOT NULL THEN 'manual' ELSE name_source END
  WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_group_name"("p_id_grupo" integer, "p_nome_grupo" "text", "p_nome_grupo_sugerido" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_processing_steps_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_processing_steps_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_protheus_binary_assets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_protheus_binary_assets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_protheus_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_protheus_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_protheus_customer_groups"("p_table_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
  v_run_id UUID;
  v_new_groups_count INTEGER := 0;
  v_new_members_count INTEGER := 0;
  v_ignored_members_count INTEGER := 0;
  v_unit RECORD;
  v_group_id_grupo INTEGER;
  v_group_uuid UUID;
  v_group_exists BOOLEAN;
BEGIN
  -- Nome da tabela dinâmica
  SELECT supabase_table_name
    INTO v_table
  FROM public.protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id
  LIMIT 1;

  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  END IF;

  -- Registrar execução
  INSERT INTO public.protheus_group_update_runs (protheus_table_id, triggered_by)
  VALUES (p_table_id, auth.uid())
  RETURNING id INTO v_run_id;

  -- Percorre unidades sem vínculo
  FOR v_unit IN EXECUTE format($q$
    SELECT DISTINCT 
      a1_filial::text AS filial,
      a1_cod::text    AS cod,
      a1_loja::text   AS loja,
      a1_nome::text   AS nome
    FROM %I sa1
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod    = sa1.a1_cod::text
        AND pgu.loja   = sa1.a1_loja::text
    )
    ORDER BY a1_filial, a1_cod, a1_loja
  $q$, v_table, p_table_id)
  LOOP
    -- Localiza grupo existente (captura INTEGER e UUID)
    SELECT id_grupo, id
      INTO v_group_id_grupo, v_group_uuid
    FROM public.protheus_customer_groups
    WHERE protheus_table_id = p_table_id
      AND filial = v_unit.filial
      AND cod    = v_unit.cod
    LIMIT 1;

    v_group_exists := v_group_id_grupo IS NOT NULL;

    -- Cria grupo se necessário
    IF NOT v_group_exists THEN
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
      )
      RETURNING id_grupo, id INTO v_group_id_grupo, v_group_uuid;

      v_new_groups_count := v_new_groups_count + 1;
    END IF;

    -- Vincula unidade ao grupo (usa id_grupo INTEGER)
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
      v_group_id_grupo,
      auth.uid()
    );

    -- Registra resultado da execução usando SEMPRE o INTEGER id_grupo
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
      v_group_id_grupo,  -- IMPORTANTE: INTEGER id_grupo, compatível com a coluna
      CASE WHEN v_group_exists THEN 'Associado ao grupo existente' ELSE 'Novo grupo criado' END
    );

    v_new_members_count := v_new_members_count + 1;
  END LOOP;

  -- Membros já em grupo (ignorados)
  EXECUTE format($q$
    SELECT COUNT(*)
    FROM %I sa1
    WHERE EXISTS (
      SELECT 1 
      FROM public.protheus_customer_group_units pgu
      WHERE pgu.protheus_table_id = %L
        AND pgu.filial = sa1.a1_filial::text
        AND pgu.cod    = sa1.a1_cod::text
        AND pgu.loja   = sa1.a1_loja::text
    )
  $q$, v_table, p_table_id)
  INTO v_ignored_members_count;

  -- Atualiza contagem de unidades por grupo
  UPDATE public.protheus_customer_groups g
  SET unit_count = (
    SELECT COUNT(*)
    FROM public.protheus_customer_group_units pgu
    WHERE pgu.group_id = g.id_grupo
  )
  WHERE g.protheus_table_id = p_table_id;

  -- Finaliza execução
  UPDATE public.protheus_group_update_runs
  SET 
    finished_at       = now(),
    new_groups_count  = v_new_groups_count,
    new_members_count = v_new_members_count
  WHERE id = v_run_id;

  RETURN json_build_object(
    'success', true,
    'run_id', v_run_id,
    'new_groups_count', v_new_groups_count,
    'new_members_count', v_new_members_count,
    'ignored_members_count', v_ignored_members_count
  );
END;
$_$;


ALTER FUNCTION "public"."update_protheus_customer_groups"("p_table_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_protheus_dynamic_tables_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_protheus_dynamic_tables_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_protheus_queries_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_protheus_queries_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_protheus_queries_updated_at"() IS 'Trigger function to update updated_at timestamp - Fixed search path for security';



CREATE OR REPLACE FUNCTION "public"."update_protheus_tables_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_protheus_tables_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.purchases_economic_groups
     SET name                  = COALESCE(p_name, name),
         assigned_buyer_cod    = NULLIF(btrim(p_assigned_buyer_cod), ''),
         assigned_buyer_filial = NULLIF(btrim(p_assigned_buyer_filial), ''),
         updated_at            = now()
   WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text", "p_protheus_filial" "text", "p_protheus_cod" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.purchases_economic_groups
     SET name                  = COALESCE(p_name, name),
         assigned_buyer_cod    = NULLIF(btrim(p_assigned_buyer_cod), ''),
         assigned_buyer_filial = NULLIF(btrim(p_assigned_buyer_filial), ''),
         protheus_filial       = NULLIF(btrim(p_protheus_filial), ''),
         protheus_cod          = NULLIF(btrim(p_protheus_cod), ''),
         updated_at            = now()
   WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text", "p_protheus_filial" "text", "p_protheus_cod" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchases_group_name"("p_id_grupo" integer, "p_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.purchases_economic_groups
  SET name = NULLIF(btrim(p_name), '')
  WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_purchases_group_name"("p_id_grupo" integer, "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_record_shares_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_record_shares_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_shared_mailboxes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_shared_mailboxes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_site_product_applications_map_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_site_product_applications_map_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_site_product_names_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_site_product_names_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_series_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_series_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_template_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_template_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_types_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_types_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_task_types_updated_at"() IS 'Trigger function to update updated_at timestamp - Fixed search path for security';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_modify_page"("p_page_name" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
  user_dept uuid;
  permission_level permission_level;
BEGIN
  -- Get user's role and department
  SELECT role, department_id INTO user_role, user_dept
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Admins and directors can always modify
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- If no department, deny access
  IF user_dept IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get permission level for the user's role and department
  SELECT 
    CASE 
      WHEN user_role = 'hr' THEN dp.hr_permission
      WHEN user_role = 'user' AND EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_leader = true) THEN dp.leader_permission
      WHEN user_role = 'user' THEN dp.user_permission
      ELSE 'bloquear_acesso'::permission_level
    END INTO permission_level
  FROM public.department_permissions dp
  WHERE dp.department_id = user_dept AND dp.page_name = p_page_name;
  
  -- Return true if permission allows modification
  RETURN COALESCE(permission_level = 'ver_modificar', false);
END;
$$;


ALTER FUNCTION "public"."user_can_modify_page"("p_page_name" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_commercial_rep"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sa2010 uuid := '72a51158-05c5-4e7d-82c6-94f78f7166b3'; -- SA2010_FORNECEDORES
BEGIN
  -- Pelo menos um tipo deve ser marcado
  IF COALESCE(NEW.is_sales,false) = false AND COALESCE(NEW.is_purchases,false) = false THEN
    RAISE EXCEPTION 'Marque pelo menos um tipo: vendas e/ou compras';
  END IF;

  -- Se vinculado ao Protheus, exigir chaves e garantir tabela SA2010
  IF COALESCE(NEW.is_registered_in_protheus,false) = true THEN
    IF NEW.protheus_table_id IS NULL 
       OR NEW.supplier_filial IS NULL 
       OR NEW.supplier_cod IS NULL 
       OR NEW.supplier_loja IS NULL THEN
      RAISE EXCEPTION 'Para reps vinculados ao Protheus, protheus_table_id, filial, cod e loja são obrigatórios';
    END IF;

    IF NEW.protheus_table_id <> v_sa2010 THEN
      RAISE EXCEPTION 'Somente fornecedores (SA2010) podem ser vinculados';
    END IF;
  ELSE
    -- Se não vinculado, limpar chaves para consistência
    NEW.protheus_table_id := NULL;
    NEW.supplier_filial := NULL;
    NEW.supplier_cod := NULL;
    NEW.supplier_loja := NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_commercial_rep"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_unified_account_links"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Pelo menos um vínculo é obrigatório:
  -- (a) lead_id preenchido, ou
  -- (b) cliente Protheus completo (filial, cod, loja)
  IF NEW.lead_id IS NULL
     AND (NEW.protheus_filial IS NULL OR NEW.protheus_cod IS NULL OR NEW.protheus_loja IS NULL)
  THEN
    RAISE EXCEPTION 'Informe um Lead ou um Cliente do Protheus (filial, código e loja) para criar/atualizar o cliente unificado';
  END IF;

  -- Se algum campo Protheus for informado, exigir todos os três (filial, cod e loja)
  IF NEW.protheus_filial IS NOT NULL
     OR NEW.protheus_cod IS NOT NULL
     OR NEW.protheus_loja IS NOT NULL
  THEN
    IF NEW.protheus_filial IS NULL
       OR NEW.protheus_cod IS NULL
       OR NEW.protheus_loja IS NULL
    THEN
      RAISE EXCEPTION 'Para vincular Cliente do Protheus, preencha filial, código e loja';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_unified_account_links"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("stored_hash" "text", "provided_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Use crypt to verify password against stored hash
  RETURN stored_hash = crypt(provided_password, stored_hash);
END;
$$;


ALTER FUNCTION "public"."verify_password"("stored_hash" "text", "provided_password" "text") OWNER TO "postgres";


CREATE UNLOGGED TABLE "public"."_new_users_tmp" (
    "id" "uuid",
    "email" "text"
);


ALTER TABLE "public"."_new_users_tmp" OWNER TO "postgres";


CREATE UNLOGGED TABLE "public"."_old_users_tmp" (
    "id" "uuid",
    "email" "text"
);


ALTER TABLE "public"."_old_users_tmp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_rejections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_request_id" "uuid" NOT NULL,
    "rejected_by" "uuid",
    "rejection_reason" "text",
    "rejected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "requester_name" "text" NOT NULL,
    "requester_email" "text" NOT NULL,
    "requested_role" "text" NOT NULL,
    "requested_department" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."access_rejections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "sources" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_conversation_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "conversation_type" "public"."ai_conversation_type" DEFAULT 'geral'::"public"."ai_conversation_type" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scope" "jsonb",
    "is_archived" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_health_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "service" "text" NOT NULL,
    "status" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "response_time_ms" integer,
    "error_rate_percent" numeric(5,2),
    "last_check" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_error_message" "text",
    "consecutive_failures" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_health_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_id" "uuid",
    "access_request_id" "uuid",
    "token_hash" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "approval_tokens_action_check" CHECK (("action" = ANY (ARRAY['approve'::"text", 'reject'::"text"])))
);


ALTER TABLE "public"."approval_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buyer_user_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_code" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."buyer_user_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chatter_email_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "subject" "text" NOT NULL,
    "html" "text" NOT NULL,
    "to" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cc" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "bcc" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "provider_message_id" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chatter_email_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chatter_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text",
    "file_size" integer,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "document_group_id" "uuid" NOT NULL,
    "version_number" integer DEFAULT 1,
    "is_current_version" boolean DEFAULT true,
    "effective_date" timestamp with time zone DEFAULT "now"(),
    "expiry_date" timestamp with time zone,
    "notify_before_expiry" interval,
    "notify_users" "uuid"[],
    "notify_department_id" "uuid",
    "requires_approval" boolean DEFAULT false,
    "approval_users" "uuid"[],
    "approval_department_id" "uuid",
    "approval_status" "public"."approval_status" DEFAULT 'approved'::"public"."approval_status",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone
);


ALTER TABLE "public"."chatter_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chatter_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "message_type" "text" DEFAULT 'internal'::"text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "author_id" "uuid",
    "mentioned_users" "uuid"[],
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "parent_message_id" "uuid",
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chatter_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['internal'::"text", 'external'::"text"])))
);


ALTER TABLE "public"."chatter_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commercial_representatives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "is_sales" boolean DEFAULT false NOT NULL,
    "is_purchases" boolean DEFAULT false NOT NULL,
    "is_registered_in_protheus" boolean DEFAULT false NOT NULL,
    "protheus_table_id" "uuid",
    "supplier_filial" "text",
    "supplier_cod" "text",
    "supplier_loja" "text",
    "supplier_key" "text" GENERATED ALWAYS AS (((((COALESCE("supplier_filial", ''::"text") || '|'::"text") || COALESCE("supplier_cod", ''::"text")) || '|'::"text") || COALESCE("supplier_loja", ''::"text"))) STORED,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."commercial_representatives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_entity_associations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_entity_id" "uuid" NOT NULL,
    "official_name" "text" NOT NULL,
    "acronym" "text",
    "association_type" "text",
    "activity_area" "text",
    "cnpj" "text",
    "address_street" "text",
    "address_number" "text",
    "address_complement" "text",
    "address_neighborhood" "text",
    "city_id" "uuid",
    "cep" "text",
    "website" "text",
    "regional_unit" "text",
    "company_relationship_types" "text"[],
    "participation_level" "text",
    "responsible_user_id" "uuid",
    "responsible_department_id" "uuid",
    "current_status" "text",
    "interaction_history" "text",
    "has_financial_contributions" boolean DEFAULT false,
    "contribution_amount" numeric(10,2),
    "contribution_frequency" "text",
    "affiliation_date" "date",
    "association_validity_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_entity_associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_entity_external_partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_entity_id" "uuid" NOT NULL,
    "official_name" "text" NOT NULL,
    "trade_name" "text",
    "cnpj" "text",
    "partner_type" "public"."partner_type" NOT NULL,
    "interest_areas" "text"[],
    "website" "text",
    "official_profiles" "text"[],
    "relationship_nature" "public"."relationship_nature"[] DEFAULT '{}'::"public"."relationship_nature"[] NOT NULL,
    "relationship_nature_other" "text",
    "risk_level" "public"."risk_level" DEFAULT 'baixo'::"public"."risk_level",
    "nda_mou_term" boolean DEFAULT false,
    "nda_mou_number" "text",
    "nda_mou_url" "text",
    "nda_mou_validity" "date",
    "conflict_of_interest" boolean DEFAULT false,
    "conflict_observation" "text",
    "lgpd_basis" "public"."lgpd_basis",
    "relationship_objective" "text",
    "kpis" "text",
    "counterparts" "text",
    "responsible_user_id" "uuid",
    "responsible_department_id" "uuid",
    "internal_areas" "text"[],
    "relevance" "public"."relevance" DEFAULT 'tatico'::"public"."relevance",
    "status" "public"."partner_status" DEFAULT 'ativo'::"public"."partner_status",
    "city_id" "uuid",
    "address_street" "text",
    "address_number" "text",
    "address_complement" "text",
    "address_neighborhood" "text",
    "cep" "text",
    "generic_email" "text",
    "phone" "text",
    "contact_form_url" "text",
    "media_kit_url" "text",
    "drive_link" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_entity_external_partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_entity_public_orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_entity_id" "uuid" NOT NULL,
    "official_name" "text" NOT NULL,
    "acronym" "text",
    "governmental_sphere" "text",
    "organ_type" "text",
    "activity_areas" "text"[],
    "cnpj" "text",
    "address_street" "text",
    "address_number" "text",
    "address_complement" "text",
    "address_neighborhood" "text",
    "city_id" "uuid",
    "cep" "text",
    "website" "text",
    "regional_unit" "text",
    "relation_type" "text",
    "relation_detail" "text",
    "responsible_user_id" "uuid",
    "responsible_department_id" "uuid",
    "status" "text" DEFAULT 'regular'::"text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_entity_public_orgs_governmental_sphere_check" CHECK (("governmental_sphere" = ANY (ARRAY['municipal'::"text", 'estadual'::"text", 'federal'::"text", 'internacional'::"text"]))),
    CONSTRAINT "contact_entity_public_orgs_organ_type_check" CHECK (("organ_type" = ANY (ARRAY['regulador'::"text", 'fiscalizador'::"text", 'policia'::"text", 'ministerio'::"text", 'prefeitura'::"text", 'outro'::"text"]))),
    CONSTRAINT "contact_entity_public_orgs_relation_type_check" CHECK (("relation_type" = ANY (ARRAY['fiscalizacao'::"text", 'registro_certificacao'::"text", 'autorizacao'::"text", 'licenciamento'::"text", 'outros'::"text"]))),
    CONSTRAINT "contact_entity_public_orgs_status_check" CHECK (("status" = ANY (ARRAY['regular'::"text", 'pendente'::"text", 'em_fiscalizacao'::"text", 'em_auditoria'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."contact_entity_public_orgs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_entity_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"()
);


ALTER TABLE "public"."contact_entity_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_friend_family_link_employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "link_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_friend_family_link_employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_friend_family_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "relationship" "public"."family_relationship" NOT NULL,
    "relationship_other" "text",
    "is_minor" boolean DEFAULT false NOT NULL,
    "legal_guardian_name" "text",
    "legal_guardian_contact" "text",
    "usage_types" "public"."contact_usage_type"[] DEFAULT '{}'::"public"."contact_usage_type"[] NOT NULL,
    "usage_other" "text",
    "legal_basis" "public"."lgpd_legal_basis" NOT NULL,
    "has_consent" boolean DEFAULT false NOT NULL,
    "consent_date" timestamp with time zone,
    "contact_restrictions" "text",
    "dnc_list" boolean DEFAULT false NOT NULL,
    "conflict_notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_consent_date" CHECK (((NOT "has_consent") OR ("consent_date" IS NOT NULL))),
    CONSTRAINT "check_legal_guardian" CHECK (((NOT "is_minor") OR (("legal_guardian_name" IS NOT NULL) AND ("legal_guardian_contact" IS NOT NULL)))),
    CONSTRAINT "check_relationship_other" CHECK ((("relationship" <> 'outro'::"public"."family_relationship") OR (("relationship_other" IS NOT NULL) AND (TRIM(BOTH FROM "relationship_other") <> ''::"text")))),
    CONSTRAINT "check_usage_other" CHECK (((NOT ('outro'::"public"."contact_usage_type" = ANY ("usage_types"))) OR (("usage_other" IS NOT NULL) AND (TRIM(BOTH FROM "usage_other") <> ''::"text"))))
);


ALTER TABLE "public"."contact_friend_family_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "link_type" "public"."contact_link_type" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_kind" "public"."contact_link_target_kind" DEFAULT 'unified_customer'::"public"."contact_link_target_kind" NOT NULL
);


ALTER TABLE "public"."contact_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_partner_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."project_status" DEFAULT 'planejado'::"public"."project_status",
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_partner_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "treatment_type" "public"."contact_treatment" DEFAULT 'direct'::"public"."contact_treatment" NOT NULL,
    "custom_treatment" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_title" "text",
    "department" "text",
    "decision_level" "public"."contact_decision_level",
    "responsible_user_id" "uuid",
    "responsible_department_id" "uuid",
    "email_primary" "text",
    "mobile_phone" "text",
    "landline_phone" "text",
    "messaging_whatsapp" boolean DEFAULT false NOT NULL,
    "messaging_telegram" boolean DEFAULT false NOT NULL,
    "messaging_phone" "text",
    "linkedin_url" "text",
    "city_id" "uuid",
    "address_street" "text",
    "address_number" "text",
    "address_complement" "text",
    "address_neighborhood" "text",
    "cep" "text"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_job_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'success'::"text",
    "details" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."cron_job_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."department_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_id" "uuid" NOT NULL,
    "page_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_permission" "public"."permission_level" DEFAULT 'ver_modificar'::"public"."permission_level",
    "director_permission" "public"."permission_level" DEFAULT 'ver_modificar'::"public"."permission_level",
    "hr_permission" "public"."permission_level" DEFAULT 'ver_modificar'::"public"."permission_level",
    "user_permission" "public"."permission_level" DEFAULT 'ver_somente'::"public"."permission_level",
    "leader_permission" "public"."permission_level" DEFAULT 'ver_modificar'::"public"."permission_level"
);


ALTER TABLE "public"."department_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "integrates_org_chart" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "document_root_enabled" boolean DEFAULT true NOT NULL,
    "document_root_folder_id" "uuid",
    "icon" "text" DEFAULT 'Building2'::"text" NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."departments"."icon" IS 'Lucide React icon name for the department (e.g., Users, Calculator, Briefcase)';



CREATE TABLE IF NOT EXISTS "public"."doc_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "section" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acl_hash" "text" NOT NULL,
    "lang" "text",
    "tokens" integer,
    "embedding" "public"."vector"(3072) NOT NULL,
    "modality" "text" DEFAULT 'text'::"text" NOT NULL,
    "source" "text",
    "word_count" integer,
    "embedding_type" "text" DEFAULT 'semantic'::"text",
    "extraction_source" "text" DEFAULT 'pdf_js'::"text",
    "page_number" integer,
    "structure_type" "text" DEFAULT 'paragraph'::"text",
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "bbox_coordinates" "jsonb",
    "parent_structure_id" "uuid",
    "table_metadata" "jsonb",
    "slide_number" integer,
    "semantic_description" "text",
    "extracted_objects" "text"[],
    "has_image_analysis" boolean DEFAULT false,
    "change_analysis" "text",
    CONSTRAINT "doc_chunks_confidence_score_check" CHECK ((("confidence_score" >= 0.0) AND ("confidence_score" <= 1.0))),
    CONSTRAINT "doc_chunks_modality_check" CHECK (("modality" = ANY (ARRAY['text'::"text", 'ocr'::"text", 'caption'::"text", 'semantic'::"text"])))
);


ALTER TABLE "public"."doc_chunks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."doc_chunks"."modality" IS 'Type of content: text (verbatim), ocr (extracted text), caption (AI description), semantic (AI summary/expansion)';



COMMENT ON COLUMN "public"."doc_chunks"."source" IS 'Source of the content: pdfjs, gcloud_vision, openai_gpt5, file, etc.';



COMMENT ON COLUMN "public"."doc_chunks"."word_count" IS 'Number of words in this chunk for analytics and optimization';



COMMENT ON COLUMN "public"."doc_chunks"."structure_type" IS 'Tipo de estrutura: paragraph, title, table, list, section, etc.';



COMMENT ON COLUMN "public"."doc_chunks"."confidence_score" IS 'Score de confiança do chunk (0.0-1.0)';



COMMENT ON COLUMN "public"."doc_chunks"."bbox_coordinates" IS 'Coordenadas bbox quando disponível {x, y, width, height}';



COMMENT ON COLUMN "public"."doc_chunks"."parent_structure_id" IS 'ID do chunk pai para hierarquia';



COMMENT ON COLUMN "public"."doc_chunks"."table_metadata" IS 'Metadata específica para tabelas {headers, rows, csv_data}';



CREATE TABLE IF NOT EXISTS "public"."document_access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "folder_id" "uuid" NOT NULL,
    "access_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_agent" "text",
    "ip_address" "text",
    CONSTRAINT "document_access_logs_access_type_check" CHECK (("access_type" = ANY (ARRAY['view'::"text", 'download'::"text"])))
);


ALTER TABLE "public"."document_access_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_version_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "section" "text",
    "chunk_type" "text" DEFAULT 'verbatim'::"text",
    "embeddings" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_version_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "storage_key" "text",
    "file_size" integer,
    "mime_type" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "rag_summary" "text",
    "chunk_count" integer DEFAULT 0
);


ALTER TABLE "public"."document_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "folder_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "file_url" "text",
    "file_size" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'Processando'::"text",
    "mime_type" "text",
    "storage_key" "text",
    "acl_hash" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "effective_date" "date" DEFAULT CURRENT_DATE,
    "expiry_date" "date",
    "version_number" integer DEFAULT 1,
    "version_notes" "text",
    "processing_auto_detect_language" boolean DEFAULT false,
    "processing_custom_language" "text",
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "rejection_reason" "text",
    "replacement_document_id" "uuid",
    "pending_type" "text",
    "description" "text",
    "file_type" "text",
    "reviewers" "uuid"[],
    "review_department_id" "uuid",
    "approval_mode" "text",
    "approvers" "uuid"[],
    "notify_before_expiry_days" integer,
    "page_count" integer,
    "rag_status" "text" DEFAULT 'not_processed'::"text",
    CONSTRAINT "documents_approval_mode_check" CHECK (("approval_mode" = ANY (ARRAY['single'::"text", 'any'::"text", 'all'::"text"]))),
    CONSTRAINT "documents_status_humanized_check" CHECK (("status" = ANY (ARRAY['Aprovado'::"text", 'Pendente de Revisão'::"text", 'Pendente de Aprovação'::"text", 'Rejeitado'::"text", 'Obsoleto'::"text", 'Processando'::"text"])))
);

ALTER TABLE ONLY "public"."documents" REPLICA IDENTITY FULL;


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."documents"."description" IS 'Descrição do documento inserida durante o processo de importação';



COMMENT ON COLUMN "public"."documents"."file_type" IS 'Tipo de arquivo selecionado na etapa 2 do wizard (pdf, word, excel, etc)';



COMMENT ON COLUMN "public"."documents"."reviewers" IS 'Array de UUIDs dos usuários selecionados como revisores';



COMMENT ON COLUMN "public"."documents"."review_department_id" IS 'ID do departamento selecionado para revisão';



COMMENT ON COLUMN "public"."documents"."approval_mode" IS 'Modo de aprovação: single (um aprovador), any (qualquer aprovador), all (todos os aprovadores)';



COMMENT ON COLUMN "public"."documents"."approvers" IS 'Array de UUIDs dos usuários selecionados como aprovadores';



COMMENT ON COLUMN "public"."documents"."notify_before_expiry_days" IS 'Número de dias antes do vencimento para notificar os revisores';



COMMENT ON COLUMN "public"."documents"."page_count" IS 'Number of pages in the document, extracted during processing';



CREATE TABLE IF NOT EXISTS "public"."economic_group_segments_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" integer NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."economic_group_segments_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_draft_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "draft_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_draft_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_draft_tags" (
    "draft_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_draft_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "subject" "text",
    "html" "text",
    "to_recipients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cc_recipients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "bcc_recipients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_signature_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "signature_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "microsoft_account_id" "uuid",
    "shared_mailbox_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_signature_targets_one_target_chk" CHECK (((("microsoft_account_id" IS NOT NULL) AND ("shared_mailbox_id" IS NULL)) OR (("microsoft_account_id" IS NULL) AND ("shared_mailbox_id" IS NOT NULL))))
);


ALTER TABLE "public"."email_signature_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Assinatura'::"text" NOT NULL,
    "html" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "record_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_by" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "record_type" "text" DEFAULT 'profile'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."field_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_id" "uuid" NOT NULL,
    "parent_folder_id" "uuid",
    "name" "text" NOT NULL,
    "status" "public"."folder_status" DEFAULT 'active'::"public"."folder_status" NOT NULL,
    "is_root" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_index" integer DEFAULT 0,
    "allow_delete" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."folders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."folders"."allow_delete" IS 'Determines if this folder can be deleted. If false, folder is protected from deletion across the entire system.';



CREATE OR REPLACE VIEW "public"."folder_descendant_counts" AS
 SELECT "f"."id",
    "count"("d"."id") AS "doc_count"
   FROM ("public"."folders" "f"
     LEFT JOIN "public"."documents" "d" ON (("d"."folder_id" = "f"."id")))
  GROUP BY "f"."id";


ALTER VIEW "public"."folder_descendant_counts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."folder_document_counts" AS
 SELECT "folder_id",
    "count"(*) AS "doc_count"
   FROM "public"."documents" "d"
  GROUP BY "folder_id";


ALTER VIEW "public"."folder_document_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text"
);


ALTER TABLE "public"."form_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_external_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."form_external_contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_external_contacts" IS 'Relacionamento entre formulários e contatos da base de Gestão de Contatos para destinatários externos';



COMMENT ON COLUMN "public"."form_external_contacts"."form_id" IS 'ID do formulário';



COMMENT ON COLUMN "public"."form_external_contacts"."contact_id" IS 'ID do contato da tabela contacts';



COMMENT ON COLUMN "public"."form_external_contacts"."created_by" IS 'Usuário que criou o relacionamento';



CREATE TABLE IF NOT EXISTS "public"."form_external_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "send_via_email" boolean DEFAULT false NOT NULL,
    "send_via_whatsapp" boolean DEFAULT false NOT NULL,
    "send_via_telegram" boolean DEFAULT false NOT NULL,
    "email_sent_at" timestamp with time zone,
    "email_opened_at" timestamp with time zone,
    "whatsapp_sent_at" timestamp with time zone,
    "telegram_sent_at" timestamp with time zone,
    "form_access_token" "text" NOT NULL,
    "responded_at" timestamp with time zone,
    "response_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_external_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_external_invitations" IS 'Gerencia convites enviados para contatos externos preencherem formulários, incluindo canais de comunicação e rastreamento de envios';



COMMENT ON COLUMN "public"."form_external_invitations"."form_id" IS 'ID do formulário para o qual o convite foi enviado';



COMMENT ON COLUMN "public"."form_external_invitations"."contact_id" IS 'ID do contato que recebeu o convite';



COMMENT ON COLUMN "public"."form_external_invitations"."send_via_email" IS 'Indica se o convite deve/foi enviado por email';



COMMENT ON COLUMN "public"."form_external_invitations"."send_via_whatsapp" IS 'Indica se o convite deve/foi enviado por WhatsApp';



COMMENT ON COLUMN "public"."form_external_invitations"."send_via_telegram" IS 'Indica se o convite deve/foi enviado por Telegram';



COMMENT ON COLUMN "public"."form_external_invitations"."form_access_token" IS 'Token único e seguro para acesso ao formulário sem autenticação';



COMMENT ON COLUMN "public"."form_external_invitations"."responded_at" IS 'Timestamp de quando o formulário foi respondido';



COMMENT ON COLUMN "public"."form_external_invitations"."response_id" IS 'Referência para a resposta submetida (form_responses)';



CREATE TABLE IF NOT EXISTS "public"."form_external_login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_lower" "text" NOT NULL,
    "ip_hash" "text" NOT NULL,
    "user_agent" "text",
    "form_id" "uuid",
    "success" boolean DEFAULT false NOT NULL,
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_external_login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_external_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_access" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "password_hash" "text"
);


ALTER TABLE "public"."form_external_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_external_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."form_external_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_publication_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_type" "text" DEFAULT 'publication'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "access_count" integer DEFAULT 0,
    "max_access_count" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."form_publication_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_response_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "response_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "progress_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_response_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "response_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitted_by" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."form_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "fields_definition" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "is_current" boolean DEFAULT false,
    "response_count" integer DEFAULT 0
);


ALTER TABLE "public"."form_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "allow_anonymous" boolean DEFAULT false NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "fields_definition" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "share_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "allowed_users" "uuid"[],
    "allowed_departments" "uuid"[],
    "allowed_roles" "text"[],
    "publication_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "publication_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "allows_anonymous_responses" boolean DEFAULT false,
    "version_number" integer DEFAULT 1,
    "parent_form_id" "uuid",
    "is_published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "internal_recipients" "jsonb" DEFAULT '[]'::"jsonb",
    "has_responses" boolean DEFAULT false,
    "publication_links" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "check_valid_publication_status" CHECK (("publication_status" = ANY (ARRAY['draft'::"text", 'published_internal'::"text", 'published_external'::"text", 'published_mixed'::"text", 'archived'::"text", 'task_usage'::"text"]))),
    CONSTRAINT "check_valid_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published_internal'::"text", 'published_external'::"text", 'published_mixed'::"text", 'archived'::"text", 'task_usage'::"text"])))
);


ALTER TABLE "public"."forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."microsoft_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ms_account_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."microsoft_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."microsoft_shared_mailboxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."microsoft_shared_mailboxes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ms_oauth_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "microsoft_account_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "scope" "text",
    "token_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ms_oauth_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "protheus_table_name" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "record_status" "text" NOT NULL,
    "notification_data" "jsonb" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "channels_used" "jsonb" NOT NULL
);


ALTER TABLE "public"."notification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ocr_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ocr_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ocr_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "page_number" integer NOT NULL,
    "model_used" "text" NOT NULL,
    "processing_time_ms" integer,
    "cost_estimate" numeric(8,6),
    "quality_score" numeric(3,2),
    "fallback_reason" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ocr_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "reset_type" "text" DEFAULT 'user_request'::"text" NOT NULL
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pending_access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "department" "text" NOT NULL,
    "department_id" "uuid",
    "notification_email" boolean DEFAULT true NOT NULL,
    "notification_app" boolean DEFAULT true NOT NULL,
    "notification_frequency" "text" DEFAULT 'instant'::"text" NOT NULL,
    "workflow_execution_id" "uuid",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "request_ip_hash" "text",
    "request_user_agent" "text",
    "supervisor_id" "uuid",
    "is_leader" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."pending_access_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "portal_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portal_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "stakeholder" "public"."portal_stakeholder" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "cache_type" "text" DEFAULT 'ocr'::"text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "cached_data" "jsonb" NOT NULL,
    "api_provider" "text",
    "file_size" bigint,
    "page_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "access_count" integer DEFAULT 1 NOT NULL,
    "last_accessed" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."processing_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "processing_session_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "total_pages" integer,
    "total_processing_time_ms" integer,
    "text_extraction_time_ms" integer,
    "ocr_processing_time_ms" integer,
    "embedding_time_ms" integer,
    "overall_quality_score" numeric(3,2),
    "ocr_confidence_avg" numeric(3,2),
    "pages_requiring_ocr" integer DEFAULT 0,
    "pages_native_text" integer DEFAULT 0,
    "cache_hits" integer DEFAULT 0,
    "cache_misses" integer DEFAULT 0,
    "processing_mode" "text",
    "early_stopping_triggered" boolean DEFAULT false,
    "adaptive_dpi_used" integer,
    "api_calls_made" "jsonb" DEFAULT '{}'::"jsonb",
    "estimated_cost_usd" numeric(10,4),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."processing_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "step_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "processing_steps_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "processing_steps_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."processing_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "department" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "department_id" "uuid",
    "is_leader" boolean DEFAULT false NOT NULL,
    "notification_email" boolean DEFAULT true NOT NULL,
    "notification_app" boolean DEFAULT true NOT NULL,
    "notification_frequency" "text" DEFAULT 'instant'::"text" NOT NULL,
    "notification_types" "jsonb" DEFAULT '{"changes": true, "chatter": true, "mentions": true, "assignments": true}'::"jsonb" NOT NULL,
    "employee_id" "uuid",
    "company_relationship" "text",
    "can_change_password" boolean DEFAULT true NOT NULL,
    "supervisor_id" "uuid",
    "created_by" "uuid",
    "notification_telegram" boolean DEFAULT false NOT NULL,
    "telegram_chat_id" "text",
    "telegram_username" "text",
    "telegram_setup_code" "text",
    "telegram_setup_code_expires_at" timestamp with time zone,
    "mfa_required" boolean DEFAULT false NOT NULL,
    "mfa_enforced_at" timestamp with time zone,
    "mfa_last_verified_at" timestamp with time zone,
    "trust_device_duration" integer DEFAULT 30,
    "max_trusted_devices" integer DEFAULT 5,
    "whatsapp_phone" "text",
    "whatsapp_verified" boolean DEFAULT false,
    "whatsapp_verification_code" "text",
    "whatsapp_verification_expires_at" timestamp with time zone,
    "whatsapp_chat_id" "text",
    "notification_whatsapp" boolean DEFAULT false,
    CONSTRAINT "profiles_notification_frequency_check" CHECK (("notification_frequency" = ANY (ARRAY['instant'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."company_relationship" IS 'Relationship with company when user is not an employee (e.g., client, partner, consultant, etc.)';



COMMENT ON COLUMN "public"."profiles"."supervisor_id" IS 'Referência ao supervisor imediato do usuário';



CREATE TABLE IF NOT EXISTS "public"."protheus_binary_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "supabase_table_name" "text" NOT NULL,
    "protheus_id" "text" NOT NULL,
    "field_name" "text" NOT NULL,
    "storage_bucket" "text" DEFAULT 'protheus-blobs'::"text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "sha256" "text",
    "downloaded_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."protheus_binary_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "connection_type" "text" DEFAULT 'aksell'::"text" NOT NULL,
    "aksell_config" "jsonb" DEFAULT '{"url": "", "apiKey": ""}'::"jsonb" NOT NULL,
    "totvs_config" "jsonb" DEFAULT '{"url": "", "apiKey": ""}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "oracle_proxy_code" "text" DEFAULT ''::"text",
    "endpoints_documentation" "jsonb" DEFAULT '{"security": {"restrictions": ["Apenas operações SELECT são permitidas", "Comandos DELETE, DROP, UPDATE, INSERT são bloqueados", "Múltiplas queries separadas por ; são proibidas"]}, "endpoints": [{"path": "/ping", "method": "GET", "response": "Oracle Proxy Online ✔️", "description": "Verifica status do servidor Oracle Proxy", "authentication": "Requer x-api-key header"}, {"path": "/consulta", "method": "GET", "response": "Array com A1_COD e A1_NOME da tabela SA1010", "description": "Consulta exemplo de clientes (primeiros 10 registros)", "authentication": "Requer x-api-key header"}, {"body": {"query": "SELECT statement"}, "path": "/sql", "method": "POST", "response": "Array com resultados da query", "description": "Executa queries SQL customizadas", "restrictions": ["Apenas SELECT permitido", "Proibido: DELETE, DROP, UPDATE, INSERT", "Não permite múltiplas queries (;)"], "authentication": "Requer x-api-key header"}], "authentication": {"type": "API Key", "header": "x-api-key", "description": "Chave de API necessária em todas as requisições"}}'::"jsonb",
    "oracle_schema" "text" DEFAULT ''::"text",
    CONSTRAINT "protheus_config_connection_type_check" CHECK (("connection_type" = ANY (ARRAY['aksell'::"text", 'totvs'::"text"])))
);

ALTER TABLE ONLY "public"."protheus_config" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_customer_group_units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "filial" "text" NOT NULL,
    "cod" "text" NOT NULL,
    "loja" "text" NOT NULL,
    "group_id" integer NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protheus_customer_group_units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_customer_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "filial" "text" NOT NULL,
    "cod" "text" NOT NULL,
    "group_key" "text" GENERATED ALWAYS AS ((("filial" || '|'::"text") || "cod")) STORED,
    "name" "text",
    "ai_suggested_name" "text",
    "name_source" "text" DEFAULT 'ai'::"text" NOT NULL,
    "unit_count" integer DEFAULT 0 NOT NULL,
    "vendors" "text"[],
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_grupo" integer NOT NULL,
    "nome_grupo_sugerido" "text"
);


ALTER TABLE "public"."protheus_customer_groups" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."protheus_customer_groups_id_grupo_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."protheus_customer_groups_id_grupo_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."protheus_customer_groups_id_grupo_seq" OWNED BY "public"."protheus_customer_groups"."id_grupo";



CREATE TABLE IF NOT EXISTS "public"."protheus_dynamic_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "supabase_table_name" "text" NOT NULL,
    "table_structure" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."protheus_dynamic_tables" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_dynamic_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_group_update_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "filial" "text" NOT NULL,
    "cod" "text" NOT NULL,
    "loja" "text" NOT NULL,
    "action" "text" NOT NULL,
    "group_id" integer NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "protheus_group_update_results_action_check" CHECK (("action" = ANY (ARRAY['created_group'::"text", 'assigned_to_existing'::"text"])))
);


ALTER TABLE "public"."protheus_group_update_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_group_update_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "triggered_by" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "new_groups_count" integer DEFAULT 0,
    "new_members_count" integer DEFAULT 0,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protheus_group_update_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sa1010_80f17f00" (
    "a1_filial" "text",
    "a1_cod" "text",
    "a1_loja" "text",
    "a1_nome" "text",
    "a1_pessoa" "text",
    "a1_nreduz" "text",
    "a1_tipo" "text",
    "a1_end" "text",
    "a1_complem" "text",
    "a1_bairro" "text",
    "a1_est" "text",
    "a1_cod_mun" "text",
    "a1_mun" "text",
    "a1_estado" "text",
    "a1_cep" "text",
    "a1_dscreg" "text",
    "a1_regiao" "text",
    "a1_naturez" "text",
    "a1_conta" "text",
    "a1_ibge" "text",
    "a1_ddd" "text",
    "a1_ddi" "text",
    "a1_tel" "text",
    "a1_tribfav" "text",
    "a1_fax" "text",
    "a1_cgc" "text",
    "a1_contato" "text",
    "a1_pfisica" "text",
    "a1_inscr" "text",
    "a1_telex" "text",
    "a1_inscrm" "text",
    "a1_endcob" "text",
    "a1_pais" "text",
    "a1_bairroc" "text",
    "a1_estc" "text",
    "a1_munc" "text",
    "a1_comis" bigint,
    "a1_cepc" "text",
    "a1_vend" "text",
    "a1_bco1" "text",
    "a1_bco2" "text",
    "a1_bco3" "text",
    "a1_bco4" "text",
    "a1_bco5" "text",
    "a1_transp" "text",
    "a1_tpfret" "text",
    "a1_desc" bigint,
    "a1_cond" "text",
    "a1_prior" "text",
    "a1_lc" bigint,
    "a1_risco" "text",
    "a1_venclc" "text",
    "a1_lcfin" bigint,
    "a1_classe" "text",
    "a1_moedalc" bigint,
    "a1_msaldo" bigint,
    "a1_mcompra" bigint,
    "a1_metr" bigint,
    "a1_pricom" "text",
    "a1_nrocom" bigint,
    "a1_ultcom" "text",
    "a1_temvis" bigint,
    "a1_formvis" "text",
    "a1_ultvis" "text",
    "a1_tmpvis" "text",
    "a1_tmpstd" "text",
    "a1_clasven" "text",
    "a1_saldup" bigint,
    "a1_mensage" "text",
    "a1_nropag" bigint,
    "a1_salpedl" bigint,
    "a1_suframa" "text",
    "a1_calcsuf" "text",
    "a1_recirrf" "text",
    "a1_atr" bigint,
    "a1_vacum" bigint,
    "a1_recinss" "text",
    "a1_reciss" "text",
    "a1_salped" bigint,
    "a1_titprot" bigint,
    "a1_inciss" "text",
    "a1_recpis" "text",
    "a1_chqdevo" bigint,
    "a1_reccofi" "text",
    "a1_matr" bigint,
    "a1_reccsll" "text",
    "a1_maidupl" bigint,
    "a1_transf" "text",
    "a1_saldupm" bigint,
    "a1_pagatr" bigint,
    "a1_cxposta" "text",
    "a1_dtultit" "text",
    "a1_dtulchq" "text",
    "a1_tabela" "text",
    "a1_aliqir" bigint,
    "a1_ativida" "text",
    "a1_cargo1" "text",
    "a1_cargo2" "text",
    "a1_salpedb" bigint,
    "a1_cargo3" "text",
    "a1_super" "text",
    "a1_rtec" "text",
    "a1_observ" "text",
    "a1_rg" "text",
    "a1_dtnasc" "text",
    "a1_clifat" "text",
    "a1_grptrib" "text",
    "a1_sativ1" "text",
    "a1_sativ2" "text",
    "a1_codpais" "text",
    "a1_codloc" "text",
    "a1_tpessoa" "text",
    "a1_tpissrs" "text",
    "a1_sativ3" "text",
    "a1_sativ4" "text",
    "a1_sativ5" "text",
    "a1_sativ6" "text",
    "a1_sativ7" "text",
    "a1_sativ8" "text",
    "a1_codmarc" "text",
    "a1_este" "text",
    "a1_codage" "text",
    "a1_comage" bigint,
    "a1_tipcli" "text",
    "a1_email" "text",
    "a1_dest_1" "text",
    "a1_dest_2" "text",
    "a1_codmun" "text",
    "a1_hpage" "text",
    "a1_dest_3" "text",
    "a1_cbo" "text",
    "a1_cnae" "text",
    "a1_condpag" "text",
    "a1_diaspag" bigint,
    "a1_obs" "text",
    "a1_agreg" "text",
    "a1_codhist" "text",
    "a1_tipper" "text",
    "a1_contab" "text",
    "a1_b2b" "text",
    "a1_salfin" bigint,
    "a1_grpven" "text",
    "a1_msblql" "text",
    "a1_salfinm" bigint,
    "a1_inscrur" "text",
    "a1_hrcad" "text",
    "a1_dtcad" "text",
    "a1_codseg" "text",
    "a1_clicnv" "text",
    "a1_numra" "text",
    "a1_subcod" "text",
    "a1_cdrdes" "text",
    "a1_clipri" "text",
    "a1_lojpri" "text",
    "a1_fildeb" "text",
    "a1_codfor" "text",
    "a1_situa" "text",
    "a1_abics" "text",
    "a1_tipocli" "text",
    "a1_vinculo" "text",
    "a1_dtiniv" "text",
    "a1_dtfimv" "text",
    "a1_hrtrans" "text",
    "a1_blemail" "text",
    "a1_unidven" "text",
    "a1_tipprfl" "text",
    "a1_prf_vld" "text",
    "a1_mune" "text",
    "a1_loccons" "text",
    "a1_codmune" "text",
    "a1_perfil" bigint,
    "a1_regpb" "text",
    "a1_usadda" "text",
    "a1_nif" "text",
    "a1_regesim" "text",
    "a1_prf_cod" "text",
    "a1_prf_obs" "bytea",
    "a1_tpreg" "text",
    "a1_indret" "text",
    "a1_simples" "text",
    "a1_msexp" "text",
    "a1_origem" "text",
    "a1_fretiss" "text",
    "a1_idhist" "text",
    "a1_reserve" "text",
    "a1_irbax" "text",
    "a1_ctare" "text",
    "a1_endent" "text",
    "a1_ipweb" "text",
    "a1_compent" "text",
    "a1_bairroe" "text",
    "a1_cepe" "text",
    "a1_codsiaf" "text",
    "a1_endrec" "text",
    "a1_percatm" bigint,
    "a1_ceinss" "text",
    "a1_endnot" "text",
    "a1_abatimp" "text",
    "a1_perfecp" bigint,
    "a1_userlga" "text",
    "a1_hrexpo" "text",
    "a1_outrmun" "text",
    "a1_userlgi" "text",
    "a1_recfmd" "text",
    "a1_rfasemt" "text",
    "a1_rimamt" "text",
    "a1_matfun" "text",
    "a1_simpnac" "text",
    "a1_prstser" "text",
    "a1_rfacs" "text",
    "a1_rfabov" "text",
    "a1_tpdp" "text",
    "a1_incltmg" "text",
    "a1_crdma" "text",
    "a1_entori" "text",
    "a1_chvcam" "text",
    "a1_codmemb" "text",
    "a1_alifixa" "text",
    "a1_codter" "text",
    "a1_tpmemb" "text",
    "a1_inovaut" "text",
    "a1_resfat" "text",
    "a1_imgumov" "text",
    "a1_tpcamp" "text",
    "a1_idestn" "text",
    "a1_iencont" "text",
    "a1_tpj" "text",
    "a1_issrslc" "text",
    "a1_origct" "text",
    "a1_codfid" "text",
    "a1_contrib" "text",
    "a1_filtrf" "text",
    "a1_tda" "text",
    "a1_nvestn" bigint,
    "a1_recfet" "text",
    "a1_fomezer" "text",
    "a1_incult" "text",
    "a1_minirf" "text",
    "a1_timekee" "text",
    "a1_entid" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" bigint,
    "r_e_c_d_e_l" bigint,
    "a1_zzctaad" "text",
    "a1_tpnfse" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "record_hash" "text",
    "teste_campo" "text",
    "codeloja" "text",
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_status" "public"."protheus_record_status" GENERATED ALWAYS AS (
CASE
    WHEN ("is_new_record" = true) THEN 'new'::"public"."protheus_record_status"
    WHEN ("was_updated_last_sync" = true) THEN 'updated'::"public"."protheus_record_status"
    ELSE 'unchanged'::"public"."protheus_record_status"
END) STORED,
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."protheus_sa1010_80f17f00" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sa1010_80f17f00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sa2010_72a51158" (
    "a2_filial" "text",
    "a2_cod" "text",
    "a2_loja" "text",
    "a2_nome" "text",
    "a2_nreduz" "text",
    "a2_end" "text",
    "a2_nr_end" "text",
    "a2_bairro" "text",
    "a2_est" "text",
    "a2_contpre" "text",
    "a2_estado" "text",
    "a2_cod_mun" "text",
    "a2_ibge" "text",
    "a2_mun" "text",
    "a2_cep" "text",
    "a2_tipo" "text",
    "a2_cx_post" "text",
    "a2_pfisica" "text",
    "a2_cgc" "text",
    "a2_ddi" "text",
    "a2_ddd" "text",
    "a2_tel" "text",
    "a2_fax" "text",
    "a2_inscr" "text",
    "a2_inscrm" "text",
    "a2_contato" "text",
    "a2_banco" "text",
    "a2_agencia" "text",
    "a2_numcon" "text",
    "a2_swift" "text",
    "a2_naturez" "text",
    "a2_transp" "text",
    "a2_prior" "text",
    "a2_risco" "text",
    "a2_cond" "text",
    "a2_lc" "text",
    "a2_matr" numeric,
    "a2_mcompra" numeric,
    "a2_metr" numeric,
    "a2_msaldo" numeric,
    "a2_nrocom" numeric,
    "a2_pricom" "text",
    "a2_ultcom" "text",
    "a2_saldup" numeric,
    "a2_desvio" numeric,
    "a2_saldupm" numeric,
    "a2_conta" "text",
    "a2_tiporur" "text",
    "a2_reciss" "text",
    "a2_pais" "text",
    "a2_depto" "text",
    "a2_id_fbfn" "text",
    "a2_status" "text",
    "a2_grupo" "text",
    "a2_ativida" "text",
    "a2_orig_1" "text",
    "a2_orig_2" "text",
    "a2_orig_3" "text",
    "a2_vincula" "text",
    "a2_repres" "text",
    "a2_repcont" "text",
    "a2_reprtel" "text",
    "a2_reprfax" "text",
    "a2_repr_em" "text",
    "a2_repr_en" "text",
    "a2_repbair" "text",
    "a2_reprmun" "text",
    "a2_represt" "text",
    "a2_reprcep" "text",
    "a2_reppais" "text",
    "a2_id_repr" "text",
    "a2_repr_ba" "text",
    "a2_repr_ag" "text",
    "a2_repr_co" "text",
    "a2_reprcgc" "text",
    "a2_ret_pai" "text",
    "a2_comi_so" "text",
    "a2_email" "text",
    "a2_hpage" "text",
    "a2_codmun" "text",
    "a2_contcom" "text",
    "a2_fabrica" "text",
    "a2_fatava" numeric,
    "a2_dtava" "text",
    "a2_dtval" "text",
    "a2_ok" "text",
    "a2_recinss" "text",
    "a2_telex" "text",
    "a2_tpessoa" "text",
    "a2_codloc" "text",
    "a2_codpais" "text",
    "a2_mnota" numeric,
    "a2_tpissrs" "text",
    "a2_paissub" "text",
    "a2_reccide" "text",
    "a2_grptrib" "text",
    "a2_unfedrp" "text",
    "a2_contab" "text",
    "a2_cliqf" "text",
    "a2_plgrupo" "text",
    "a2_codblo" "text",
    "a2_paisori" "text",
    "a2_royalty" "text",
    "a2_txtribu" numeric,
    "a2_b2b" "text",
    "a2_plcrres" "text",
    "a2_plfil" "text",
    "a2_siglcr" "text",
    "a2_conreg" "text",
    "a2_datblo" "text",
    "a2_plpedes" numeric,
    "a2_cbo" "text",
    "a2_cnae" "text",
    "a2_civil" "text",
    "a2_roymin" numeric,
    "a2_sativ1" "text",
    "a2_pagamen" "text",
    "a2_endcomp" "text",
    "a2_msblql" "text",
    "a2_grpdep" "text",
    "a2_subcod" "text",
    "a2_tipawb" "text",
    "a2_recsest" "text",
    "a2_fildeb" "text",
    "a2_recpis" "text",
    "a2_reccsll" "text",
    "a2_reccofi" "text",
    "a2_abics" "text",
    "a2_codfav" "text",
    "a2_lojfav" "text",
    "a2_numdep" numeric,
    "a2_calcirf" "text",
    "a2_vinculo" "text",
    "a2_dtiniv" "text",
    "a2_dtfimv" "text",
    "a2_codadm" "text",
    "a2_retisi" "text",
    "a2_isicm" "text",
    "a2_indrur" "text",
    "a2_uffic" "text",
    "a2_tpreg" "text",
    "a2_issrslc" "text",
    "a2_subcon" "text",
    "a2_rfasemt" "text",
    "a2_ccicms" "text",
    "a2_rimamt" "text",
    "a2_rfacs" "text",
    "a2_contrib" "text",
    "a2_tpcon" "text",
    "a2_rfabov" "text",
    "a2_nempr" "text",
    "a2_cpfirp" "text",
    "a2_grossir" "text",
    "a2_dedbspc" "text",
    "a2_recfmd" "text",
    "a2_codfi" "text",
    "a2_tpconta" "text",
    "a2_codinss" "text",
    "a2_tipcta" "text",
    "a2_regesim" "text",
    "a2_cprb" "text",
    "a2_cpomsp" "text",
    "a2_indcp" "text",
    "a2_drpexp" "text",
    "a2_incult" "text",
    "a2_tprntrc" "text",
    "a2_desport" "text",
    "a2_eqptac" "text",
    "a2_strntrc" "text",
    "a2_calcinp" "text",
    "a2_sitesbh" "text",
    "a2_resptri" "text",
    "a2_tplogr" "text",
    "a2_formpag" "text",
    "a2_impip" "text",
    "a2_cliente" "text",
    "a2_tpj" "text",
    "a2_inscmu" "text",
    "a2_simpnac" "text",
    "a2_numra" "text",
    "a2_codnit" "text",
    "a2_idhist" "text",
    "a2_dtconv" "text",
    "a2_ctare" "text",
    "a2_dtnasc" "text",
    "a2_nifex" "text",
    "a2_recfet" "text",
    "a2_paisex" "text",
    "a2_rfundes" "text",
    "a2_categ" "text",
    "a2_prstser" "text",
    "a2_ocorren" "text",
    "a2_catefd" "text",
    "a2_mjuridi" "text",
    "a2_munsc" "text",
    "a2_cpfrur" "text",
    "a2_tribfav" "text",
    "a2_telre" "text",
    "a2_numex" "text",
    "a2_dtfimr" "text",
    "a2_dtinir" "text",
    "a2_fretiss" "text",
    "a2_minirf" "text",
    "a2_breex" "text",
    "a2_estex" "text",
    "a2_filtrf" "text",
    "a2_msblqd" "text",
    "a2_incltmg" "text",
    "a2_trbex" "text",
    "a2_paggfe" "text",
    "a2_rntrc" "text",
    "a2_dtrntrc" "text",
    "a2_logex" "text",
    "a2_fomezer" "text",
    "a2_codsiaf" "text",
    "a2_complr" "text",
    "a2_baiex" "text",
    "a2_tprex" "text",
    "a2_posex" "text",
    "a2_cidex" "text",
    "a2_complem" "text",
    "a2_apolice" "text",
    "a2_fornema" "text",
    "a2_endnot" "text",
    "a2_motnif" "text",
    "a2_regpb" "text",
    "a2_minpub" "text",
    "a2_lojcli" "text",
    "a2_irprog" "text",
    "a2_inovaut" "text",
    "a2_nomresp" "text",
    "a2_tpent" "text",
    "a2_cargo" "text",
    "a2_locquit" "text",
    "a2_dvcta" "text",
    "a2_cgcex" "text",
    "a2_conffis" "text",
    "a2_dvage" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" numeric,
    "r_e_c_d_e_l" numeric,
    "a2_zzctaad" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);


ALTER TABLE "public"."protheus_sa2010_72a51158" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sa3010_fc3d70f6" (
    "a3_filial" "text",
    "a3_cod" "text",
    "a3_nome" "text",
    "a3_nreduz" "text",
    "a3_cgc" "text",
    "a3_end" "text",
    "a3_bairro" "text",
    "a3_mun" "text",
    "a3_est" "text",
    "a3_cep" "text",
    "a3_dddtel" "text",
    "a3_msblql" "text",
    "a3_tel" "text",
    "a3_fax" "text",
    "a3_tipo" "text",
    "a3_telex" "text",
    "a3_inscr" "text",
    "a3_inscrm" "text",
    "a3_email" "text",
    "a3_hpage" "text",
    "a3_codusr" "text",
    "a3_super" "text",
    "a3_geren" "text",
    "a3_fornece" "text",
    "a3_loja" "text",
    "a3_gerase2" "text",
    "a3_bco1" "text",
    "a3_regiao" "text",
    "a3_comis" bigint,
    "a3_alemiss" bigint,
    "a3_albaixa" bigint,
    "a3_icm" "text",
    "a3_unidad" "text",
    "a3_icmsret" "text",
    "a3_iss" "text",
    "a3_regsla" "text",
    "a3_ipi" "text",
    "a3_qtconta" bigint,
    "a3_frete" "text",
    "a3_grprep" "text",
    "a3_acrefin" "text",
    "a3_dia" bigint,
    "a3_ddd" "text",
    "a3_cargo" "text",
    "a3_perdesc" bigint,
    "a3_tipsup" "text",
    "a3_diarese" bigint,
    "a3_senha" "text",
    "a3_pedini" "text",
    "a3_pedfim" "text",
    "a3_cliini" "text",
    "a3_clifim" "text",
    "a3_proxped" "text",
    "a3_proxcli" "text",
    "a3_sinctaf" "text",
    "a3_fat_rh" "text",
    "a3_sincage" "text",
    "a3_grupsan" "text",
    "a3_sinccon" "text",
    "a3_depend" "text",
    "a3_perage" "text",
    "a3_pertaf" "text",
    "a3_pen_ali" bigint,
    "a3_tipvend" "text",
    "a3_timemin" "text",
    "a3_usucorp" "text",
    "a3_urlexg" "text",
    "a3_numra" "text",
    "a3_pais" "text",
    "a3_habsinc" "text",
    "a3_ddi" "text",
    "a3_cel" "text",
    "a3_admiss" "text",
    "a3_nvlstr" "text",
    "a3_nivel" bigint,
    "a3_lanexg" "text",
    "a3_piscof" "text",
    "a3_emacorp" "text",
    "a3_biagend" "text",
    "a3_bitaref" "text",
    "a3_bicont" "text",
    "a3_dtumov" "text",
    "a3_hrumov" "text",
    "a3_msexp" "text",
    "a3_hrexpo" "text",
    "a3_baseir" "text",
    "a3_codiss" "text",
    "a3_filfun" "text",
    "a3_userlgi" "text",
    "a3_userlga" "text",
    "a3_modtrf" "text",
    "a3_hand" "text",
    "a3_snaexg" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" bigint,
    "r_e_c_d_e_l" bigint,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone,
    "record_status" "public"."protheus_record_status" GENERATED ALWAYS AS (
CASE
    WHEN ("pending_deletion" = true) THEN 'deleted'::"public"."protheus_record_status"
    WHEN ("is_new_record" = true) THEN 'new'::"public"."protheus_record_status"
    WHEN ("was_updated_last_sync" = true) THEN 'updated'::"public"."protheus_record_status"
    ELSE 'unchanged'::"public"."protheus_record_status"
END) STORED
);

ALTER TABLE ONLY "public"."protheus_sa3010_fc3d70f6" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sa3010_fc3d70f6" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sa4010_ea26a13a" (
    "a4_filial" "text",
    "a4_cod" "text",
    "a4_nome" "text",
    "a4_nreduz" "text",
    "a4_cgc" "text",
    "a4_end" "text",
    "a4_bairro" "text",
    "a4_complem" "text",
    "a4_est" "text",
    "a4_cod_mun" "text",
    "a4_mun" "text",
    "a4_cep" "text",
    "a4_ddi" "text",
    "a4_via" "text",
    "a4_ddd" "text",
    "a4_tel" "text",
    "a4_insest" "text",
    "a4_email" "text",
    "a4_hpage" "text",
    "a4_contato" "text",
    "a4_telex" "text",
    "a4_estfis" "text",
    "a4_endpad" "text",
    "a4_local" "text",
    "a4_ratfre" "text",
    "a4_fomezer" "text",
    "a4_suframa" "text",
    "a4_codpais" "text",
    "a4_tptrans" "text",
    "a4_colig" "text",
    "a4_inscrm" "text",
    "a4_endnot" "text",
    "a4_antt" "text",
    "a4_idetiq" "text",
    "a4_ecservi" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" bigint,
    "r_e_c_d_e_l" bigint,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "record_status" "public"."protheus_record_status" GENERATED ALWAYS AS (
CASE
    WHEN ("is_new_record" = true) THEN 'new'::"public"."protheus_record_status"
    WHEN ("was_updated_last_sync" = true) THEN 'updated'::"public"."protheus_record_status"
    ELSE 'unchanged'::"public"."protheus_record_status"
END) STORED,
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."protheus_sa4010_ea26a13a" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sa4010_ea26a13a" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sa5010_6d3daa8e" (
    "a5_filial" "text",
    "a5_fornece" "text",
    "a5_loja" "text",
    "a5_nomefor" "text",
    "a5_produto" "text",
    "a5_nomprod" "text",
    "a5_refgrd" "text",
    "a5_codprf" "text",
    "a5_desref" "text",
    "a5_quant01" numeric,
    "a5_quant02" numeric,
    "a5_quant03" numeric,
    "a5_quant04" numeric,
    "a5_quant05" numeric,
    "a5_quant06" numeric,
    "a5_quant07" numeric,
    "a5_quant08" numeric,
    "a5_quant09" numeric,
    "a5_quant10" numeric,
    "a5_quant11" numeric,
    "a5_quant12" numeric,
    "a5_preco01" numeric,
    "a5_preco02" numeric,
    "a5_preco03" numeric,
    "a5_preco04" numeric,
    "a5_preco05" numeric,
    "a5_preco06" numeric,
    "a5_preco07" numeric,
    "a5_preco08" numeric,
    "a5_preco09" numeric,
    "a5_preco10" numeric,
    "a5_preco11" numeric,
    "a5_preco12" numeric,
    "a5_cond01" "text",
    "a5_cond02" "text",
    "a5_cond03" "text",
    "a5_cond04" "text",
    "a5_cond05" "text",
    "a5_cond06" "text",
    "a5_cond07" "text",
    "a5_cond08" "text",
    "a5_cond09" "text",
    "a5_cond10" "text",
    "a5_cond11" "text",
    "a5_cond12" "text",
    "a5_dtcom01" "text",
    "a5_dtcom02" "text",
    "a5_dtcom03" "text",
    "a5_dtcom04" "text",
    "a5_dtcom05" "text",
    "a5_dtcom06" "text",
    "a5_dtcom07" "text",
    "a5_dtcom08" "text",
    "a5_dtcom09" "text",
    "a5_dtcom10" "text",
    "a5_dtcom11" "text",
    "a5_dtcom12" "text",
    "a5_skiplot" numeric,
    "a5_entrega" numeric,
    "a5_nota" numeric,
    "a5_status" "text",
    "a5_fabr" "text",
    "a5_faloja" "text",
    "a5_moe_us" "text",
    "a5_vlcotus" numeric,
    "a5_lead_t" numeric,
    "a5_qt_cot" numeric,
    "a5_ult_ent" "text",
    "a5_ult_fob" numeric,
    "a5_lotemin" numeric,
    "a5_lotemul" numeric,
    "a5_partopc" "text",
    "a5_unid" "text",
    "a5_peso" numeric,
    "a5_situ" "text",
    "a5_skplot" "text",
    "a5_riai" "text",
    "a5_dtriai" "text",
    "a5_valriai" "text",
    "a5_templim" numeric,
    "a5_plam1" "text",
    "a5_nivel1" "text",
    "a5_nqa1" "text",
    "a5_plam2" "text",
    "a5_nivel2" "text",
    "a5_nqa2" "text",
    "a5_fabrev" "text",
    "a5_atual" "text",
    "a5_chave" "text",
    "a5_tipatu" "text",
    "a5_incoter" "text",
    "a5_tr_cost" numeric,
    "a5_codprca" "text",
    "a5_codbar" "text",
    "a5_tipocot" "text",
    "a5_temptra" numeric,
    "a5_codtab" "text",
    "a5_ccusto" "text",
    "a5_entsit" numeric,
    "a5_diassit" numeric,
    "a5_tesbp" "text",
    "a5_umnfe" "text",
    "a5_pe" numeric,
    "a5_tipe" "text",
    "a5_codfis" "text",
    "a5_ncmprf" "text",
    "a5_descprf" "text",
    "a5_cno" "text",
    "a5_toledif" numeric,
    "a5_volmax" numeric,
    "a5_tescp" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" numeric,
    "r_e_c_d_e_l" numeric,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);


ALTER TABLE "public"."protheus_sa5010_6d3daa8e" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sb1010_b0316113" (
    "b1_filial" "text",
    "b1_cod" "text",
    "b1_desc" "text",
    "b1_tipo" "text",
    "b1_codite" "text",
    "b1_um" "text",
    "b1_locpad" "text",
    "b1_grupo" "text",
    "b1_picm" numeric,
    "b1_ipi" numeric,
    "b1_posipi" "text",
    "b1_especie" "text",
    "b1_ex_ncm" "text",
    "b1_ex_nbm" "text",
    "b1_aliqiss" numeric,
    "b1_codiss" "text",
    "b1_te" "text",
    "b1_ts" "text",
    "b1_picmret" numeric,
    "b1_picment" numeric,
    "b1_impzfrc" "text",
    "b1_bitmap" "text",
    "b1_segum" "text",
    "b1_conv" numeric,
    "b1_tipconv" "text",
    "b1_alter" "text",
    "b1_qe" numeric,
    "b1_prv1" numeric,
    "b1_emin" numeric,
    "b1_custd" numeric,
    "b1_ucalstd" "text",
    "b1_uprc" numeric,
    "b1_mcustd" "text",
    "b1_ucom" "text",
    "b1_peso" numeric,
    "b1_estseg" numeric,
    "b1_estfor" "text",
    "b1_forprz" "text",
    "b1_pe" numeric,
    "b1_tipe" "text",
    "b1_le" numeric,
    "b1_lm" numeric,
    "b1_conta" "text",
    "b1_toler" numeric,
    "b1_cc" "text",
    "b1_itemcc" "text",
    "b1_familia" "text",
    "b1_qb" numeric,
    "b1_proc" "text",
    "b1_lojproc" "text",
    "b1_apropri" "text",
    "b1_tipodec" "text",
    "b1_origem" "text",
    "b1_clasfis" "text",
    "b1_fantasm" "text",
    "b1_rastro" "text",
    "b1_urev" "text",
    "b1_datref" "text",
    "b1_foraest" "text",
    "b1_comis" numeric,
    "b1_mono" "text",
    "b1_dtrefp1" "text",
    "b1_perinv" numeric,
    "b1_grtrib" "text",
    "b1_mrp" "text",
    "b1_prvalid" numeric,
    "b1_notamin" numeric,
    "b1_numcop" numeric,
    "b1_conini" "text",
    "b1_contsoc" "text",
    "b1_irrf" "text",
    "b1_codbar" "text",
    "b1_codgtin" "text",
    "b1_grade" "text",
    "b1_formlot" "text",
    "b1_localiz" "text",
    "b1_fpcod" "text",
    "b1_operpad" "text",
    "b1_desc_p" "text",
    "b1_contrat" "text",
    "b1_desc_gi" "text",
    "b1_desc_i" "text",
    "b1_vlrefus" numeric,
    "b1_import" "text",
    "b1_anuente" "text",
    "b1_opc" "text",
    "b1_codobs" "text",
    "b1_sitprod" "text",
    "b1_fabric" "text",
    "b1_modelo" "text",
    "b1_setor" "text",
    "b1_balanca" "text",
    "b1_tecla" "text",
    "b1_prodpai" "text",
    "b1_tipocq" "text",
    "b1_solicit" "text",
    "b1_quadpro" "text",
    "b1_base3" "text",
    "b1_desbse3" "text",
    "b1_agregcu" "text",
    "b1_grupcom" "text",
    "b1_despimp" "text",
    "b1_numcqpr" numeric,
    "b1_contcqp" numeric,
    "b1_revatu" "text",
    "b1_codemb" "text",
    "b1_inss" "text",
    "b1_especif" "text",
    "b1_mat_pri" "text",
    "b1_nalncca" "text",
    "b1_redinss" numeric,
    "b1_nalsh" "text",
    "b1_aladi" "text",
    "b1_redirrf" numeric,
    "b1_tab_ipi" "text",
    "b1_grudes" "text",
    "b1_redpis" numeric,
    "b1_redcof" numeric,
    "b1_datasub" "text",
    "b1_pcsll" numeric,
    "b1_pcofins" numeric,
    "b1_ppis" numeric,
    "b1_mtbf" numeric,
    "b1_mttr" numeric,
    "b1_flagsug" "text",
    "b1_classve" "text",
    "b1_midia" "text",
    "b1_qtmidia" numeric,
    "b1_vlr_ipi" numeric,
    "b1_envobr" "text",
    "b1_qtdser" "text",
    "b1_serie" "text",
    "b1_faixas" numeric,
    "b1_nropag" numeric,
    "b1_isbn" "text",
    "b1_titorig" "text",
    "b1_lingua" "text",
    "b1_edicao" "text",
    "b1_obsisbn" "text",
    "b1_afamad" numeric,
    "b1_clvl" "text",
    "b1_ativo" "text",
    "b1_emax" numeric,
    "b1_pesbru" numeric,
    "b1_tipcar" "text",
    "b1_fracper" numeric,
    "b1_vlr_icm" numeric,
    "b1_int_icm" numeric,
    "b1_vlrselo" numeric,
    "b1_codnor" "text",
    "b1_corpri" "text",
    "b1_corsec" "text",
    "b1_nicone" "text",
    "b1_atrib1" "text",
    "b1_atrib2" "text",
    "b1_atrib3" "text",
    "b1_regseq" "text",
    "b1_cpotenc" "text",
    "b1_potenci" numeric,
    "b1_qtdacum" numeric,
    "b1_qtdinic" numeric,
    "b1_requis" "text",
    "b1_selo" "text",
    "b1_lotven" numeric,
    "b1_ok" "text",
    "b1_usafefo" "text",
    "b1_iat" "text",
    "b1_ippt" "text",
    "b1_cnatrec" "text",
    "b1_tnatrec" "text",
    "b1_afasemt" numeric,
    "b1_terum" "text",
    "b1_aimamt" numeric,
    "b1_afundes" numeric,
    "b1_dcrii" numeric,
    "b1_pmicnut" numeric,
    "b1_dcr" "text",
    "b1_dcre" "text",
    "b1_fustf" "text",
    "b1_dci" "text",
    "b1_coefdcr" numeric,
    "b1_cccusto" "text",
    "b1_dtfimnt" "text",
    "b1_verean" "text",
    "b1_msblql" "text",
    "b1_dtcorte" "text",
    "b1_parcei" "text",
    "b1_uvlrc" numeric,
    "b1_classe" "text",
    "b1_pmacnut" numeric,
    "b1_valepre" "text",
    "b1_tpprod" "text",
    "b1_grpnatr" "text",
    "b1_pis" "text",
    "b1_chassi" "text",
    "b1_umoec" numeric,
    "b1_vlcif" numeric,
    "b1_tipobn" "text",
    "b1_refbas" "text",
    "b1_markup" numeric,
    "b1_talla" "text",
    "b1_tpreg" "text",
    "b1_vlr_pis" numeric,
    "b1_afabov" numeric,
    "b1_difcnae" "text",
    "b1_codqad" "text",
    "b1_cest" "text",
    "b1_grpcst" "text",
    "b1_hrexpo" "text",
    "b1_gccusto" "text",
    "b1_gdodif" "text",
    "b1_escripi" "text",
    "b1_codproc" "text",
    "b1_userlga" "text",
    "b1_userlgi" "text",
    "b1_integ" "text",
    "b1_apopro" "text",
    "b1_cricms" "text",
    "b1_fecp" numeric,
    "b1_mopc" "bytea",
    "b1_qbp" numeric,
    "b1_lotesbp" numeric,
    "b1_vigenc" "text",
    "b1_prodsbp" "text",
    "b1_sittrib" "text",
    "b1_porcprl" "text",
    "b1_afethab" numeric,
    "b1_cargae" "text",
    "b1_impncm" numeric,
    "b1_cfema" numeric,
    "b1_fecpba" numeric,
    "b1_pautfet" numeric,
    "b1_pafmd5" "text",
    "b1_seloen" "text",
    "b1_ricm65" "text",
    "b1_princmg" numeric,
    "b1_codlan" "text",
    "b1_cfems" "text",
    "b1_cfem" "text",
    "b1_alfecrn" numeric,
    "b1_garant" "text",
    "b1_ajudif" "text",
    "b1_cofins" "text",
    "b1_csll" "text",
    "b1_afacs" numeric,
    "b1_fretiss" "text",
    "b1_admin" "text",
    "b1_tribmun" "text",
    "b1_prfdsul" numeric,
    "b1_pergart" numeric,
    "b1_alfumac" numeric,
    "b1_vlr_cof" numeric,
    "b1_retoper" "text",
    "b1_cnae" "text",
    "b1_prodrec" "text",
    "b1_fecop" "text",
    "b1_codant" "text",
    "b1_crdest" numeric,
    "b1_idhist" "text",
    "b1_cricmst" "text",
    "b1_grpti" "text",
    "b1_crdpres" numeric,
    "b1_tpdp" "text",
    "b1_msexp" "text",
    "b1_rprodep" "text",
    "b1_tfethab" "text",
    "b1_rsativo" "text",
    "b1_regriss" "text",
    "b1_regesim" "text",
    "b1_meples" "text",
    "b1_ivaaju" "text",
    "b1_base" "text",
    "b1_estrori" "text",
    "b1_desbse2" "text",
    "b1_fethab" "text",
    "b1_base2" "text",
    "b1_color" "text",
    "b1_alfecst" numeric,
    "b1_tipvec" "text",
    "b1_prn944i" "text",
    "b1_alfecop" numeric,
    "b1_prdori" "text",
    "b1_calcfet" "text",
    "b1_pr43080" numeric,
    "d_e_l_e_t" "text",
    "r_e_c_n_o" numeric,
    "r_e_c_d_e_l" numeric,
    "b1_zzgrctb" "text",
    "b1_zzmen1" "text",
    "b1_zzlote" "text",
    "b1_zzmens" "text",
    "b1_zzgrau" "text",
    "b1_zzclass" "text",
    "b1_zzdeses" "text",
    "b1_zzdesin" "text",
    "b1_zzperig" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);


ALTER TABLE "public"."protheus_sb1010_b0316113" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sds010_f444bb4c" (
    "ds_filial" "text",
    "ds_tipo" "text",
    "ds_doc" "text",
    "ds_serie" "text",
    "ds_fornec" "text",
    "ds_loja" "text",
    "ds_cnpj" "text",
    "ds_emissa" "text",
    "ds_formul" "text",
    "ds_especi" "text",
    "ds_est" "text",
    "ds_status" "text",
    "ds_arquivo" "text",
    "ds_userimp" "text",
    "ds_dataimp" "text",
    "ds_horaimp" "text",
    "ds_userpre" "text",
    "ds_datapre" "text",
    "ds_horapre" "text",
    "ds_chavenf" "text",
    "ds_versao" "text",
    "ds_frete" numeric,
    "ds_seguro" numeric,
    "ds_despesa" numeric,
    "ds_descont" numeric,
    "ds_transp" "text",
    "ds_placa" "text",
    "ds_pliqui" numeric,
    "ds_pbruto" numeric,
    "ds_especi1" "text",
    "ds_especi2" "text",
    "ds_volume1" numeric,
    "ds_especi3" "text",
    "ds_tpfrete" "text",
    "ds_especi4" "text",
    "ds_valmerc" numeric,
    "ds_volume2" numeric,
    "ds_volume3" numeric,
    "ds_volume4" numeric,
    "ds_doclog" "bytea",
    "ds_ok" "text",
    "ds_baseicm" numeric,
    "ds_valicm" numeric,
    "ds_modal" "text",
    "ds_tpcte" "text",
    "ds_sereltr" "text",
    "ds_nfeletr" "text",
    "ds_ufdestr" "text",
    "ds_chvnfor" "text",
    "ds_valpedg" numeric,
    "ds_numrps" "text",
    "ds_sdoc" "text",
    "ds_hornfe" "text",
    "ds_uforitr" "text",
    "ds_mudestr" "text",
    "ds_total" numeric,
    "ds_muoritr" "text",
    "ds_codnfe" "text",
    "ds_clalot" "text",
    "ds_naturez" "text",
    "ds_cond" "text",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" numeric,
    "r_e_c_d_e_l" numeric,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);


ALTER TABLE "public"."protheus_sds010_f444bb4c" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_supplier_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "filial" "text" NOT NULL,
    "cod" "text" NOT NULL,
    "group_key" "text" GENERATED ALWAYS AS ((("filial" || '|'::"text") || "cod")) STORED,
    "name" "text",
    "ai_suggested_name" "text",
    "name_source" "text" DEFAULT 'ai'::"text" NOT NULL,
    "unit_count" integer DEFAULT 0 NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protheus_supplier_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_supplier_material_types_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "material_type" "public"."material_supply_type" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protheus_supplier_material_types_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sy1010_3249e97a" (
    "y1_filial" "text",
    "y1_cod" "text",
    "y1_user" "text",
    "y1_nome" "text",
    "y1_tel" "text",
    "y1_fax" "text",
    "y1_email" "text",
    "y1_graprov" "text",
    "y1_pedido" "text",
    "y1_grupcom" "text",
    "y1_graprcp" "text",
    "y1_accid" "text",
    "y1_solcom" "bytea",
    "d_e_l_e_t" "text",
    "r_e_c_n_o" numeric,
    "r_e_c_d_e_l" numeric,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_new_record" boolean DEFAULT false NOT NULL,
    "previous_record_hash" "text",
    "was_updated_last_sync" boolean DEFAULT false NOT NULL,
    "last_sync_id" "uuid",
    "last_synced_at" timestamp with time zone,
    "record_hash" "text",
    "pending_deletion" boolean DEFAULT false NOT NULL,
    "pending_deletion_at" timestamp with time zone
);


ALTER TABLE "public"."protheus_sy1010_3249e97a" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sync_deletions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "supabase_table_name" "text" NOT NULL,
    "protheus_id" "text" NOT NULL,
    "deleted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sync_log_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);

ALTER TABLE ONLY "public"."protheus_sync_deletions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sync_deletions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_sync_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sync_log_id" "uuid" NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "record_data" "jsonb" NOT NULL,
    "error_type" "text" NOT NULL,
    "error_message" "text" NOT NULL,
    "error_details" "jsonb" DEFAULT '{}'::"jsonb",
    "protheus_key_fields" "jsonb" NOT NULL,
    "attempt_number" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text"
);

ALTER TABLE ONLY "public"."protheus_sync_errors" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sync_errors" OWNER TO "postgres";


COMMENT ON TABLE "public"."protheus_sync_errors" IS 'Registra erros específicos que ocorrem durante a sincronização de dados do Protheus';



COMMENT ON COLUMN "public"."protheus_sync_errors"."sync_log_id" IS 'Referência ao log de sincronização onde o erro ocorreu';



COMMENT ON COLUMN "public"."protheus_sync_errors"."record_data" IS 'Dados completos do registro que falhou na inserção';



COMMENT ON COLUMN "public"."protheus_sync_errors"."error_type" IS 'Tipo do erro: duplicate_key, validation_error, constraint_violation, etc.';



COMMENT ON COLUMN "public"."protheus_sync_errors"."protheus_key_fields" IS 'Campos que formam a chave única no Protheus (ex: A1_FILIAL, A1_COD, A1_LOJA)';



COMMENT ON COLUMN "public"."protheus_sync_errors"."attempt_number" IS 'Número da tentativa de inserção (para reprocessamento)';



CREATE TABLE IF NOT EXISTS "public"."protheus_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "sync_type" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "records_processed" integer DEFAULT 0,
    "records_created" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_deleted" integer DEFAULT 0,
    "total_records" integer DEFAULT 0,
    "error_message" "text",
    "sync_details" "jsonb" DEFAULT '{}'::"jsonb",
    "execution_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "executed_for_schedule" "text"
);

ALTER TABLE ONLY "public"."protheus_sync_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_table_extra_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protheus_table_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "default_value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_to_supabase" boolean,
    "applied_at" timestamp with time zone,
    "compute_mode" "text" DEFAULT 'none'::"text" NOT NULL,
    "compute_expression" "text",
    "compute_separator" "text" DEFAULT ''::"text",
    "compute_options" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);

ALTER TABLE ONLY "public"."protheus_table_extra_fields" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_table_extra_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_table_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_table_id" "uuid" NOT NULL,
    "target_table_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "join_fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    CONSTRAINT "protheus_table_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['1:N'::"text", 'N:1'::"text", 'N:N'::"text"])))
);

ALTER TABLE ONLY "public"."protheus_table_relationships" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_table_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protheus_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "query_interval_value" integer DEFAULT 60 NOT NULL,
    "query_interval_unit" "text" DEFAULT 'minutes'::"text" NOT NULL,
    "fetch_all_fields" boolean DEFAULT true NOT NULL,
    "create_supabase_table" boolean DEFAULT false NOT NULL,
    "extra_database_fields" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "enable_sha256_hash" boolean DEFAULT false NOT NULL,
    "log_hash_changes" boolean DEFAULT false NOT NULL,
    "detect_new_records" boolean DEFAULT false NOT NULL,
    "detect_deleted_records" boolean DEFAULT false NOT NULL,
    "key_fields" "text" DEFAULT ''::"text" NOT NULL,
    "selected_fields" "text"[],
    "sync_type" "text" DEFAULT 'interval'::"text",
    "sync_schedule" "jsonb" DEFAULT '[]'::"jsonb",
    "cron_expression" "text",
    "linked_outside_protheus" boolean DEFAULT false NOT NULL,
    "next_due_at" timestamp with time zone,
    "binary_fields_config" "jsonb",
    CONSTRAINT "protheus_tables_query_interval_unit_check" CHECK (("query_interval_unit" = ANY (ARRAY['seconds'::"text", 'minutes'::"text", 'hours'::"text", 'days'::"text"]))),
    CONSTRAINT "protheus_tables_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['interval'::"text", 'schedule'::"text", 'cron'::"text"])))
);

ALTER TABLE ONLY "public"."protheus_tables" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_tables" OWNER TO "postgres";


COMMENT ON COLUMN "public"."protheus_tables"."key_fields" IS 'Campos chave da tabela Protheus separados por + (ex: A1_FILIAL+A1_COD+A1_LOJA)';



CREATE TABLE IF NOT EXISTS "public"."protheus_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "config_id" "uuid" NOT NULL,
    "endpoint_used" "text" NOT NULL,
    "request_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "response_status" "text" NOT NULL,
    "response_data" "jsonb" DEFAULT '{}'::"jsonb",
    "response_time_ms" integer,
    "error_message" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."protheus_usage_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."protheus_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_economic_group_material_types" (
    "group_id" integer NOT NULL,
    "material_type_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_economic_group_material_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_economic_group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" integer NOT NULL,
    "unified_supplier_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."purchases_economic_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_economic_groups" (
    "id_grupo" integer NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name" "text",
    "ai_suggested_name" "text",
    "name_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "assigned_buyer_cod" "text",
    "assigned_buyer_filial" "text",
    "protheus_filial" "text",
    "protheus_cod" "text"
);


ALTER TABLE "public"."purchases_economic_groups" OWNER TO "postgres";


ALTER TABLE "public"."purchases_economic_groups" ALTER COLUMN "id_grupo" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."purchases_economic_groups_id_grupo_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchases_material_type_buyer_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_type_id" "uuid" NOT NULL,
    "buyer_code" "text" NOT NULL,
    "buyer_filial" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_material_type_buyer_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_material_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "designated_buyer_code" "text",
    "designated_buyer_filial" "text"
);


ALTER TABLE "public"."purchases_material_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_potential_supplier_material_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "material_type_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_potential_supplier_material_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_potential_supplier_tags" (
    "supplier_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_potential_supplier_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."purchases_potential_suppliers_pf_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchases_potential_suppliers_pf_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_potential_suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "trade_name" "text" NOT NULL,
    "legal_name" "text",
    "cnpj" "text",
    "website" "text",
    "city_id" "uuid",
    "assigned_buyer_cod" "text",
    "assigned_buyer_filial" "text",
    "material_types" "public"."material_supply_type"[] DEFAULT '{}'::"public"."material_supply_type"[] NOT NULL,
    "source_channel" "public"."supplier_source_channel",
    "source_subchannel" "public"."supplier_source_subchannel",
    "source_detail" "text",
    "attendance_type" "text" DEFAULT 'direct'::"text" NOT NULL,
    "representative_id" "uuid",
    "pf_number" integer DEFAULT "nextval"('"public"."purchases_potential_suppliers_pf_number_seq"'::"regclass") NOT NULL,
    "pf_code" "text" GENERATED ALWAYS AS (('PF-'::"text" || ("pf_number")::"text")) STORED,
    CONSTRAINT "purchases_potential_suppliers_attendance_type_check" CHECK (("attendance_type" = ANY (ARRAY['direct'::"text", 'representative'::"text"])))
);


ALTER TABLE "public"."purchases_potential_suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_supplier_group_material_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "material_type_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_supplier_group_material_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_unified_supplier_material_types" (
    "supplier_id" "uuid" NOT NULL,
    "material_type_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_unified_supplier_material_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_unified_supplier_tags" (
    "supplier_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases_unified_supplier_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."purchases_unified_suppliers_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchases_unified_suppliers_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases_unified_suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."unified_supplier_status" DEFAULT 'potential_only'::"public"."unified_supplier_status" NOT NULL,
    "potential_supplier_id" "uuid",
    "protheus_filial" "text",
    "protheus_cod" "text",
    "protheus_loja" "text",
    "economic_group_id" "uuid",
    "cnpj" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attendance_type" "text" DEFAULT 'direct'::"text" NOT NULL,
    "representative_id" "uuid",
    "assigned_buyer_cod" "text",
    "assigned_buyer_filial" "text",
    "fu_id" "text" DEFAULT ('FU-'::"text" || "lpad"(("nextval"('"public"."purchases_unified_suppliers_seq"'::"regclass"))::"text", 6, '0'::"text")) NOT NULL,
    "has_economic_group" boolean DEFAULT false NOT NULL,
    CONSTRAINT "purchases_unified_suppliers_attendance_type_chk" CHECK (("attendance_type" = ANY (ARRAY['direct'::"text", 'representative'::"text"]))),
    CONSTRAINT "purchases_unified_suppliers_has_source" CHECK ((("potential_supplier_id" IS NOT NULL) OR (("protheus_filial" IS NOT NULL) AND ("protheus_cod" IS NOT NULL) AND ("protheus_loja" IS NOT NULL))))
);


ALTER TABLE "public"."purchases_unified_suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."record_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_with" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "record_name" "text" NOT NULL,
    "permissions" "text"[] DEFAULT ARRAY['view'::"text"] NOT NULL,
    "shared_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "expiry_condition" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."record_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_lead_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_lead_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_leads_lead_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_leads_lead_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade_name" "text" NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "legal_name" "text",
    "cnpj" "text",
    "economic_group_id" integer,
    "city_id" "uuid",
    "source_channel" "public"."lead_source_channel",
    "source_subchannel" "text",
    "referral_name" "text",
    "assigned_vendor_cod" "text",
    "assigned_vendor_filial" "text",
    "website" "text",
    "attendance_type" "text" DEFAULT 'direct'::"text",
    "representative_id" "uuid",
    "lead_number" bigint DEFAULT "nextval"('"public"."sales_leads_lead_number_seq"'::"regclass") NOT NULL,
    "lead_code" "text" GENERATED ALWAYS AS (('LE-'::"text" || ("lead_number")::"text")) STORED,
    CONSTRAINT "sales_leads_attendance_type_check" CHECK (("attendance_type" = ANY (ARRAY['direct'::"text", 'representative'::"text"])))
);


ALTER TABLE "public"."sales_leads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sales_leads"."source_channel" IS 'Canal principal de origem do lead';



COMMENT ON COLUMN "public"."sales_leads"."source_subchannel" IS 'Subcanal/detalhe da origem (ex: Instagram, “especifique” para Outro, etc.)';



COMMENT ON COLUMN "public"."sales_leads"."referral_name" IS 'Nome de quem indicou (se canal = Indicação)';



COMMENT ON COLUMN "public"."sales_leads"."attendance_type" IS 'Type of attendance: direct or representative';



COMMENT ON COLUMN "public"."sales_leads"."representative_id" IS 'Reference to commercial representative when attendance_type is representative';



CREATE TABLE IF NOT EXISTS "public"."sales_vendor_user_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_cod" "text" NOT NULL,
    "vendor_filial" "text" DEFAULT ''::"text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_vendor_user_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "cod_munic" "text",
    "cod_uf" "text",
    "uf" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "country" "text" DEFAULT 'Brasil'::"text" NOT NULL,
    "population_est" integer,
    "codigo_ibge" "text",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "capital" smallint DEFAULT 0 NOT NULL,
    "siafi_id" "text",
    "ddd" "text",
    "fuso_horario" "text",
    "distance_km_to_indaiatuba" numeric(10,2),
    "average_truck_travel_time_hours" numeric(6,2),
    "distance_last_updated_at" timestamp with time zone,
    "time_last_updated_at" timestamp with time zone,
    "g_place_id" "text",
    "g_formatted_address" "text",
    "route_unavailable" boolean DEFAULT false,
    "distance_source" "text" DEFAULT 'google_maps'::"text",
    "route_status" "text",
    CONSTRAINT "ck_site_cities_capital_01" CHECK (("capital" = ANY (ARRAY[0, 1])))
);


ALTER TABLE "public"."site_cities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."site_cities"."distance_km_to_indaiatuba" IS 'Distância em Km até Indaiatuba';



COMMENT ON COLUMN "public"."site_cities"."average_truck_travel_time_hours" IS 'Tempo médio de viagem de caminhão (horas)';



CREATE TABLE IF NOT EXISTS "public"."site_city_distance_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "city_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_city_distance_errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_city_distance_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "only_fill_empty" boolean DEFAULT true NOT NULL,
    "total_cities" integer DEFAULT 0 NOT NULL,
    "processed_cities" integer DEFAULT 0 NOT NULL,
    "failed_cities" integer DEFAULT 0 NOT NULL,
    "last_offset" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "phase" "text" DEFAULT 'geocoding'::"text",
    "geocoded_cities" integer DEFAULT 0,
    "geocoding_started_at" timestamp with time zone,
    "geocoding_finished_at" timestamp with time zone,
    "mode" "text" DEFAULT 'fill_empty'::"text" NOT NULL,
    CONSTRAINT "site_city_distance_jobs_mode_chk" CHECK (("mode" = ANY (ARRAY['fill_empty'::"text", 'overwrite'::"text", 'geocode_non_matrix'::"text"]))),
    CONSTRAINT "site_city_distance_jobs_phase_check" CHECK (("phase" = ANY (ARRAY['geocoding'::"text", 'matrix'::"text"]))),
    CONSTRAINT "site_city_distance_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'cancelled'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."site_city_distance_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "locale" "text" DEFAULT 'pt'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "content_html" "text" DEFAULT ''::"text" NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "color" "text" DEFAULT '#3b82f6'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_product_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_applications_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."site_product_applications_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_families" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_en" "text" NOT NULL
);


ALTER TABLE "public"."site_product_families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_product_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_groups_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_product_groups_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_names" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_product_names" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_en" "text" NOT NULL
);


ALTER TABLE "public"."site_product_segments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_product_segments_map" (
    "product_id" "uuid" NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_product_segments_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "family_id" "uuid",
    "compound_type" "text",
    "molecular_formula" "text",
    "molecular_weight" numeric,
    "cas_number" "text",
    "cas_note" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_en" "text",
    "compound_type_en" "text",
    "cas_note_en" "text",
    "name_id" "uuid",
    "molecular_structure_image_url" "text",
    "product_format" "text",
    "product_image_url" "text",
    CONSTRAINT "site_products_product_format_check" CHECK (("product_format" = ANY (ARRAY['solid'::"text", 'liquid'::"text"])))
);


ALTER TABLE "public"."site_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "file_type" "text",
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "comment" "text" NOT NULL,
    "is_internal" boolean DEFAULT true NOT NULL,
    "mentioned_users" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_dependencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "depends_on_task_id" "uuid" NOT NULL,
    "dependency_type" "text" DEFAULT 'finish_to_start'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "task_dependencies_dependency_type_check" CHECK (("dependency_type" = ANY (ARRAY['finish_to_start'::"text", 'start_to_start'::"text", 'finish_to_finish'::"text", 'start_to_finish'::"text"])))
);


ALTER TABLE "public"."task_dependencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_draft_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "draft_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "size_bytes" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_draft_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "origin" "text" NOT NULL,
    "fixed_type" "public"."fixed_task_type",
    "template_id" "uuid",
    "form_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "task_drafts_origin_check" CHECK (("origin" = ANY (ARRAY['fixed'::"text", 'template'::"text"]))),
    CONSTRAINT "task_drafts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'submitted'::"text", 'discarded'::"text"])))
);


ALTER TABLE "public"."task_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_by" "uuid",
    "change_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_series" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "fixed_type" "public"."fixed_task_type" NOT NULL,
    "base_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "base_template_id" "uuid",
    "base_template_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "timezone" "text" DEFAULT 'America/Sao_Paulo'::"text" NOT NULL,
    "dtstart" timestamp with time zone NOT NULL,
    "rrule" "text" NOT NULL,
    "exdates" timestamp with time zone[] DEFAULT '{}'::timestamp with time zone[],
    "until_date" timestamp with time zone,
    "count_limit" integer,
    "lookahead_count" integer DEFAULT 1 NOT NULL,
    "catch_up_limit" integer DEFAULT 1 NOT NULL,
    "generation_mode" "text" DEFAULT 'on_schedule'::"text" NOT NULL,
    "adjust_policy" "text" DEFAULT 'none'::"text" NOT NULL,
    "days_before_due" integer DEFAULT 0 NOT NULL,
    "next_run_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_series_adjust" CHECK (("adjust_policy" = ANY (ARRAY['none'::"text", 'previous_business_day'::"text", 'next_business_day'::"text"]))),
    CONSTRAINT "chk_series_catchup" CHECK ((("catch_up_limit" >= 0) AND ("catch_up_limit" <= 5))),
    CONSTRAINT "chk_series_days_before_due" CHECK ((("days_before_due" >= 0) AND ("days_before_due" <= 30))),
    CONSTRAINT "chk_series_lookahead" CHECK ((("lookahead_count" >= 1) AND ("lookahead_count" <= 5))),
    CONSTRAINT "chk_series_mode" CHECK (("generation_mode" = ANY (ARRAY['on_schedule'::"text", 'on_prev_complete'::"text"])))
);


ALTER TABLE "public"."task_series" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "fixed_type" "public"."fixed_task_type" NOT NULL,
    "department_id" "uuid",
    "default_assignee_id" "uuid",
    "default_sla_hours" integer,
    "default_checklist" "text"[],
    "required_attachments" "text"[],
    "default_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "allowed_users" "uuid"[],
    "allowed_departments" "uuid"[],
    "allowed_roles" "text"[],
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "default_expected_offset_hours" integer,
    "default_deadline_offset_hours" integer,
    "default_priority" "public"."task_priority",
    "default_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon_name" "text" DEFAULT 'CheckSquare'::"text" NOT NULL,
    "icon_color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "form_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "allowed_users" "uuid"[],
    "allowed_departments" "uuid"[],
    "allowed_roles" "text"[],
    "goes_to_pending_list" boolean DEFAULT false NOT NULL,
    "filling_type" "public"."filling_type" DEFAULT 'none'::"public"."filling_type" NOT NULL,
    "approval_config" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."task_types" OWNER TO "postgres";


COMMENT ON COLUMN "public"."task_types"."goes_to_pending_list" IS 'Define se tarefas deste tipo vão para a listagem "Tarefas Pendentes" (true) ou para as visualizações normais como Kanban, Lista, etc (false)';



COMMENT ON COLUMN "public"."task_types"."filling_type" IS 'Define o tipo de preenchimento da tarefa: none (apenas formulário), approval (configuração de aprovação)';



COMMENT ON COLUMN "public"."task_types"."approval_config" IS 'Configurações de aprovação quando filling_type é approval';



CREATE SEQUENCE IF NOT EXISTS "public"."tasks_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tasks_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "priority" "public"."task_priority" DEFAULT 'P3'::"public"."task_priority" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "estimated_hours" numeric,
    "actual_hours" numeric,
    "tags" "text"[],
    "record_type" "text",
    "record_id" "uuid",
    "workflow_id" "uuid",
    "workflow_step_id" "text",
    "is_workflow_generated" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_department" "uuid",
    "assigned_users" "uuid"[],
    "task_type_id" "uuid",
    "approval_title" "text",
    "approval_description" "text",
    "form_id" "uuid",
    "fixed_type" "public"."fixed_task_type" DEFAULT 'simple_task'::"public"."fixed_task_type" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "template_id" "uuid",
    "template_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "series_id" "uuid",
    "occurrence_no" integer,
    "occurrence_start" timestamp with time zone,
    "occurrence_end" timestamp with time zone,
    "expected_completion_at" timestamp with time zone,
    "deadline_at" timestamp with time zone,
    "parent_task_id" "uuid",
    "sort_index" integer DEFAULT 0 NOT NULL,
    "estimated_duration_minutes" integer,
    "task_code" integer DEFAULT "nextval"('"public"."tasks_code_seq"'::"regclass") NOT NULL,
    "weblink" "text",
    CONSTRAINT "check_weblink_not_empty" CHECK ((("weblink" IS NULL) OR ("length"(TRIM(BOTH FROM "weblink")) > 0))),
    CONSTRAINT "chk_task_dates_order" CHECK ((("deadline_at" IS NULL) OR ("expected_completion_at" IS NULL) OR ("expected_completion_at" <= "deadline_at"))),
    CONSTRAINT "chk_tasks_email_min" CHECK ((("fixed_type" <> 'email'::"public"."fixed_task_type") OR (("payload" ? 'to'::"text") AND ("jsonb_typeof"(("payload" -> 'to'::"text")) = 'array'::"text") AND ("jsonb_array_length"(("payload" -> 'to'::"text")) > 0) AND ("payload" ? 'subject'::"text")))),
    CONSTRAINT "chk_tasks_form_has_form_id" CHECK ((("fixed_type" <> 'form'::"public"."fixed_task_type") OR ("payload" ? 'form_id'::"text"))),
    CONSTRAINT "chk_tasks_meeting_times" CHECK ((("fixed_type" <> 'meeting'::"public"."fixed_task_type") OR (("payload" ? 'start'::"text") AND ("payload" ? 'end'::"text") AND ((("payload" ->> 'start'::"text"))::timestamp with time zone < (("payload" ->> 'end'::"text"))::timestamp with time zone)))),
    CONSTRAINT "chk_tasks_signature_min" CHECK ((("fixed_type" <> 'signature'::"public"."fixed_task_type") OR (("payload" ? 'signers'::"text") AND ("jsonb_typeof"(("payload" -> 'signers'::"text")) = 'array'::"text") AND ("jsonb_array_length"(("payload" -> 'signers'::"text")) > 0) AND ("payload" ? 'document_id'::"text")))),
    CONSTRAINT "chk_tasks_workflow_id" CHECK ((("fixed_type" <> 'workflow'::"public"."fixed_task_type") OR ("payload" ? 'workflow_id'::"text"))),
    CONSTRAINT "chk_template_snapshot_present" CHECK ((("template_id" IS NULL) OR (("template_snapshot" IS NOT NULL) AND ("jsonb_typeof"("template_snapshot") = 'object'::"text") AND ("template_snapshot" <> '{}'::"jsonb")))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in_progress'::"text", 'review'::"text", 'done'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_flexible_assignment" CHECK ((("assigned_to" IS NOT NULL) OR ("assigned_department" IS NOT NULL) OR (("assigned_users" IS NOT NULL) AND ("array_length"("assigned_users", 1) > 0))))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."weblink" IS 'Link externo (URL) relacionado � tarefa - opcional';



CREATE OR REPLACE VIEW "public"."tasks_blockers_v" AS
 SELECT "id" AS "task_id",
    NULL::"uuid"[] AS "blocker_ids",
    (0)::bigint AS "open_blockers",
    NULL::timestamp with time zone AS "blocked_until"
   FROM "public"."tasks" "t";


ALTER VIEW "public"."tasks_blockers_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trusted_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_fingerprint" "text",
    "device_name" "text" NOT NULL,
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "device_fp_hash" "text",
    "label" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trusted_devices" OWNER TO "postgres";


COMMENT ON COLUMN "public"."trusted_devices"."device_fingerprint" IS 'Valor mascarado para exibição, não usado para identificação';



COMMENT ON COLUMN "public"."trusted_devices"."device_fp_hash" IS 'Hash do fingerprint usado como chave de identificação única';



CREATE TABLE IF NOT EXISTS "public"."unified_account_segments_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unified_account_segments_map" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."unified_accounts_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."unified_accounts_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unified_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."unified_account_status" DEFAULT 'lead_only'::"public"."unified_account_status" NOT NULL,
    "lead_id" "uuid",
    "protheus_filial" "text",
    "protheus_cod" "text",
    "protheus_loja" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seq_id" bigint DEFAULT "nextval"('"public"."unified_accounts_seq"'::"regclass") NOT NULL,
    "service_type" "text" DEFAULT 'direct'::"text" NOT NULL,
    "representative_id" "uuid",
    "economic_group_id" integer,
    CONSTRAINT "unified_accounts_service_rep_check" CHECK (((("service_type" = 'direct'::"text") AND ("representative_id" IS NULL)) OR (("service_type" = 'representative'::"text") AND ("representative_id" IS NOT NULL)))),
    CONSTRAINT "unified_accounts_service_type_check" CHECK (("service_type" = ANY (ARRAY['direct'::"text", 'representative'::"text"])))
);


ALTER TABLE "public"."unified_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_email_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_sync_value" integer DEFAULT 30 NOT NULL,
    "email_sync_unit" "text" DEFAULT 'days'::"text" NOT NULL,
    "signature_html" "text",
    "signature_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_sync_unit_valid" CHECK (("email_sync_unit" = ANY (ARRAY['days'::"text", 'months'::"text", 'years'::"text"])))
);


ALTER TABLE "public"."user_email_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "folder_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


CREATE UNLOGGED TABLE "public"."user_id_map" (
    "old_id" "uuid",
    "new_id" "uuid",
    "email" "text"
);


ALTER TABLE "public"."user_id_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notification_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "protheus_table_name" "text" NOT NULL,
    "enabled_statuses" "text"[] DEFAULT '{new,updated,deleted}'::"text"[] NOT NULL,
    "channels" "jsonb" DEFAULT '{"app": true, "email": false, "telegram": false, "whatsapp": false}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."user_notification_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" NOT NULL,
    "last_login" timestamp with time zone,
    "department" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_user_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_code" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_vendor_user_links_vendor_code_not_empty" CHECK (("btrim"("vendor_code") <> ''::"text"))
);


ALTER TABLE "public"."vendor_user_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_execution_id" "uuid" NOT NULL,
    "step_id" "text" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "comments" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approval_data" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "approval_type" "public"."approval_type" DEFAULT 'simple'::"public"."approval_type",
    "record_reference" "jsonb" DEFAULT '{}'::"jsonb",
    "original_data" "jsonb" DEFAULT '{}'::"jsonb",
    "auto_shared_record_id" "uuid",
    "requires_record_access" boolean DEFAULT false
);


ALTER TABLE "public"."workflow_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_auto_triggers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_execution_at" timestamp with time zone,
    "execution_count" integer DEFAULT 0,
    "max_executions" integer,
    "end_date" timestamp with time zone
);


ALTER TABLE "public"."workflow_auto_triggers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_corrections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_execution_id" "uuid" NOT NULL,
    "approval_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "assigned_to" "uuid" NOT NULL,
    "correction_details" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resubmitted_at" timestamp with time zone
);


ALTER TABLE "public"."workflow_corrections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_execution_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_id" "uuid" NOT NULL,
    "step_name" "text" NOT NULL,
    "step_type" "text" NOT NULL,
    "node_id" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_execution_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "triggered_by" "uuid",
    "trigger_data" "jsonb" DEFAULT '{}'::"jsonb",
    "record_type" "text",
    "record_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "workflow_executions_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "execution_id" "uuid",
    "trigger_data" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" integer DEFAULT 5 NOT NULL,
    "retry_count" integer DEFAULT 0 NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "scheduled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "workflow_definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "instructions" "text",
    "prerequisites" "text",
    "example_usage" "text",
    "tags" "text"[],
    "complexity_level" "text" DEFAULT 'basic'::"text" NOT NULL,
    "department_ids" "uuid"[],
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."workflow_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_trigger_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "execution_id" "uuid",
    "status" "text" DEFAULT 'triggered'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_trigger_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "workflow_definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "trigger_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workflow_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "department_ids" "uuid"[],
    "tags" "text"[],
    "confidentiality_level" "public"."confidentiality_level" DEFAULT 'public'::"public"."confidentiality_level" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "can_be_deleted" boolean DEFAULT true,
    "allowed_users" "uuid"[],
    "allowed_departments" "uuid"[],
    "allowed_roles" "text"[],
    CONSTRAINT "workflows_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['manual'::"text", 'automatic'::"text", 'scheduled'::"text", 'status_change'::"text", 'date_time'::"text", 'recurring_interval'::"text", 'recurring_schedule'::"text", 'recurring_monthly'::"text", 'user_inactivity'::"text", 'system_event'::"text", 'protheus_record_change'::"text", 'record_created'::"text", 'task_completed'::"text", 'deadline_missed'::"text", 'department_inactive'::"text", 'no_response'::"text", 'field_change'::"text", 'tasks_accumulation'::"text"])))
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."protheus_customer_groups" ALTER COLUMN "id_grupo" SET DEFAULT "nextval"('"public"."protheus_customer_groups_id_grupo_seq"'::"regclass");



ALTER TABLE ONLY "public"."access_rejections"
    ADD CONSTRAINT "access_rejections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversation_messages"
    ADD CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_health_status"
    ADD CONSTRAINT "api_health_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_health_status"
    ADD CONSTRAINT "api_health_status_provider_service_key" UNIQUE ("provider", "service");



ALTER TABLE ONLY "public"."app_notifications"
    ADD CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_tokens"
    ADD CONSTRAINT "approval_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_tokens"
    ADD CONSTRAINT "approval_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."buyer_user_links"
    ADD CONSTRAINT "buyer_user_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatter_email_messages"
    ADD CONSTRAINT "chatter_email_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatter_files"
    ADD CONSTRAINT "chatter_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatter_messages"
    ADD CONSTRAINT "chatter_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commercial_representatives"
    ADD CONSTRAINT "commercial_representatives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_entities"
    ADD CONSTRAINT "contact_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_contact_entity_id_key" UNIQUE ("contact_entity_id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_contact_entity_id_key" UNIQUE ("contact_entity_id");



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_entity_tags"
    ADD CONSTRAINT "contact_entity_tags_entity_id_tag_id_key" UNIQUE ("entity_id", "tag_id");



ALTER TABLE ONLY "public"."contact_entity_tags"
    ADD CONSTRAINT "contact_entity_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_friend_family_link_employees"
    ADD CONSTRAINT "contact_friend_family_link_employees_link_id_employee_id_key" UNIQUE ("link_id", "employee_id");



ALTER TABLE ONLY "public"."contact_friend_family_link_employees"
    ADD CONSTRAINT "contact_friend_family_link_employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_friend_family_links"
    ADD CONSTRAINT "contact_friend_family_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_links"
    ADD CONSTRAINT "contact_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_links"
    ADD CONSTRAINT "contact_links_unique" UNIQUE ("contact_id", "link_type", "target_id");



ALTER TABLE ONLY "public"."contact_partner_projects"
    ADD CONSTRAINT "contact_partner_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_job_logs"
    ADD CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."department_permissions"
    ADD CONSTRAINT "department_permissions_department_id_page_name_key" UNIQUE ("department_id", "page_name");



ALTER TABLE ONLY "public"."department_permissions"
    ADD CONSTRAINT "department_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doc_chunks"
    ADD CONSTRAINT "doc_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_access_logs"
    ADD CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_version_chunks"
    ADD CONSTRAINT "document_version_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_version_chunks"
    ADD CONSTRAINT "document_version_chunks_version_id_chunk_index_chunk_type_key" UNIQUE ("version_id", "chunk_index", "chunk_type");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_version_number_key" UNIQUE ("document_id", "version_number");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."economic_group_segments_map"
    ADD CONSTRAINT "economic_group_segments_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_draft_shares"
    ADD CONSTRAINT "email_draft_shares_draft_id_user_id_key" UNIQUE ("draft_id", "user_id");



ALTER TABLE ONLY "public"."email_draft_shares"
    ADD CONSTRAINT "email_draft_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_draft_tags"
    ADD CONSTRAINT "email_draft_tags_pkey" PRIMARY KEY ("draft_id", "tag_id");



ALTER TABLE ONLY "public"."email_drafts"
    ADD CONSTRAINT "email_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_signature_targets"
    ADD CONSTRAINT "email_signature_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_signatures"
    ADD CONSTRAINT "email_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_tags"
    ADD CONSTRAINT "email_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."email_tags"
    ADD CONSTRAINT "email_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_audit_log"
    ADD CONSTRAINT "field_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_analytics"
    ADD CONSTRAINT "form_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_contacts"
    ADD CONSTRAINT "form_external_contacts_form_id_contact_id_key" UNIQUE ("form_id", "contact_id");



ALTER TABLE ONLY "public"."form_external_contacts"
    ADD CONSTRAINT "form_external_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_form_access_token_key" UNIQUE ("form_access_token");



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_form_id_contact_id_key" UNIQUE ("form_id", "contact_id");



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_login_attempts"
    ADD CONSTRAINT "form_external_login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_recipients"
    ADD CONSTRAINT "form_external_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_sessions"
    ADD CONSTRAINT "form_external_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_external_sessions"
    ADD CONSTRAINT "form_external_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."form_publication_tokens"
    ADD CONSTRAINT "form_publication_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_publication_tokens"
    ADD CONSTRAINT "form_publication_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."form_response_drafts"
    ADD CONSTRAINT "form_response_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_versions"
    ADD CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."microsoft_accounts"
    ADD CONSTRAINT "microsoft_accounts_ms_account_id_key" UNIQUE ("ms_account_id");



ALTER TABLE ONLY "public"."microsoft_accounts"
    ADD CONSTRAINT "microsoft_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."microsoft_accounts"
    ADD CONSTRAINT "microsoft_accounts_user_id_ms_account_id_key" UNIQUE ("user_id", "ms_account_id");



ALTER TABLE ONLY "public"."microsoft_shared_mailboxes"
    ADD CONSTRAINT "microsoft_shared_mailboxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ms_oauth_tokens"
    ADD CONSTRAINT "ms_oauth_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_user_id_protheus_table_name_record_id_reco_key" UNIQUE ("user_id", "protheus_table_name", "record_id", "record_status");



ALTER TABLE ONLY "public"."ocr_cache"
    ADD CONSTRAINT "ocr_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."ocr_cache"
    ADD CONSTRAINT "ocr_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ocr_metrics"
    ADD CONSTRAINT "ocr_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."pending_access_requests"
    ADD CONSTRAINT "pending_access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portal_users"
    ADD CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portals"
    ADD CONSTRAINT "portals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_cache"
    ADD CONSTRAINT "processing_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."processing_cache"
    ADD CONSTRAINT "processing_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_performance_metrics"
    ADD CONSTRAINT "processing_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_steps"
    ADD CONSTRAINT "processing_steps_document_id_step_name_key" UNIQUE ("document_id", "step_name");



ALTER TABLE ONLY "public"."processing_steps"
    ADD CONSTRAINT "processing_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_binary_assets"
    ADD CONSTRAINT "protheus_binary_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_binary_assets"
    ADD CONSTRAINT "protheus_binary_assets_protheus_table_id_protheus_id_field__key" UNIQUE ("protheus_table_id", "protheus_id", "field_name");



ALTER TABLE ONLY "public"."protheus_config"
    ADD CONSTRAINT "protheus_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_config"
    ADD CONSTRAINT "protheus_config_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."protheus_customer_group_units"
    ADD CONSTRAINT "protheus_customer_group_units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_customer_group_units"
    ADD CONSTRAINT "protheus_customer_group_units_protheus_table_id_filial_cod__key" UNIQUE ("protheus_table_id", "filial", "cod", "loja");



ALTER TABLE ONLY "public"."protheus_customer_group_units"
    ADD CONSTRAINT "protheus_customer_group_units_unique_member" UNIQUE ("protheus_table_id", "filial", "cod", "loja");



ALTER TABLE ONLY "public"."protheus_customer_groups"
    ADD CONSTRAINT "protheus_customer_groups_pkey" PRIMARY KEY ("id_grupo");



ALTER TABLE ONLY "public"."protheus_customer_groups"
    ADD CONSTRAINT "protheus_customer_groups_table_filial_cod_unique" UNIQUE ("protheus_table_id", "filial", "cod");



ALTER TABLE ONLY "public"."protheus_dynamic_tables"
    ADD CONSTRAINT "protheus_dynamic_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_dynamic_tables"
    ADD CONSTRAINT "protheus_dynamic_tables_supabase_table_name_key" UNIQUE ("supabase_table_name");



ALTER TABLE ONLY "public"."protheus_group_update_results"
    ADD CONSTRAINT "protheus_group_update_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_group_update_runs"
    ADD CONSTRAINT "protheus_group_update_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa1010_80f17f00"
    ADD CONSTRAINT "protheus_sa1010_80f17f00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa1010_80f17f00"
    ADD CONSTRAINT "protheus_sa1010_80f17f00_unique_key" UNIQUE ("a1_filial", "a1_cod", "a1_loja");



ALTER TABLE ONLY "public"."protheus_sa2010_72a51158"
    ADD CONSTRAINT "protheus_sa2010_72a51158_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa2010_72a51158"
    ADD CONSTRAINT "protheus_sa2010_72a51158_unique_key" UNIQUE ("a2_filial", "a2_cod", "a2_loja");



ALTER TABLE ONLY "public"."protheus_sa3010_fc3d70f6"
    ADD CONSTRAINT "protheus_sa3010_fc3d70f6_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa3010_fc3d70f6"
    ADD CONSTRAINT "protheus_sa3010_fc3d70f6_unique_key" UNIQUE ("a3_cod");



ALTER TABLE ONLY "public"."protheus_sa4010_ea26a13a"
    ADD CONSTRAINT "protheus_sa4010_ea26a13a_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa4010_ea26a13a"
    ADD CONSTRAINT "protheus_sa4010_ea26a13a_unique_key" UNIQUE ("a4_filial", "a4_cod");



ALTER TABLE ONLY "public"."protheus_sa5010_6d3daa8e"
    ADD CONSTRAINT "protheus_sa5010_6d3daa8e_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sa5010_6d3daa8e"
    ADD CONSTRAINT "protheus_sa5010_6d3daa8e_unique_key" UNIQUE ("a5_filial", "a5_fornece", "a5_loja", "a5_produto", "a5_fabr", "a5_faloja", "a5_refgrd", "a5_codprf");



ALTER TABLE ONLY "public"."protheus_sb1010_b0316113"
    ADD CONSTRAINT "protheus_sb1010_b0316113_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sb1010_b0316113"
    ADD CONSTRAINT "protheus_sb1010_b0316113_unique_key" UNIQUE ("b1_filial", "b1_cod");



ALTER TABLE ONLY "public"."protheus_sds010_f444bb4c"
    ADD CONSTRAINT "protheus_sds010_f444bb4c_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sds010_f444bb4c"
    ADD CONSTRAINT "protheus_sds010_f444bb4c_unique_key" UNIQUE ("ds_filial", "ds_chavenf");



ALTER TABLE ONLY "public"."protheus_supplier_groups"
    ADD CONSTRAINT "protheus_supplier_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_supplier_material_types_map"
    ADD CONSTRAINT "protheus_supplier_material_types_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sy1010_3249e97a"
    ADD CONSTRAINT "protheus_sy1010_3249e97a_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sy1010_3249e97a"
    ADD CONSTRAINT "protheus_sy1010_3249e97a_unique_key" UNIQUE ("y1_filial", "y1_cod");



ALTER TABLE ONLY "public"."protheus_sync_deletions"
    ADD CONSTRAINT "protheus_sync_deletions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sync_errors"
    ADD CONSTRAINT "protheus_sync_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_sync_logs"
    ADD CONSTRAINT "protheus_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_table_extra_fields"
    ADD CONSTRAINT "protheus_table_extra_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_table_extra_fields"
    ADD CONSTRAINT "protheus_table_extra_fields_protheus_table_id_field_name_key" UNIQUE ("protheus_table_id", "field_name");



ALTER TABLE ONLY "public"."protheus_table_relationships"
    ADD CONSTRAINT "protheus_table_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_tables"
    ADD CONSTRAINT "protheus_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protheus_tables"
    ADD CONSTRAINT "protheus_tables_table_name_key" UNIQUE ("table_name");



ALTER TABLE ONLY "public"."protheus_usage_logs"
    ADD CONSTRAINT "protheus_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_economic_group_material_types"
    ADD CONSTRAINT "purchases_economic_group_material_types_pkey" PRIMARY KEY ("group_id", "material_type_id");



ALTER TABLE ONLY "public"."purchases_economic_group_members"
    ADD CONSTRAINT "purchases_economic_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_economic_groups"
    ADD CONSTRAINT "purchases_economic_groups_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."purchases_economic_groups"
    ADD CONSTRAINT "purchases_economic_groups_pkey" PRIMARY KEY ("id_grupo");



ALTER TABLE ONLY "public"."purchases_material_type_buyer_queue"
    ADD CONSTRAINT "purchases_material_type_buyer_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_material_types"
    ADD CONSTRAINT "purchases_material_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_potential_supplier_material_types"
    ADD CONSTRAINT "purchases_potential_supplier_material_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_potential_supplier_tags"
    ADD CONSTRAINT "purchases_potential_supplier_tags_pkey" PRIMARY KEY ("supplier_id", "tag_id");



ALTER TABLE ONLY "public"."purchases_potential_suppliers"
    ADD CONSTRAINT "purchases_potential_suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_supplier_group_material_types"
    ADD CONSTRAINT "purchases_supplier_group_material_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases_unified_supplier_material_types"
    ADD CONSTRAINT "purchases_unified_supplier_material_types_pkey" PRIMARY KEY ("supplier_id", "material_type_id");



ALTER TABLE ONLY "public"."purchases_unified_supplier_tags"
    ADD CONSTRAINT "purchases_unified_supplier_tags_pkey" PRIMARY KEY ("supplier_id", "tag_id");



ALTER TABLE ONLY "public"."purchases_unified_suppliers"
    ADD CONSTRAINT "purchases_unified_suppliers_fu_id_key" UNIQUE ("fu_id");



ALTER TABLE ONLY "public"."purchases_unified_suppliers"
    ADD CONSTRAINT "purchases_unified_suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."record_shares"
    ADD CONSTRAINT "record_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_lead_tags"
    ADD CONSTRAINT "sales_lead_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_lead_tags"
    ADD CONSTRAINT "sales_lead_tags_unique" UNIQUE ("lead_id", "tag_id");



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_vendor_user_links"
    ADD CONSTRAINT "sales_vendor_user_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_vendor_user_links"
    ADD CONSTRAINT "sales_vendor_user_links_vendor_filial_vendor_cod_key" UNIQUE ("vendor_filial", "vendor_cod");



ALTER TABLE ONLY "public"."site_cities"
    ADD CONSTRAINT "site_cities_cod_munic_cod_uf_key" UNIQUE ("cod_munic", "cod_uf");



ALTER TABLE ONLY "public"."site_cities"
    ADD CONSTRAINT "site_cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_city_distance_errors"
    ADD CONSTRAINT "site_city_distance_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_city_distance_jobs"
    ADD CONSTRAINT "site_city_distance_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_documents"
    ADD CONSTRAINT "site_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_applications_map"
    ADD CONSTRAINT "site_product_applications_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_applications_map"
    ADD CONSTRAINT "site_product_applications_map_product_id_application_id_key" UNIQUE ("product_id", "application_id");



ALTER TABLE ONLY "public"."site_product_applications"
    ADD CONSTRAINT "site_product_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_families"
    ADD CONSTRAINT "site_product_families_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."site_product_families"
    ADD CONSTRAINT "site_product_families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_groups_map"
    ADD CONSTRAINT "site_product_groups_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_groups"
    ADD CONSTRAINT "site_product_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_names"
    ADD CONSTRAINT "site_product_names_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_product_segments_map"
    ADD CONSTRAINT "site_product_segments_map_pkey" PRIMARY KEY ("product_id", "segment_id");



ALTER TABLE ONLY "public"."site_product_segments"
    ADD CONSTRAINT "site_product_segments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."site_product_segments"
    ADD CONSTRAINT "site_product_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_products"
    ADD CONSTRAINT "site_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_task_id_depends_on_task_id_key" UNIQUE ("task_id", "depends_on_task_id");



ALTER TABLE ONLY "public"."task_draft_uploads"
    ADD CONSTRAINT "task_draft_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_drafts"
    ADD CONSTRAINT "task_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_history"
    ADD CONSTRAINT "task_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_series"
    ADD CONSTRAINT "task_series_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trusted_devices"
    ADD CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trusted_devices"
    ADD CONSTRAINT "trusted_devices_user_id_device_fingerprint_key" UNIQUE ("user_id", "device_fingerprint");



ALTER TABLE ONLY "public"."unified_account_segments_map"
    ADD CONSTRAINT "unified_account_segments_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unified_accounts"
    ADD CONSTRAINT "unified_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unified_account_segments_map"
    ADD CONSTRAINT "unique_account_segment" UNIQUE ("account_id", "segment_id");



ALTER TABLE ONLY "public"."doc_chunks"
    ADD CONSTRAINT "unique_document_chunk" UNIQUE ("document_id", "chunk_index");



ALTER TABLE ONLY "public"."pending_access_requests"
    ADD CONSTRAINT "unique_pending_email_request" UNIQUE ("email", "status") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."site_product_groups_map"
    ADD CONSTRAINT "unique_product_group" UNIQUE ("product_id", "group_id");



ALTER TABLE ONLY "public"."site_product_names"
    ADD CONSTRAINT "unique_product_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."purchases_material_type_buyer_queue"
    ADD CONSTRAINT "uq_mtype_queue_material_buyer" UNIQUE ("material_type_id", "buyer_code", "buyer_filial");



ALTER TABLE ONLY "public"."purchases_material_type_buyer_queue"
    ADD CONSTRAINT "uq_mtype_queue_material_order" UNIQUE ("material_type_id", "order_index");



ALTER TABLE ONLY "public"."protheus_customer_groups"
    ADD CONSTRAINT "uq_protheus_group" UNIQUE ("protheus_table_id", "filial", "cod");



ALTER TABLE ONLY "public"."protheus_supplier_groups"
    ADD CONSTRAINT "uq_protheus_supplier_group" UNIQUE ("protheus_table_id", "filial", "cod");



ALTER TABLE ONLY "public"."purchases_potential_supplier_material_types"
    ADD CONSTRAINT "uq_supplier_material_type" UNIQUE ("supplier_id", "material_type_id");



ALTER TABLE ONLY "public"."vendor_user_links"
    ADD CONSTRAINT "uq_vendor_user_links_vendor_code" UNIQUE ("vendor_code");



ALTER TABLE ONLY "public"."user_email_preferences"
    ADD CONSTRAINT "user_email_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_email_preferences"
    ADD CONSTRAINT "user_email_preferences_user_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_document_id_key" UNIQUE ("user_id", "document_id");



ALTER TABLE ONLY "public"."user_notification_configs"
    ADD CONSTRAINT "user_notification_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notification_configs"
    ADD CONSTRAINT "user_notification_configs_user_id_protheus_table_name_key" UNIQUE ("user_id", "protheus_table_name");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_user_links"
    ADD CONSTRAINT "vendor_user_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_approvals"
    ADD CONSTRAINT "workflow_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_auto_triggers"
    ADD CONSTRAINT "workflow_auto_triggers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_corrections"
    ADD CONSTRAINT "workflow_corrections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_execution_steps"
    ADD CONSTRAINT "workflow_execution_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_queue"
    ADD CONSTRAINT "workflow_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_trigger_logs"
    ADD CONSTRAINT "workflow_trigger_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "buyer_user_links_buyer_code_key" ON "public"."buyer_user_links" USING "btree" ("buyer_code");



CREATE UNIQUE INDEX "chatter_email_messages_message_id_idx" ON "public"."chatter_email_messages" USING "btree" ("message_id");



CREATE INDEX "chatter_email_messages_record_idx" ON "public"."chatter_email_messages" USING "btree" ("record_type", "record_id");



CREATE INDEX "doc_chunks_document_modality_idx" ON "public"."doc_chunks" USING "btree" ("document_id", "modality");



CREATE UNIQUE INDEX "documents_unique_file_per_folder" ON "public"."documents" USING "btree" ("folder_id", "name", "file_size") WHERE ("status" <> 'Obsoleto'::"text");



CREATE INDEX "idx_ai_conversation_messages_conversation_id" ON "public"."ai_conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_conversation_messages_created_at" ON "public"."ai_conversation_messages" USING "btree" ("created_at");



CREATE INDEX "idx_ai_conversations_created_by" ON "public"."ai_conversations" USING "btree" ("created_by");



CREATE INDEX "idx_ai_conversations_type" ON "public"."ai_conversations" USING "btree" ("conversation_type");



CREATE INDEX "idx_ai_conversations_updated_at" ON "public"."ai_conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_api_health_last_check" ON "public"."api_health_status" USING "btree" ("last_check");



CREATE INDEX "idx_api_health_provider" ON "public"."api_health_status" USING "btree" ("provider", "service");



CREATE INDEX "idx_api_health_status" ON "public"."api_health_status" USING "btree" ("status");



CREATE INDEX "idx_app_notifications_created_at" ON "public"."app_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_app_notifications_unread" ON "public"."app_notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_app_notifications_user" ON "public"."app_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_approval_tokens_access_request_id" ON "public"."approval_tokens" USING "btree" ("access_request_id");



CREATE INDEX "idx_approval_tokens_approval_id" ON "public"."approval_tokens" USING "btree" ("approval_id");



CREATE INDEX "idx_approval_tokens_expires" ON "public"."approval_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_approval_tokens_hash" ON "public"."approval_tokens" USING "btree" ("token_hash");



CREATE INDEX "idx_chatter_files_approval_status" ON "public"."chatter_files" USING "btree" ("approval_status");



CREATE INDEX "idx_chatter_files_document_group" ON "public"."chatter_files" USING "btree" ("document_group_id");



CREATE INDEX "idx_chatter_files_expiry" ON "public"."chatter_files" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_chatter_files_record" ON "public"."chatter_files" USING "btree" ("record_type", "record_id");



CREATE INDEX "idx_chatter_messages_author" ON "public"."chatter_messages" USING "btree" ("author_id");



CREATE INDEX "idx_chatter_messages_created_at" ON "public"."chatter_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chatter_messages_parent" ON "public"."chatter_messages" USING "btree" ("parent_message_id");



CREATE INDEX "idx_chatter_messages_record" ON "public"."chatter_messages" USING "btree" ("record_type", "record_id");



CREATE INDEX "idx_commercial_reps_company_name" ON "public"."commercial_representatives" USING "btree" ("company_name");



CREATE INDEX "idx_commercial_reps_created_at" ON "public"."commercial_representatives" USING "btree" ("created_at");



CREATE INDEX "idx_commercial_reps_is_purchases" ON "public"."commercial_representatives" USING "btree" ("is_purchases");



CREATE INDEX "idx_commercial_reps_is_sales" ON "public"."commercial_representatives" USING "btree" ("is_sales");



CREATE INDEX "idx_commercial_reps_supplier_key" ON "public"."commercial_representatives" USING "btree" ("supplier_key");



CREATE INDEX "idx_contact_entity_associations_city_id" ON "public"."contact_entity_associations" USING "btree" ("city_id");



CREATE INDEX "idx_contact_entity_associations_entity_id" ON "public"."contact_entity_associations" USING "btree" ("contact_entity_id");



CREATE INDEX "idx_contact_entity_associations_responsible_dept" ON "public"."contact_entity_associations" USING "btree" ("responsible_department_id");



CREATE INDEX "idx_contact_entity_associations_responsible_user" ON "public"."contact_entity_associations" USING "btree" ("responsible_user_id");



CREATE INDEX "idx_contact_entity_external_partners_contact_entity_id" ON "public"."contact_entity_external_partners" USING "btree" ("contact_entity_id");



CREATE INDEX "idx_contact_entity_external_partners_partner_type" ON "public"."contact_entity_external_partners" USING "btree" ("partner_type");



CREATE INDEX "idx_contact_entity_external_partners_status" ON "public"."contact_entity_external_partners" USING "btree" ("status");



CREATE INDEX "idx_contact_entity_public_orgs_city_id" ON "public"."contact_entity_public_orgs" USING "btree" ("city_id");



CREATE INDEX "idx_contact_entity_public_orgs_contact_entity_id" ON "public"."contact_entity_public_orgs" USING "btree" ("contact_entity_id");



CREATE INDEX "idx_contact_entity_tags_entity_id" ON "public"."contact_entity_tags" USING "btree" ("entity_id");



CREATE INDEX "idx_contact_entity_tags_tag_id" ON "public"."contact_entity_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_contact_links_contact_and_target" ON "public"."contact_links" USING "btree" ("contact_id", "link_type", "target_kind", "target_id");



CREATE INDEX "idx_contact_links_contact_id" ON "public"."contact_links" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_links_contact_type" ON "public"."contact_links" USING "btree" ("contact_id", "link_type");



CREATE INDEX "idx_contact_links_target_id" ON "public"."contact_links" USING "btree" ("target_id");



CREATE INDEX "idx_contact_partner_projects_partner_id" ON "public"."contact_partner_projects" USING "btree" ("partner_id");



CREATE INDEX "idx_contact_partner_projects_status" ON "public"."contact_partner_projects" USING "btree" ("status");



CREATE INDEX "idx_contacts_city_id" ON "public"."contacts" USING "btree" ("city_id");



CREATE INDEX "idx_contacts_created_by" ON "public"."contacts" USING "btree" ("created_by");



CREATE INDEX "idx_contacts_decision_level" ON "public"."contacts" USING "btree" ("decision_level");



CREATE INDEX "idx_contacts_name" ON "public"."contacts" USING "btree" ("name");



CREATE INDEX "idx_contacts_responsible_department_id" ON "public"."contacts" USING "btree" ("responsible_department_id");



CREATE INDEX "idx_contacts_responsible_user_id" ON "public"."contacts" USING "btree" ("responsible_user_id");



CREATE INDEX "idx_doc_chunks_acl_hash" ON "public"."doc_chunks" USING "btree" ("acl_hash");



CREATE INDEX "idx_doc_chunks_confidence_score" ON "public"."doc_chunks" USING "btree" ("confidence_score" DESC);



CREATE INDEX "idx_doc_chunks_document_id" ON "public"."doc_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_doc_chunks_document_page" ON "public"."doc_chunks" USING "btree" ("document_id", "page_number");



CREATE INDEX "idx_doc_chunks_embedding_type" ON "public"."doc_chunks" USING "btree" ("embedding_type");



CREATE INDEX "idx_doc_chunks_extraction_source" ON "public"."doc_chunks" USING "btree" ("extraction_source");



CREATE INDEX "idx_doc_chunks_page_number" ON "public"."doc_chunks" USING "btree" ("page_number");



CREATE INDEX "idx_doc_chunks_parent_structure" ON "public"."doc_chunks" USING "btree" ("parent_structure_id");



CREATE INDEX "idx_doc_chunks_structure_type" ON "public"."doc_chunks" USING "btree" ("structure_type");



CREATE INDEX "idx_document_access_logs_created_at" ON "public"."document_access_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_document_access_logs_document_id" ON "public"."document_access_logs" USING "btree" ("document_id");



CREATE INDEX "idx_document_access_logs_user_id" ON "public"."document_access_logs" USING "btree" ("user_id");



CREATE INDEX "idx_document_version_chunks_embeddings" ON "public"."document_version_chunks" USING "ivfflat" ("embeddings" "public"."vector_cosine_ops");



CREATE INDEX "idx_document_version_chunks_version_id" ON "public"."document_version_chunks" USING "btree" ("version_id");



CREATE INDEX "idx_document_versions_document_id" ON "public"."document_versions" USING "btree" ("document_id");



CREATE INDEX "idx_document_versions_version_number" ON "public"."document_versions" USING "btree" ("document_id", "version_number" DESC);



CREATE INDEX "idx_documents_acl_hash" ON "public"."documents" USING "btree" ("acl_hash");



CREATE INDEX "idx_documents_department" ON "public"."documents" USING "btree" ("department_id");



CREATE INDEX "idx_documents_file_type" ON "public"."documents" USING "btree" ("file_type");



CREATE INDEX "idx_documents_folder" ON "public"."documents" USING "btree" ("folder_id");



CREATE INDEX "idx_documents_rag_status" ON "public"."documents" USING "btree" ("rag_status");



CREATE INDEX "idx_documents_review_department" ON "public"."documents" USING "btree" ("review_department_id");



CREATE INDEX "idx_egsm_group_id" ON "public"."economic_group_segments_map" USING "btree" ("group_id");



CREATE INDEX "idx_egsm_segment_id" ON "public"."economic_group_segments_map" USING "btree" ("segment_id");



CREATE INDEX "idx_email_signature_targets_user" ON "public"."email_signature_targets" USING "btree" ("user_id");



CREATE INDEX "idx_fela_email_time" ON "public"."form_external_login_attempts" USING "btree" ("email_lower", "attempted_at");



CREATE INDEX "idx_fela_ip_time" ON "public"."form_external_login_attempts" USING "btree" ("ip_hash", "attempted_at");



CREATE INDEX "idx_field_audit_log_field_name" ON "public"."field_audit_log" USING "btree" ("field_name");



CREATE INDEX "idx_field_audit_log_timestamp" ON "public"."field_audit_log" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_field_audit_log_user_id" ON "public"."field_audit_log" USING "btree" ("record_id");



CREATE INDEX "idx_folders_allow_delete" ON "public"."folders" USING "btree" ("allow_delete");



CREATE INDEX "idx_folders_department" ON "public"."folders" USING "btree" ("department_id");



CREATE INDEX "idx_folders_parent" ON "public"."folders" USING "btree" ("parent_folder_id");



CREATE INDEX "idx_form_analytics_event_type" ON "public"."form_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_form_analytics_form_id" ON "public"."form_analytics" USING "btree" ("form_id");



CREATE INDEX "idx_form_external_contacts_contact_id" ON "public"."form_external_contacts" USING "btree" ("contact_id");



CREATE INDEX "idx_form_external_contacts_form_id" ON "public"."form_external_contacts" USING "btree" ("form_id");



CREATE INDEX "idx_form_external_invitations_contact_id" ON "public"."form_external_invitations" USING "btree" ("contact_id");



CREATE INDEX "idx_form_external_invitations_form_id" ON "public"."form_external_invitations" USING "btree" ("form_id");



CREATE INDEX "idx_form_external_invitations_response_id" ON "public"."form_external_invitations" USING "btree" ("response_id");



CREATE INDEX "idx_form_external_invitations_token" ON "public"."form_external_invitations" USING "btree" ("form_access_token");



CREATE INDEX "idx_form_external_recipients_email" ON "public"."form_external_recipients" USING "btree" ("email");



CREATE INDEX "idx_form_external_recipients_form_id" ON "public"."form_external_recipients" USING "btree" ("form_id");



CREATE INDEX "idx_form_external_sessions_recipient" ON "public"."form_external_sessions" USING "btree" ("recipient_id");



CREATE INDEX "idx_form_external_sessions_token" ON "public"."form_external_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_form_publication_tokens_active" ON "public"."form_publication_tokens" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_form_publication_tokens_form_id" ON "public"."form_publication_tokens" USING "btree" ("form_id");



CREATE INDEX "idx_form_publication_tokens_token_hash" ON "public"."form_publication_tokens" USING "btree" ("token_hash");



CREATE INDEX "idx_form_response_drafts_form_id" ON "public"."form_response_drafts" USING "btree" ("form_id");



CREATE INDEX "idx_form_response_drafts_user_id" ON "public"."form_response_drafts" USING "btree" ("user_id");



CREATE INDEX "idx_form_responses_form_id" ON "public"."form_responses" USING "btree" ("form_id");



CREATE INDEX "idx_form_responses_submitted_at" ON "public"."form_responses" USING "btree" ("submitted_at");



CREATE INDEX "idx_form_versions_current" ON "public"."form_versions" USING "btree" ("form_id", "is_current");



CREATE INDEX "idx_form_versions_form_id" ON "public"."form_versions" USING "btree" ("form_id");



CREATE INDEX "idx_forms_created_by" ON "public"."forms" USING "btree" ("created_by");



CREATE INDEX "idx_forms_status" ON "public"."forms" USING "btree" ("status");



CREATE INDEX "idx_ms_accounts_user" ON "public"."microsoft_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_mtype_queue_material_order" ON "public"."purchases_material_type_buyer_queue" USING "btree" ("material_type_id", "order_index");



CREATE INDEX "idx_ocr_cache_expires_at" ON "public"."ocr_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_ocr_cache_key" ON "public"."ocr_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_ocr_metrics_created_at" ON "public"."ocr_metrics" USING "btree" ("created_at");



CREATE INDEX "idx_ocr_metrics_document_id" ON "public"."ocr_metrics" USING "btree" ("document_id");



CREATE INDEX "idx_ocr_metrics_model_used" ON "public"."ocr_metrics" USING "btree" ("model_used");



CREATE INDEX "idx_pegmt_group" ON "public"."purchases_economic_group_material_types" USING "btree" ("group_id");



CREATE INDEX "idx_pegmt_material_type" ON "public"."purchases_economic_group_material_types" USING "btree" ("material_type_id");



CREATE INDEX "idx_pending_access_ip_created" ON "public"."pending_access_requests" USING "btree" ("request_ip_hash", "created_at");



CREATE INDEX "idx_pending_requests_ip_hash_created" ON "public"."pending_access_requests" USING "btree" ("request_ip_hash", "created_at");



CREATE INDEX "idx_performance_metrics_created" ON "public"."processing_performance_metrics" USING "btree" ("created_at");



CREATE INDEX "idx_performance_metrics_document" ON "public"."processing_performance_metrics" USING "btree" ("document_id");



CREATE INDEX "idx_performance_metrics_session" ON "public"."processing_performance_metrics" USING "btree" ("processing_session_id");



CREATE UNIQUE INDEX "idx_potential_suppliers_pf_code" ON "public"."purchases_potential_suppliers" USING "btree" ("pf_code");



CREATE UNIQUE INDEX "idx_potential_suppliers_pf_number" ON "public"."purchases_potential_suppliers" USING "btree" ("pf_number");



CREATE INDEX "idx_potential_suppliers_representative_id" ON "public"."purchases_potential_suppliers" USING "btree" ("representative_id") WHERE ("representative_id" IS NOT NULL);



CREATE INDEX "idx_ppsmt_material_type" ON "public"."purchases_potential_supplier_material_types" USING "btree" ("material_type_id");



CREATE INDEX "idx_ppsmt_supplier" ON "public"."purchases_potential_supplier_material_types" USING "btree" ("supplier_id");



CREATE INDEX "idx_processing_cache_expires" ON "public"."processing_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_processing_cache_hash" ON "public"."processing_cache" USING "btree" ("content_hash");



CREATE INDEX "idx_processing_cache_key" ON "public"."processing_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_processing_cache_type" ON "public"."processing_cache" USING "btree" ("cache_type");



CREATE INDEX "idx_profiles_mfa_required" ON "public"."profiles" USING "btree" ("mfa_required");



CREATE INDEX "idx_profiles_supervisor_id" ON "public"."profiles" USING "btree" ("supervisor_id");



CREATE INDEX "idx_profiles_whatsapp_phone" ON "public"."profiles" USING "btree" ("whatsapp_phone");



CREATE INDEX "idx_profiles_whatsapp_verified" ON "public"."profiles" USING "btree" ("whatsapp_verified");



CREATE INDEX "idx_protheus_binary_assets_protheus_id" ON "public"."protheus_binary_assets" USING "btree" ("protheus_id");



CREATE INDEX "idx_protheus_binary_assets_sha256" ON "public"."protheus_binary_assets" USING "btree" ("sha256");



CREATE INDEX "idx_protheus_binary_assets_table_id" ON "public"."protheus_binary_assets" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_customer_groups_group_key" ON "public"."protheus_customer_groups" USING "btree" ("group_key");



CREATE INDEX "idx_protheus_customer_groups_table" ON "public"."protheus_customer_groups" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_sa1010_80f17f00_is_new_record" ON "public"."protheus_sa1010_80f17f00" USING "btree" ("is_new_record");



CREATE INDEX "idx_protheus_sa1010_80f17f00_last_sync_id" ON "public"."protheus_sa1010_80f17f00" USING "btree" ("last_sync_id");



CREATE INDEX "idx_protheus_sa1010_80f17f00_was_updated_last_sync" ON "public"."protheus_sa1010_80f17f00" USING "btree" ("was_updated_last_sync");



CREATE INDEX "idx_protheus_supplier_groups_group_key" ON "public"."protheus_supplier_groups" USING "btree" ("group_key");



CREATE INDEX "idx_protheus_supplier_groups_table" ON "public"."protheus_supplier_groups" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_sync_deletions_pid" ON "public"."protheus_sync_deletions" USING "btree" ("protheus_id");



CREATE INDEX "idx_protheus_sync_deletions_table" ON "public"."protheus_sync_deletions" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_sync_errors_created" ON "public"."protheus_sync_errors" USING "btree" ("created_at");



CREATE INDEX "idx_protheus_sync_errors_sync_log" ON "public"."protheus_sync_errors" USING "btree" ("sync_log_id");



CREATE INDEX "idx_protheus_sync_errors_table" ON "public"."protheus_sync_errors" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_sync_errors_type" ON "public"."protheus_sync_errors" USING "btree" ("error_type");



CREATE INDEX "idx_protheus_sync_logs_started_at" ON "public"."protheus_sync_logs" USING "btree" ("started_at");



CREATE INDEX "idx_protheus_sync_logs_status" ON "public"."protheus_sync_logs" USING "btree" ("status");



CREATE INDEX "idx_protheus_sync_logs_table_id" ON "public"."protheus_sync_logs" USING "btree" ("protheus_table_id");



CREATE INDEX "idx_protheus_tables_created_by" ON "public"."protheus_tables" USING "btree" ("created_by");



CREATE INDEX "idx_protheus_tables_next_due_at" ON "public"."protheus_tables" USING "btree" ("next_due_at") WHERE ("is_active" = true);



CREATE INDEX "idx_protheus_tables_table_name" ON "public"."protheus_tables" USING "btree" ("table_name");



CREATE INDEX "idx_protheus_usage_logs_config_id" ON "public"."protheus_usage_logs" USING "btree" ("config_id");



CREATE INDEX "idx_protheus_usage_logs_executed_at" ON "public"."protheus_usage_logs" USING "btree" ("executed_at" DESC);



CREATE INDEX "idx_protheus_usage_logs_user_id" ON "public"."protheus_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_psgmt_group" ON "public"."purchases_supplier_group_material_types" USING "btree" ("group_id");



CREATE INDEX "idx_psgmt_material_type" ON "public"."purchases_supplier_group_material_types" USING "btree" ("material_type_id");



CREATE INDEX "idx_pst_supplier" ON "public"."purchases_potential_supplier_tags" USING "btree" ("supplier_id");



CREATE INDEX "idx_pst_tag" ON "public"."purchases_potential_supplier_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_pu_supp_mat_types_material" ON "public"."purchases_unified_supplier_material_types" USING "btree" ("material_type_id");



CREATE INDEX "idx_pu_supp_mat_types_supplier" ON "public"."purchases_unified_supplier_material_types" USING "btree" ("supplier_id");



CREATE INDEX "idx_pu_supplier_tags_supplier_id" ON "public"."purchases_unified_supplier_tags" USING "btree" ("supplier_id");



CREATE INDEX "idx_pu_supplier_tags_tag_id" ON "public"."purchases_unified_supplier_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_purch_ps_city_id" ON "public"."purchases_potential_suppliers" USING "btree" ("city_id");



CREATE INDEX "idx_purch_ps_cnpj" ON "public"."purchases_potential_suppliers" USING "btree" ("cnpj");



CREATE INDEX "idx_purch_ps_created_by" ON "public"."purchases_potential_suppliers" USING "btree" ("created_by");



CREATE INDEX "idx_purch_ps_trade_name" ON "public"."purchases_potential_suppliers" USING "btree" ("trade_name");



CREATE INDEX "idx_purchases_groups_buyer" ON "public"."purchases_economic_groups" USING "btree" ("assigned_buyer_cod", "assigned_buyer_filial");



CREATE INDEX "idx_purchases_groups_protheus_cod" ON "public"."purchases_economic_groups" USING "btree" ("protheus_cod");



CREATE INDEX "idx_purchases_groups_protheus_filial" ON "public"."purchases_economic_groups" USING "btree" ("protheus_filial");



CREATE INDEX "idx_purchases_unified_suppliers_cnpj_normalized" ON "public"."purchases_unified_suppliers" USING "btree" ("regexp_replace"(COALESCE("cnpj", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text")) WHERE ("cnpj" IS NOT NULL);



CREATE INDEX "idx_pus_has_economic_group" ON "public"."purchases_unified_suppliers" USING "btree" ("has_economic_group");



CREATE INDEX "idx_record_shares_expires_at" ON "public"."record_shares" USING "btree" ("expires_at");



CREATE INDEX "idx_record_shares_record" ON "public"."record_shares" USING "btree" ("record_type", "record_id");



CREATE INDEX "idx_record_shares_shared_by" ON "public"."record_shares" USING "btree" ("shared_by");



CREATE INDEX "idx_record_shares_shared_with" ON "public"."record_shares" USING "btree" ("shared_with");



CREATE INDEX "idx_record_shares_status" ON "public"."record_shares" USING "btree" ("status");



CREATE INDEX "idx_sales_leads_assigned_vendor" ON "public"."sales_leads" USING "btree" ("assigned_vendor_cod", "assigned_vendor_filial");



CREATE INDEX "idx_sales_leads_city_id" ON "public"."sales_leads" USING "btree" ("city_id");



CREATE INDEX "idx_sales_leads_cnpj" ON "public"."sales_leads" USING "btree" ("cnpj");



CREATE INDEX "idx_sales_leads_trade_name_lower" ON "public"."sales_leads" USING "btree" ("lower"("trade_name"));



CREATE INDEX "idx_site_cities_distance_source" ON "public"."site_cities" USING "btree" ("distance_source");



CREATE INDEX "idx_site_cities_distance_updated" ON "public"."site_cities" USING "btree" ("distance_last_updated_at");



CREATE INDEX "idx_site_cities_g_place_id" ON "public"."site_cities" USING "btree" ("g_place_id");



CREATE INDEX "idx_site_cities_name" ON "public"."site_cities" USING "btree" ("name");



CREATE INDEX "idx_site_cities_route_status" ON "public"."site_cities" USING "btree" ("route_status");



CREATE INDEX "idx_site_cities_time_updated" ON "public"."site_cities" USING "btree" ("time_last_updated_at");



CREATE INDEX "idx_site_cities_uf" ON "public"."site_cities" USING "btree" ("uf");



CREATE INDEX "idx_site_product_applications_map_application_id" ON "public"."site_product_applications_map" USING "btree" ("application_id");



CREATE INDEX "idx_site_product_applications_map_product_id" ON "public"."site_product_applications_map" USING "btree" ("product_id");



CREATE INDEX "idx_site_product_families_active_name" ON "public"."site_product_families" USING "btree" ("is_active", "name");



CREATE INDEX "idx_site_product_names_active" ON "public"."site_product_names" USING "btree" ("is_active");



CREATE INDEX "idx_site_product_names_name" ON "public"."site_product_names" USING "btree" ("name");



CREATE INDEX "idx_site_product_segments_active_name" ON "public"."site_product_segments" USING "btree" ("is_active", "name");



CREATE INDEX "idx_site_products_cas" ON "public"."site_products" USING "btree" ("cas_number");



CREATE INDEX "idx_site_products_family" ON "public"."site_products" USING "btree" ("family_id");



CREATE INDEX "idx_site_products_name" ON "public"."site_products" USING "btree" ("name");



CREATE INDEX "idx_site_products_name_id" ON "public"."site_products" USING "btree" ("name_id");



CREATE INDEX "idx_site_products_updated_at" ON "public"."site_products" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_supplier_material_types_group" ON "public"."protheus_supplier_material_types_map" USING "btree" ("group_id");



CREATE INDEX "idx_task_attachments_task_id" ON "public"."task_attachments" USING "btree" ("task_id");



CREATE INDEX "idx_task_comments_task_id" ON "public"."task_comments" USING "btree" ("task_id");



CREATE INDEX "idx_task_drafts_updated_at" ON "public"."task_drafts" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_task_drafts_user_status" ON "public"."task_drafts" USING "btree" ("user_id", "status");



CREATE INDEX "idx_task_history_task_id" ON "public"."task_history" USING "btree" ("task_id");



CREATE INDEX "idx_task_series_next_run" ON "public"."task_series" USING "btree" ("next_run_at");



CREATE INDEX "idx_task_templates_active" ON "public"."task_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_task_templates_default_payload" ON "public"."task_templates" USING "gin" ("default_payload");



CREATE INDEX "idx_task_templates_department" ON "public"."task_templates" USING "btree" ("department_id");



CREATE INDEX "idx_task_templates_fixed_type" ON "public"."task_templates" USING "btree" ("fixed_type");



CREATE INDEX "idx_task_templates_required_attachments" ON "public"."task_templates" USING "gin" ("required_attachments");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_created_by" ON "public"."tasks" USING "btree" ("created_by");



CREATE INDEX "idx_tasks_deadline_at" ON "public"."tasks" USING "btree" ("deadline_at");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_expected_completion_at" ON "public"."tasks" USING "btree" ("expected_completion_at");



CREATE INDEX "idx_tasks_fixed_type" ON "public"."tasks" USING "btree" ("fixed_type");



CREATE INDEX "idx_tasks_form_id" ON "public"."tasks" USING "btree" ((("payload" ->> 'form_id'::"text")));



CREATE INDEX "idx_tasks_parent" ON "public"."tasks" USING "btree" ("parent_task_id");



CREATE INDEX "idx_tasks_parent_sort" ON "public"."tasks" USING "btree" ("parent_task_id", "sort_index");



CREATE INDEX "idx_tasks_payload" ON "public"."tasks" USING "gin" ("payload");



CREATE INDEX "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");



CREATE INDEX "idx_tasks_record" ON "public"."tasks" USING "btree" ("record_type", "record_id");



CREATE INDEX "idx_tasks_series_occ_date" ON "public"."tasks" USING "btree" ("series_id", "occurrence_start");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tasks_tags_gin" ON "public"."tasks" USING "gin" ("tags");



CREATE INDEX "idx_tasks_weblink" ON "public"."tasks" USING "btree" ("weblink") WHERE ("weblink" IS NOT NULL);



CREATE INDEX "idx_tasks_workflow" ON "public"."tasks" USING "btree" ("workflow_id");



CREATE INDEX "idx_unified_account_segments_account_id" ON "public"."unified_account_segments_map" USING "btree" ("account_id");



CREATE INDEX "idx_unified_account_segments_segment_id" ON "public"."unified_account_segments_map" USING "btree" ("segment_id");



CREATE INDEX "idx_unified_accounts_created_at" ON "public"."unified_accounts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_unified_accounts_economic_group_id" ON "public"."unified_accounts" USING "btree" ("economic_group_id");



CREATE INDEX "idx_unified_accounts_lead_id" ON "public"."unified_accounts" USING "btree" ("lead_id");



CREATE UNIQUE INDEX "idx_unique_group_segment" ON "public"."economic_group_segments_map" USING "btree" ("group_id", "segment_id");



CREATE UNIQUE INDEX "idx_user_email_preferences_user" ON "public"."user_email_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_favorites_document_id" ON "public"."user_favorites" USING "btree" ("document_id");



CREATE INDEX "idx_user_favorites_user_id" ON "public"."user_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_workflow_approvals_approver" ON "public"."workflow_approvals" USING "btree" ("approver_id");



CREATE INDEX "idx_workflow_approvals_approver_status" ON "public"."workflow_approvals" USING "btree" ("approver_id", "status");



CREATE INDEX "idx_workflow_approvals_execution" ON "public"."workflow_approvals" USING "btree" ("workflow_execution_id");



CREATE INDEX "idx_workflow_approvals_record_ref" ON "public"."workflow_approvals" USING "gin" ("record_reference");



CREATE INDEX "idx_workflow_approvals_status" ON "public"."workflow_approvals" USING "btree" ("status");



CREATE INDEX "idx_workflow_approvals_type" ON "public"."workflow_approvals" USING "btree" ("approval_type");



CREATE INDEX "idx_workflow_auto_triggers_active_recurring" ON "public"."workflow_auto_triggers" USING "btree" ("trigger_type", "is_active", "next_execution_at") WHERE ("is_active" = true);



CREATE INDEX "idx_workflow_auto_triggers_next_execution" ON "public"."workflow_auto_triggers" USING "btree" ("next_execution_at") WHERE (("is_active" = true) AND ("next_execution_at" IS NOT NULL));



CREATE INDEX "idx_workflow_execution_steps_execution_id" ON "public"."workflow_execution_steps" USING "btree" ("execution_id");



CREATE INDEX "idx_workflow_execution_steps_status" ON "public"."workflow_execution_steps" USING "btree" ("status");



CREATE INDEX "idx_workflow_queue_priority" ON "public"."workflow_queue" USING "btree" ("priority");



CREATE INDEX "idx_workflow_queue_scheduled_at" ON "public"."workflow_queue" USING "btree" ("scheduled_at");



CREATE INDEX "idx_workflow_queue_status" ON "public"."workflow_queue" USING "btree" ("status");



CREATE INDEX "idx_workflows_confidentiality" ON "public"."workflows" USING "btree" ("confidentiality_level");



CREATE INDEX "idx_workflows_deleted_at" ON "public"."workflows" USING "btree" ("deleted_at");



CREATE INDEX "idx_workflows_departments" ON "public"."workflows" USING "gin" ("department_ids");



CREATE INDEX "idx_workflows_priority" ON "public"."workflows" USING "btree" ("priority");



CREATE INDEX "idx_workflows_status" ON "public"."workflows" USING "btree" ("status");



CREATE INDEX "idx_workflows_tags" ON "public"."workflows" USING "gin" ("tags");



CREATE INDEX "idx_workflows_type" ON "public"."workflows" USING "btree" ("workflow_type");



CREATE UNIQUE INDEX "microsoft_shared_mailboxes_user_email_unique" ON "public"."microsoft_shared_mailboxes" USING "btree" ("user_id", "lower"("email"));



CREATE UNIQUE INDEX "one_running_city_distance_job_per_user" ON "public"."site_city_distance_jobs" USING "btree" ("created_by") WHERE ("status" = ANY (ARRAY['queued'::"text", 'running'::"text"]));



CREATE UNIQUE INDEX "pending_access_requests_email_pending_unique" ON "public"."pending_access_requests" USING "btree" ("email") WHERE ("status" = 'pending'::"text");



CREATE UNIQUE INDEX "portal_users_unique_email_per_portal" ON "public"."portal_users" USING "btree" ("portal_id", "lower"("email"));



CREATE UNIQUE INDEX "purchases_group_member_unique_pair" ON "public"."purchases_economic_group_members" USING "btree" ("group_id", "unified_supplier_id");



CREATE UNIQUE INDEX "purchases_group_member_unique_supplier" ON "public"."purchases_economic_group_members" USING "btree" ("unified_supplier_id");



CREATE INDEX "purchases_material_types_created_at_idx" ON "public"."purchases_material_types" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "purchases_material_types_unique_name_idx" ON "public"."purchases_material_types" USING "btree" ("public"."normalize_text"("name"));



CREATE INDEX "purchases_unified_suppliers_group_idx" ON "public"."purchases_unified_suppliers" USING "btree" ("economic_group_id");



CREATE UNIQUE INDEX "purchases_unified_suppliers_unique_potential" ON "public"."purchases_unified_suppliers" USING "btree" ("potential_supplier_id") WHERE ("potential_supplier_id" IS NOT NULL);



CREATE UNIQUE INDEX "purchases_unified_suppliers_unique_protheus_unit" ON "public"."purchases_unified_suppliers" USING "btree" ("protheus_filial", "protheus_cod", "protheus_loja") WHERE ("protheus_filial" IS NOT NULL);



CREATE INDEX "sales_leads_company_name_idx" ON "public"."sales_leads" USING "btree" ("lower"("trade_name"));



CREATE INDEX "sales_leads_economic_group_id_idx" ON "public"."sales_leads" USING "btree" ("economic_group_id");



CREATE UNIQUE INDEX "sales_leads_lead_code_uidx" ON "public"."sales_leads" USING "btree" ("lead_code");



CREATE UNIQUE INDEX "sales_leads_lead_number_uidx" ON "public"."sales_leads" USING "btree" ("lead_number");



CREATE INDEX "sales_vendor_user_links_user_idx" ON "public"."sales_vendor_user_links" USING "btree" ("user_id");



CREATE UNIQUE INDEX "site_documents_slug_locale_idx" ON "public"."site_documents" USING "btree" ("slug", "locale");



CREATE UNIQUE INDEX "tasks_task_code_unique" ON "public"."tasks" USING "btree" ("task_code");



CREATE UNIQUE INDEX "unified_accounts_seq_id_idx" ON "public"."unified_accounts" USING "btree" ("seq_id");



CREATE UNIQUE INDEX "unified_accounts_unique_lead" ON "public"."unified_accounts" USING "btree" ("lead_id") WHERE ("lead_id" IS NOT NULL);



CREATE UNIQUE INDEX "unified_accounts_unique_protheus_unit" ON "public"."unified_accounts" USING "btree" ("protheus_filial", "protheus_cod", "protheus_loja") WHERE (("protheus_filial" IS NOT NULL) AND ("protheus_cod" IS NOT NULL) AND ("protheus_loja" IS NOT NULL));



CREATE UNIQUE INDEX "uniq_folders_root_per_department" ON "public"."folders" USING "btree" ("department_id") WHERE ("is_root" = true);



CREATE UNIQUE INDEX "uq_email_signature_targets_msacc" ON "public"."email_signature_targets" USING "btree" ("signature_id", "microsoft_account_id") WHERE ("microsoft_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_email_signature_targets_shared" ON "public"."email_signature_targets" USING "btree" ("signature_id", "shared_mailbox_id") WHERE ("shared_mailbox_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_psgmt_group_material" ON "public"."purchases_supplier_group_material_types" USING "btree" ("group_id", "material_type_id");



CREATE UNIQUE INDEX "uq_purchases_group_member_unified" ON "public"."purchases_economic_group_members" USING "btree" ("unified_supplier_id");



CREATE UNIQUE INDEX "uq_site_products_nameid_compound_type" ON "public"."site_products" USING "btree" ("name_id", "compound_type");



CREATE UNIQUE INDEX "uq_task_series_owner_title_active" ON "public"."task_series" USING "btree" ("owner_id", "lower"("title")) WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "uq_tasks_series_occurrence" ON "public"."tasks" USING "btree" ("series_id", "occurrence_no") WHERE ("series_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_trusted_devices_hash" ON "public"."trusted_devices" USING "btree" ("user_id", "device_fp_hash");



CREATE UNIQUE INDEX "ux_form_response_drafts_form_user" ON "public"."form_response_drafts" USING "btree" ("form_id", "user_id");



CREATE OR REPLACE TRIGGER "audit_departments_changes_trigger" AFTER UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_departments_changes"();



CREATE OR REPLACE TRIGGER "audit_employee_sensitive_access" AFTER UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_sensitive_access"();



CREATE OR REPLACE TRIGGER "audit_record_shares_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."record_shares" FOR EACH ROW EXECUTE FUNCTION "public"."audit_record_shares"();



CREATE OR REPLACE TRIGGER "audit_task_changes_trigger" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_task_changes"();



CREATE OR REPLACE TRIGGER "auto_share_approval_record_trigger" BEFORE INSERT ON "public"."workflow_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."auto_share_approval_record"();



CREATE OR REPLACE TRIGGER "buyer_user_links_set_updated_at" BEFORE UPDATE ON "public"."buyer_user_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "chatter_files_versioning_trigger" BEFORE INSERT ON "public"."chatter_files" FOR EACH ROW EXECUTE FUNCTION "public"."handle_chatter_file_versioning"();



CREATE OR REPLACE TRIGGER "chatter_mentions_notification" AFTER INSERT ON "public"."chatter_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_chatter_mentions"();



CREATE OR REPLACE TRIGGER "departments_audit_trigger" AFTER UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_departments_changes"();



CREATE OR REPLACE TRIGGER "employees_audit_trigger" AFTER UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employees_changes"();



CREATE OR REPLACE TRIGGER "enforce_external_form_rate_limit" BEFORE INSERT ON "public"."form_external_login_attempts" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_external_form_rate_limit"();



CREATE OR REPLACE TRIGGER "form_versioning_trigger" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."create_form_version"();



CREATE OR REPLACE TRIGGER "normalize_cnpj_on_purchases_potential_suppliers" BEFORE INSERT OR UPDATE ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_cnpj"();



CREATE OR REPLACE TRIGGER "normalize_cnpj_on_sales_leads" BEFORE INSERT OR UPDATE ON "public"."sales_leads" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_cnpj"();



CREATE OR REPLACE TRIGGER "notify_access_request" AFTER INSERT ON "public"."pending_access_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_access_request"();



CREATE OR REPLACE TRIGGER "notify_chatter_general_trigger" AFTER INSERT ON "public"."chatter_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_chatter_general"();



CREATE OR REPLACE TRIGGER "prevent_fu_id_update" BEFORE UPDATE OF "fu_id" ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_prevent_fu_id_update"();



CREATE OR REPLACE TRIGGER "profiles_audit_trigger" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_profiles_changes"();



CREATE OR REPLACE TRIGGER "protheus_sa1010_80f17f00_status_change_trigger" AFTER INSERT OR UPDATE ON "public"."protheus_sa1010_80f17f00" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "protheus_sa1010_80f17f00_updated_at" BEFORE UPDATE ON "public"."protheus_sa1010_80f17f00" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_dynamic_tables_updated_at"();



CREATE OR REPLACE TRIGGER "protheus_sa3010_fc3d70f6_status_change_trigger" AFTER INSERT OR UPDATE ON "public"."protheus_sa3010_fc3d70f6" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "protheus_sa4010_ea26a13a_status_change_trigger" AFTER INSERT OR UPDATE ON "public"."protheus_sa4010_ea26a13a" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "revoke_auto_share_on_approval_trigger" AFTER UPDATE ON "public"."workflow_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."revoke_auto_share_on_approval"();



CREATE OR REPLACE TRIGGER "set_created_by_default" BEFORE INSERT ON "public"."purchases_material_type_buyer_queue" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "set_created_by_on_pu_supp_mat_types" BEFORE INSERT ON "public"."purchases_unified_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "set_current_timestamp_updated_at" BEFORE UPDATE ON "public"."purchases_material_type_buyer_queue" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_email_drafts_updated_at" BEFORE UPDATE ON "public"."email_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_microsoft_accounts_updated_at" BEFORE UPDATE ON "public"."microsoft_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_ms_oauth_tokens_updated_at" BEFORE UPDATE ON "public"."ms_oauth_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_site_documents_updated_at" BEFORE UPDATE ON "public"."site_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."user_notification_configs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_folders" BEFORE UPDATE ON "public"."folders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_unified_accounts_updated_at" BEFORE UPDATE ON "public"."unified_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_before_update_form_response_drafts" BEFORE UPDATE ON "public"."form_response_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_on_purchases_potential_suppliers" BEFORE UPDATE ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_portal_users" BEFORE UPDATE ON "public"."portal_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_sales_vendor_user_links" BEFORE UPDATE ON "public"."sales_vendor_user_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "site_cities_validate_codes" BEFORE INSERT OR UPDATE ON "public"."site_cities" FOR EACH ROW EXECUTE FUNCTION "public"."tg_validate_site_cities_codes"();



CREATE OR REPLACE TRIGGER "tasks_audit_trigger" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_tasks_changes"();



CREATE OR REPLACE TRIGGER "tg_claim_unified_supplier_ownership" BEFORE UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_claim_unified_supplier_ownership"();



CREATE OR REPLACE TRIGGER "tg_commercial_reps_set_updated_at" BEFORE UPDATE ON "public"."commercial_representatives" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_pegmt_set_created_by" BEFORE INSERT ON "public"."purchases_economic_group_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "tg_protheus_customer_groups_set_updated_at" BEFORE UPDATE ON "public"."protheus_customer_groups" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_protheus_supplier_groups_set_updated_at" BEFORE UPDATE ON "public"."protheus_supplier_groups" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_purchases_group_members_set_created_by" BEFORE INSERT ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "tg_purchases_groups_set_code_after" AFTER INSERT ON "public"."purchases_economic_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_purchases_group_code_after"();



CREATE OR REPLACE TRIGGER "tg_purchases_groups_set_created_by" BEFORE INSERT ON "public"."purchases_economic_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "tg_purchases_groups_updated_at" BEFORE UPDATE ON "public"."purchases_economic_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "tg_site_cities_set_updated_at" BEFORE UPDATE ON "public"."site_cities" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_update_acl_hash" BEFORE INSERT OR UPDATE OF "department_id", "folder_id" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."tg_update_acl_hash"();



CREATE OR REPLACE TRIGGER "tg_update_document_rag_capabilities" AFTER INSERT OR DELETE OR UPDATE ON "public"."doc_chunks" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_rag_capabilities"();



CREATE OR REPLACE TRIGGER "tg_validate_commercial_rep" BEFORE INSERT OR UPDATE ON "public"."commercial_representatives" FOR EACH ROW EXECUTE FUNCTION "public"."validate_commercial_rep"();



CREATE OR REPLACE TRIGGER "tg_vendor_user_links_updated_at" BEFORE UPDATE ON "public"."vendor_user_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_validate_sales_lead_city_not_null" BEFORE INSERT ON "public"."sales_leads" FOR EACH ROW EXECUTE FUNCTION "public"."tg_validate_sales_lead_city_not_null"();



CREATE OR REPLACE TRIGGER "trg_check_single_open_draft" BEFORE INSERT OR UPDATE ON "public"."task_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."check_single_open_draft"();



CREATE OR REPLACE TRIGGER "trg_cleanup_empty_purchases_group_ad" AFTER DELETE ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_cleanup_empty_purchases_group"();



CREATE OR REPLACE TRIGGER "trg_cleanup_empty_purchases_group_au" AFTER UPDATE OF "group_id" ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_cleanup_empty_purchases_group"();



CREATE OR REPLACE TRIGGER "trg_contact_links_updated_at" BEFORE UPDATE ON "public"."contact_links" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_copy_material_types_to_group_on_group_set" AFTER UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"();



CREATE OR REPLACE TRIGGER "trg_copy_potential_material_types_to_group" AFTER UPDATE OF "economic_group_id" ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_copy_potential_material_types_to_group"();



CREATE OR REPLACE TRIGGER "trg_ensure_site_product_name_id" BEFORE INSERT OR UPDATE OF "name", "name_id" ON "public"."site_products" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_site_product_name_id"();



CREATE OR REPLACE TRIGGER "trg_normalize_attendance_potential" BEFORE INSERT OR UPDATE ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_attendance_fields"();



CREATE OR REPLACE TRIGGER "trg_normalize_attendance_unified" BEFORE INSERT OR UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_attendance_fields"();



CREATE OR REPLACE TRIGGER "trg_pending_access_rate_limit" BEFORE INSERT ON "public"."pending_access_requests" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_pending_requests_rate_limit"();



CREATE OR REPLACE TRIGGER "trg_ppsmt_set_created_by" BEFORE INSERT ON "public"."purchases_potential_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "trg_ppsmt_set_updated_at" BEFORE UPDATE ON "public"."purchases_potential_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_prevent_delete_linked_protheus" BEFORE DELETE ON "public"."protheus_tables" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_delete_linked_protheus_table"();



CREATE OR REPLACE TRIGGER "trg_purchases_material_types_set_created_by" BEFORE INSERT ON "public"."purchases_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_default"();



CREATE OR REPLACE TRIGGER "trg_purchases_material_types_set_updated_at" BEFORE UPDATE ON "public"."purchases_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_purchases_unified_suppliers_normalize_cnpj" BEFORE INSERT OR UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_cnpj"();



CREATE OR REPLACE TRIGGER "trg_purchases_unified_suppliers_set_status" BEFORE INSERT OR UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_unified_supplier_status"();



CREATE OR REPLACE TRIGGER "trg_purchases_unified_suppliers_updated_at" BEFORE UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sales_leads_updated_at" BEFORE UPDATE ON "public"."sales_leads" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sales_leads_validate_source" BEFORE INSERT OR UPDATE ON "public"."sales_leads" FOR EACH ROW EXECUTE FUNCTION "public"."sales_leads_validate_source"();



CREATE OR REPLACE TRIGGER "trg_site_product_families_updated_at" BEFORE UPDATE ON "public"."site_product_families" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_site_product_segments_updated_at" BEFORE UPDATE ON "public"."site_product_segments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_site_products_updated_at" BEFORE UPDATE ON "public"."site_products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_attendance_potential_to_unified" AFTER INSERT OR UPDATE OF "attendance_type", "representative_id" ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_attendance_potential_to_unified"();



CREATE OR REPLACE TRIGGER "trg_sync_attendance_unified_to_potential" AFTER INSERT OR UPDATE OF "attendance_type", "representative_id" ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_attendance_unified_to_potential"();



CREATE OR REPLACE TRIGGER "trg_sync_buyer_from_potential_to_unified" AFTER UPDATE OF "assigned_buyer_cod", "assigned_buyer_filial" ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"();



CREATE OR REPLACE TRIGGER "trg_sync_buyer_from_unified_to_potential" AFTER INSERT OR UPDATE OF "assigned_buyer_cod", "assigned_buyer_filial" ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"();



CREATE OR REPLACE TRIGGER "trg_sync_has_group_del" AFTER DELETE ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_supplier_has_group"();



CREATE OR REPLACE TRIGGER "trg_sync_has_group_ins" AFTER INSERT ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_supplier_has_group"();



CREATE OR REPLACE TRIGGER "trg_sync_has_group_upd" AFTER UPDATE OF "unified_supplier_id", "group_id" ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_supplier_has_group"();



CREATE OR REPLACE TRIGGER "trg_sync_lead_group_from_unified_del" AFTER DELETE ON "public"."unified_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_lead_group_from_unified"();



CREATE OR REPLACE TRIGGER "trg_sync_lead_group_from_unified_insupd" AFTER INSERT OR UPDATE OF "economic_group_id", "lead_id" ON "public"."unified_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_lead_group_from_unified"();



CREATE OR REPLACE TRIGGER "trg_sync_potential_material_types_to_group_del" AFTER DELETE ON "public"."purchases_potential_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_potential_material_types_to_group"();



CREATE OR REPLACE TRIGGER "trg_sync_potential_material_types_to_group_ins" AFTER INSERT ON "public"."purchases_potential_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_potential_material_types_to_group"();



CREATE OR REPLACE TRIGGER "trg_sync_potential_tags_to_unified" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchases_potential_supplier_tags" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_potential_tags_to_unified"();



CREATE OR REPLACE TRIGGER "trg_sync_purchases_unified_has_group_aiud" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchases_economic_group_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_purchases_unified_has_group"();



CREATE OR REPLACE TRIGGER "trg_sync_unified_mat_types_to_potential_del" AFTER DELETE ON "public"."purchases_unified_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_material_types_to_potential"();



CREATE OR REPLACE TRIGGER "trg_sync_unified_mat_types_to_potential_ins" AFTER INSERT ON "public"."purchases_unified_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_material_types_to_potential"();



CREATE OR REPLACE TRIGGER "trg_sync_unified_mat_types_to_potential_upd" AFTER UPDATE ON "public"."purchases_unified_supplier_material_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_material_types_to_potential"();



CREATE OR REPLACE TRIGGER "trg_sync_unified_tags_to_potential" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchases_unified_supplier_tags" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_unified_tags_to_potential"();



CREATE OR REPLACE TRIGGER "trg_task_drafts_updated_at" BEFORE UPDATE ON "public"."task_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_task_templates_updated_at" BEFORE UPDATE ON "public"."task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tasks_mirror_due_date" BEFORE INSERT OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_mirror_expected_to_due_date"();



CREATE OR REPLACE TRIGGER "trg_tasks_normalize_tags" BEFORE INSERT OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_normalize_tags"();



CREATE OR REPLACE TRIGGER "trg_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_email_signatures_updated_at" BEFORE UPDATE ON "public"."email_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_signatures_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_shared_mailboxes_updated_at" BEFORE UPDATE ON "public"."microsoft_shared_mailboxes" FOR EACH ROW EXECUTE FUNCTION "public"."update_shared_mailboxes_updated_at"();



CREATE OR REPLACE TRIGGER "trg_validate_attendance" BEFORE INSERT OR UPDATE ON "public"."purchases_unified_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."purchases_unified_suppliers_validate_attendance"();



CREATE OR REPLACE TRIGGER "trigger_calculate_next_execution" BEFORE INSERT OR UPDATE ON "public"."workflow_auto_triggers" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_trigger_next_execution"();



CREATE OR REPLACE TRIGGER "trigger_emit_protheus_status_change_sa1010" AFTER INSERT OR UPDATE ON "public"."protheus_sa1010_80f17f00" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "trigger_emit_protheus_status_change_sa1010_80f17f00" AFTER INSERT OR UPDATE ON "public"."protheus_sa1010_80f17f00" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "trigger_emit_protheus_status_change_sa3010" AFTER INSERT OR UPDATE ON "public"."protheus_sa3010_fc3d70f6" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "trigger_emit_protheus_status_change_sa3010_fc3d70f6" AFTER INSERT OR UPDATE ON "public"."protheus_sa3010_fc3d70f6" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "trigger_emit_protheus_status_change_sa4010_ea26a13a" AFTER INSERT OR UPDATE ON "public"."protheus_sa4010_ea26a13a" FOR EACH ROW EXECUTE FUNCTION "public"."emit_protheus_status_change"();



CREATE OR REPLACE TRIGGER "trigger_form_versioning" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."handle_form_versioning"();



CREATE OR REPLACE TRIGGER "trigger_notify_new_access_request" AFTER INSERT ON "public"."pending_access_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_access_request"();



CREATE OR REPLACE TRIGGER "trigger_notify_record_shared" AFTER INSERT ON "public"."record_shares" FOR EACH ROW EXECUTE FUNCTION "public"."notify_record_shared"();



CREATE OR REPLACE TRIGGER "trigger_set_acl_hash" BEFORE INSERT OR UPDATE OF "department_id", "folder_id" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_document_acl_hash"();



CREATE OR REPLACE TRIGGER "trigger_update_document_acl_hash" BEFORE UPDATE OF "folder_id", "department_id" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_acl_hash"();



CREATE OR REPLACE TRIGGER "trigger_update_form_external_invitations_updated_at" BEFORE UPDATE ON "public"."form_external_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_form_external_invitations_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_task_series_updated_at" BEFORE UPDATE ON "public"."task_series" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_series_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_workflow_file_upload" AFTER INSERT ON "public"."chatter_files" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_file_uploaded"();



CREATE OR REPLACE TRIGGER "trigger_workflow_profile_changes" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_user_department_change"();



CREATE OR REPLACE TRIGGER "trigger_workflow_profile_created" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_record_created"();



CREATE OR REPLACE TRIGGER "trigger_workflow_task_changes" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_task_status_change"();



CREATE OR REPLACE TRIGGER "trigger_workflow_task_created" AFTER INSERT ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_record_created"();



CREATE OR REPLACE TRIGGER "trigger_workflow_task_edited" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_task_edited"();



CREATE OR REPLACE TRIGGER "trigger_workflow_user_login" AFTER UPDATE OF "last_login" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_user_login"();



CREATE OR REPLACE TRIGGER "update_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_conversation_updated_at"();



CREATE OR REPLACE TRIGGER "update_chatter_files_updated_at" BEFORE UPDATE ON "public"."chatter_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chatter_messages_updated_at" BEFORE UPDATE ON "public"."chatter_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contact_entities_updated_at" BEFORE UPDATE ON "public"."contact_entities" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "update_contact_entity_associations_updated_at" BEFORE UPDATE ON "public"."contact_entity_associations" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "update_contact_entity_external_partners_updated_at" BEFORE UPDATE ON "public"."contact_entity_external_partners" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "update_contact_entity_public_orgs_updated_at" BEFORE UPDATE ON "public"."contact_entity_public_orgs" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "update_contact_friend_family_links_updated_at" BEFORE UPDATE ON "public"."contact_friend_family_links" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "update_contact_partner_projects_updated_at" BEFORE UPDATE ON "public"."contact_partner_projects" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_department_permissions_updated_at" BEFORE UPDATE ON "public"."department_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_departments_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_documents_updated_at"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forms_updated_at" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ocr_cache_updated_at" BEFORE UPDATE ON "public"."ocr_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_portals_updated_at" BEFORE UPDATE ON "public"."portals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_processing_steps_updated_at" BEFORE UPDATE ON "public"."processing_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_processing_steps_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_protheus_binary_assets_updated_at" BEFORE UPDATE ON "public"."protheus_binary_assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_binary_assets_updated_at"();



CREATE OR REPLACE TRIGGER "update_protheus_config_updated_at" BEFORE UPDATE ON "public"."protheus_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_protheus_dynamic_tables_updated_at" BEFORE UPDATE ON "public"."protheus_dynamic_tables" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_dynamic_tables_updated_at"();



CREATE OR REPLACE TRIGGER "update_protheus_table_extra_fields_updated_at" BEFORE UPDATE ON "public"."protheus_table_extra_fields" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_tables_updated_at"();



CREATE OR REPLACE TRIGGER "update_protheus_table_relationships_updated_at" BEFORE UPDATE ON "public"."protheus_table_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_protheus_tables_updated_at" BEFORE UPDATE ON "public"."protheus_tables" FOR EACH ROW EXECUTE FUNCTION "public"."update_protheus_tables_updated_at"();



CREATE OR REPLACE TRIGGER "update_record_shares_updated_at" BEFORE UPDATE ON "public"."record_shares" FOR EACH ROW EXECUTE FUNCTION "public"."update_record_shares_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_product_applications_map_updated_at" BEFORE UPDATE ON "public"."site_product_applications_map" FOR EACH ROW EXECUTE FUNCTION "public"."update_site_product_applications_map_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_product_applications_updated_at" BEFORE UPDATE ON "public"."site_product_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_product_groups_map_updated_at" BEFORE UPDATE ON "public"."site_product_groups_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_product_groups_updated_at" BEFORE UPDATE ON "public"."site_product_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_site_product_names_updated_at" BEFORE UPDATE ON "public"."site_product_names" FOR EACH ROW EXECUTE FUNCTION "public"."update_site_product_names_updated_at"();



CREATE OR REPLACE TRIGGER "update_task_comments_updated_at" BEFORE UPDATE ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_task_templates_updated_at" BEFORE UPDATE ON "public"."task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_template_updated_at"();



CREATE OR REPLACE TRIGGER "update_task_types_updated_at" BEFORE UPDATE ON "public"."task_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_types_updated_at"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_email_preferences_updated_at" BEFORE UPDATE ON "public"."user_email_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_approvals_updated_at" BEFORE UPDATE ON "public"."workflow_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_corrections_updated_at" BEFORE UPDATE ON "public"."workflow_corrections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_execution_steps_updated_at" BEFORE UPDATE ON "public"."workflow_execution_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_queue_updated_at" BEFORE UPDATE ON "public"."workflow_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_templates_updated_at" BEFORE UPDATE ON "public"."workflow_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflows_updated_at" BEFORE UPDATE ON "public"."workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_source_on_purchases_potential_suppliers" BEFORE INSERT OR UPDATE ON "public"."purchases_potential_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."purchases_suppliers_validate_source"();



CREATE OR REPLACE TRIGGER "validate_unified_account_links_trg" BEFORE INSERT OR UPDATE ON "public"."unified_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."validate_unified_account_links"();



ALTER TABLE ONLY "public"."access_rejections"
    ADD CONSTRAINT "access_rejections_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversation_messages"
    ADD CONSTRAINT "ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_tokens"
    ADD CONSTRAINT "approval_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_tokens"
    ADD CONSTRAINT "approval_tokens_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chatter_email_messages"
    ADD CONSTRAINT "chatter_email_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chatter_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chatter_files"
    ADD CONSTRAINT "chatter_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chatter_messages"
    ADD CONSTRAINT "chatter_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chatter_messages"
    ADD CONSTRAINT "chatter_messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."chatter_messages"("id");



ALTER TABLE ONLY "public"."commercial_representatives"
    ADD CONSTRAINT "commercial_representatives_protheus_table_id_fkey" FOREIGN KEY ("protheus_table_id") REFERENCES "public"."protheus_tables"("id");



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id");



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_contact_entity_id_fkey" FOREIGN KEY ("contact_entity_id") REFERENCES "public"."contact_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."contact_entity_associations"
    ADD CONSTRAINT "contact_entity_associations_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_contact_entity_id_fkey" FOREIGN KEY ("contact_entity_id") REFERENCES "public"."contact_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."contact_entity_external_partners"
    ADD CONSTRAINT "contact_entity_external_partners_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id");



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_contact_entity_id_fkey" FOREIGN KEY ("contact_entity_id") REFERENCES "public"."contact_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."contact_entity_public_orgs"
    ADD CONSTRAINT "contact_entity_public_orgs_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contact_entity_tags"
    ADD CONSTRAINT "contact_entity_tags_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."contact_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_entity_tags"
    ADD CONSTRAINT "contact_entity_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."email_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_friend_family_link_employees"
    ADD CONSTRAINT "contact_friend_family_link_employees_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."contact_friend_family_links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_links"
    ADD CONSTRAINT "contact_links_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_partner_projects"
    ADD CONSTRAINT "contact_partner_projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contact_partner_projects"
    ADD CONSTRAINT "contact_partner_projects_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."contact_entity_external_partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_city_fk" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_responsible_department_fk" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_responsible_user_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."department_permissions"
    ADD CONSTRAINT "department_permissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_document_root_folder_id_fkey" FOREIGN KEY ("document_root_folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."doc_chunks"
    ADD CONSTRAINT "doc_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_version_chunks"
    ADD CONSTRAINT "document_version_chunks_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_replacement_document_id_fkey" FOREIGN KEY ("replacement_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_review_department_id_fkey" FOREIGN KEY ("review_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."economic_group_segments_map"
    ADD CONSTRAINT "economic_group_segments_map_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."protheus_customer_groups"("id_grupo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."economic_group_segments_map"
    ADD CONSTRAINT "economic_group_segments_map_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."site_product_segments"("id");



ALTER TABLE ONLY "public"."email_draft_shares"
    ADD CONSTRAINT "email_draft_shares_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."email_drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_draft_shares"
    ADD CONSTRAINT "email_draft_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_draft_tags"
    ADD CONSTRAINT "email_draft_tags_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."email_drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_draft_tags"
    ADD CONSTRAINT "email_draft_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."email_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_drafts"
    ADD CONSTRAINT "email_drafts_owner_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_signature_targets"
    ADD CONSTRAINT "email_signature_targets_microsoft_account_id_fkey" FOREIGN KEY ("microsoft_account_id") REFERENCES "public"."microsoft_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_signature_targets"
    ADD CONSTRAINT "email_signature_targets_shared_mailbox_id_fkey" FOREIGN KEY ("shared_mailbox_id") REFERENCES "public"."microsoft_shared_mailboxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_signature_targets"
    ADD CONSTRAINT "email_signature_targets_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "public"."email_signatures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_tags"
    ADD CONSTRAINT "email_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."field_audit_log"
    ADD CONSTRAINT "field_audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."unified_account_segments_map"
    ADD CONSTRAINT "fk_account_segments_account" FOREIGN KEY ("account_id") REFERENCES "public"."unified_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unified_account_segments_map"
    ADD CONSTRAINT "fk_account_segments_segment" FOREIGN KEY ("segment_id") REFERENCES "public"."site_product_segments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doc_chunks"
    ADD CONSTRAINT "fk_doc_chunks_document" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_logs"
    ADD CONSTRAINT "fk_document_access_logs_document_id" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_logs"
    ADD CONSTRAINT "fk_document_access_logs_folder_id" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_analytics"
    ADD CONSTRAINT "fk_form_analytics_form_id" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "fk_form_responses_form_id" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_products"
    ADD CONSTRAINT "fk_site_products_name_id" FOREIGN KEY ("name_id") REFERENCES "public"."site_product_names"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "fk_tasks_parent" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "fk_user_favorites_document_id" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "fk_user_favorites_folder_id" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_external_contacts"
    ADD CONSTRAINT "form_external_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_external_contacts"
    ADD CONSTRAINT "form_external_contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."form_external_contacts"
    ADD CONSTRAINT "form_external_contacts_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_external_invitations"
    ADD CONSTRAINT "form_external_invitations_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."form_responses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_external_recipients"
    ADD CONSTRAINT "form_external_recipients_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_external_sessions"
    ADD CONSTRAINT "form_external_sessions_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."form_external_recipients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_response_drafts"
    ADD CONSTRAINT "form_response_drafts_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_response_drafts"
    ADD CONSTRAINT "form_response_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_versions"
    ADD CONSTRAINT "form_versions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_parent_form_id_fkey" FOREIGN KEY ("parent_form_id") REFERENCES "public"."forms"("id");



ALTER TABLE ONLY "public"."ms_oauth_tokens"
    ADD CONSTRAINT "ms_oauth_tokens_microsoft_account_id_fkey" FOREIGN KEY ("microsoft_account_id") REFERENCES "public"."microsoft_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ocr_metrics"
    ADD CONSTRAINT "ocr_metrics_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pending_access_requests"
    ADD CONSTRAINT "pending_access_requests_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_users"
    ADD CONSTRAINT "portal_users_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "public"."portals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processing_performance_metrics"
    ADD CONSTRAINT "processing_performance_metrics_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."protheus_binary_assets"
    ADD CONSTRAINT "protheus_binary_assets_protheus_table_id_fkey" FOREIGN KEY ("protheus_table_id") REFERENCES "public"."protheus_tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_config"
    ADD CONSTRAINT "protheus_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_customer_group_units"
    ADD CONSTRAINT "protheus_customer_group_units_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."protheus_customer_group_units"
    ADD CONSTRAINT "protheus_customer_group_units_id_grupo_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."protheus_customer_groups"("id_grupo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_customer_groups"
    ADD CONSTRAINT "protheus_customer_groups_protheus_table_id_fkey" FOREIGN KEY ("protheus_table_id") REFERENCES "public"."protheus_tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_group_update_results"
    ADD CONSTRAINT "protheus_group_update_results_id_grupo_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."protheus_customer_groups"("id_grupo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_group_update_results"
    ADD CONSTRAINT "protheus_group_update_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."protheus_group_update_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_group_update_runs"
    ADD CONSTRAINT "protheus_group_update_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."protheus_supplier_groups"
    ADD CONSTRAINT "protheus_supplier_groups_protheus_table_id_fkey" FOREIGN KEY ("protheus_table_id") REFERENCES "public"."protheus_tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_supplier_material_types_map"
    ADD CONSTRAINT "protheus_supplier_material_types_map_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."protheus_supplier_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_table_extra_fields"
    ADD CONSTRAINT "protheus_table_extra_fields_protheus_table_id_fkey" FOREIGN KEY ("protheus_table_id") REFERENCES "public"."protheus_tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protheus_tables"
    ADD CONSTRAINT "protheus_tables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases_economic_group_material_types"
    ADD CONSTRAINT "purchases_economic_group_material_types_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."purchases_economic_groups"("id_grupo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_economic_group_material_types"
    ADD CONSTRAINT "purchases_economic_group_material_types_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "public"."purchases_material_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_economic_group_members"
    ADD CONSTRAINT "purchases_economic_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."purchases_economic_groups"("id_grupo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_economic_group_members"
    ADD CONSTRAINT "purchases_economic_group_members_unified_supplier_id_fkey" FOREIGN KEY ("unified_supplier_id") REFERENCES "public"."purchases_unified_suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_material_type_buyer_queue"
    ADD CONSTRAINT "purchases_material_type_buyer_queue_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "public"."purchases_material_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_potential_supplier_material_types"
    ADD CONSTRAINT "purchases_potential_supplier_material_typ_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "public"."purchases_material_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchases_potential_supplier_material_types"
    ADD CONSTRAINT "purchases_potential_supplier_material_types_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."purchases_potential_suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_potential_supplier_tags"
    ADD CONSTRAINT "purchases_potential_supplier_tags_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."purchases_potential_suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_potential_supplier_tags"
    ADD CONSTRAINT "purchases_potential_supplier_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."email_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_potential_suppliers"
    ADD CONSTRAINT "purchases_potential_suppliers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id");



ALTER TABLE ONLY "public"."purchases_potential_suppliers"
    ADD CONSTRAINT "purchases_potential_suppliers_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "public"."commercial_representatives"("id");



ALTER TABLE ONLY "public"."purchases_supplier_group_material_types"
    ADD CONSTRAINT "purchases_supplier_group_material_types_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."protheus_supplier_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_supplier_group_material_types"
    ADD CONSTRAINT "purchases_supplier_group_material_types_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "public"."purchases_material_types"("id");



ALTER TABLE ONLY "public"."purchases_unified_supplier_material_types"
    ADD CONSTRAINT "purchases_unified_supplier_material_types_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "public"."purchases_material_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_unified_supplier_material_types"
    ADD CONSTRAINT "purchases_unified_supplier_material_types_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."purchases_unified_suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_unified_supplier_tags"
    ADD CONSTRAINT "purchases_unified_supplier_tags_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."purchases_unified_suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_unified_supplier_tags"
    ADD CONSTRAINT "purchases_unified_supplier_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."email_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases_unified_suppliers"
    ADD CONSTRAINT "purchases_unified_suppliers_economic_group_id_fkey" FOREIGN KEY ("economic_group_id") REFERENCES "public"."protheus_supplier_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases_unified_suppliers"
    ADD CONSTRAINT "purchases_unified_suppliers_potential_supplier_id_fkey" FOREIGN KEY ("potential_supplier_id") REFERENCES "public"."purchases_potential_suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases_unified_suppliers"
    ADD CONSTRAINT "purchases_unified_suppliers_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "public"."commercial_representatives"("id") ON UPDATE RESTRICT ON DELETE SET NULL;



ALTER TABLE ONLY "public"."record_shares"
    ADD CONSTRAINT "record_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_shares"
    ADD CONSTRAINT "record_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_lead_tags"
    ADD CONSTRAINT "sales_lead_tags_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."sales_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_lead_tags"
    ADD CONSTRAINT "sales_lead_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."email_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_economic_group_id_fkey" FOREIGN KEY ("economic_group_id") REFERENCES "public"."protheus_customer_groups"("id_grupo") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "public"."commercial_representatives"("id");



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."site_product_segments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sales_vendor_user_links"
    ADD CONSTRAINT "sales_vendor_user_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_city_distance_errors"
    ADD CONSTRAINT "site_city_distance_errors_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."site_cities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_city_distance_errors"
    ADD CONSTRAINT "site_city_distance_errors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."site_city_distance_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_product_applications_map"
    ADD CONSTRAINT "site_product_applications_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."site_product_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_product_applications_map"
    ADD CONSTRAINT "site_product_applications_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."site_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_product_groups_map"
    ADD CONSTRAINT "site_product_groups_map_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."site_product_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_product_segments_map"
    ADD CONSTRAINT "site_product_segments_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."site_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_product_segments_map"
    ADD CONSTRAINT "site_product_segments_map_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."site_product_segments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_products"
    ADD CONSTRAINT "site_products_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."site_product_families"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_products"
    ADD CONSTRAINT "site_products_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "public"."site_product_names"("id");



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_draft_uploads"
    ADD CONSTRAINT "task_draft_uploads_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."task_drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_drafts"
    ADD CONSTRAINT "task_drafts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_drafts"
    ADD CONSTRAINT "task_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_history"
    ADD CONSTRAINT "task_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_history"
    ADD CONSTRAINT "task_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_series"
    ADD CONSTRAINT "task_series_base_template_id_fkey" FOREIGN KEY ("base_template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_series"
    ADD CONSTRAINT "task_series_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_department_fkey" FOREIGN KEY ("assigned_department") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "public"."task_series"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_task_type_id_fkey" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trusted_devices"
    ADD CONSTRAINT "trusted_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unified_accounts"
    ADD CONSTRAINT "unified_accounts_economic_group_id_fkey" FOREIGN KEY ("economic_group_id") REFERENCES "public"."protheus_customer_groups"("id_grupo") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."unified_accounts"
    ADD CONSTRAINT "unified_accounts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."sales_leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."unified_accounts"
    ADD CONSTRAINT "unified_accounts_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "public"."commercial_representatives"("id");



ALTER TABLE ONLY "public"."vendor_user_links"
    ADD CONSTRAINT "vendor_user_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_approvals"
    ADD CONSTRAINT "workflow_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_auto_triggers"
    ADD CONSTRAINT "workflow_auto_triggers_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_corrections"
    ADD CONSTRAINT "workflow_corrections_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."workflow_execution_steps"
    ADD CONSTRAINT "workflow_execution_steps_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id");



ALTER TABLE ONLY "public"."workflow_queue"
    ADD CONSTRAINT "workflow_queue_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_queue"
    ADD CONSTRAINT "workflow_queue_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Account creators and admins can delete unified account segments" ON "public"."unified_account_segments_map" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."unified_accounts" "ua"
  WHERE (("ua"."id" = "unified_account_segments_map"."account_id") AND ("ua"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Account creators and admins can insert unified account segments" ON "public"."unified_account_segments_map" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ((EXISTS ( SELECT 1
   FROM "public"."unified_accounts" "ua"
  WHERE (("ua"."id" = "unified_account_segments_map"."account_id") AND ("ua"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))));



CREATE POLICY "Acesso público para validação de token" ON "public"."form_external_invitations" FOR SELECT USING (true);



CREATE POLICY "Add supplier material types (owner)" ON "public"."purchases_unified_supplier_material_types" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Admins and directors can create portals" ON "public"."portals" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Admins and directors can delete association details" ON "public"."contact_entity_associations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can delete cities" ON "public"."site_cities" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can delete external partner details" ON "public"."contact_entity_external_partners" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can delete pending requests" ON "public"."pending_access_requests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can delete portals" ON "public"."portals" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can delete public org details" ON "public"."contact_entity_public_orgs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can insert association details" ON "public"."contact_entity_associations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can insert external partner details" ON "public"."contact_entity_external_partners" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can insert public org details" ON "public"."contact_entity_public_orgs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can manage all entity tags" ON "public"."contact_entity_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update any entity" ON "public"."contact_entities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update association details" ON "public"."contact_entity_associations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update cities" ON "public"."site_cities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update external partner details" ON "public"."contact_entity_external_partners" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update pending requests" ON "public"."pending_access_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update portals" ON "public"."portals" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update public org details" ON "public"."contact_entity_public_orgs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can update user roles and status" ON "public"."profiles" FOR UPDATE USING ("public"."can_modify_user_role"("id")) WITH CHECK ("public"."can_modify_user_role"("id"));



CREATE POLICY "Admins and directors can view all association details" ON "public"."contact_entity_associations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all contacts" ON "public"."contacts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all email prefs" ON "public"."user_email_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all entities" ON "public"."contact_entities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all entity tags" ON "public"."contact_entity_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all external partner details" ON "public"."contact_entity_external_partners" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all partner projects" ON "public"."contact_partner_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all pending requests" ON "public"."pending_access_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all public org details" ON "public"."contact_entity_public_orgs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins and directors can view all rejections" ON "public"."access_rejections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins can view all notification configs" ON "public"."user_notification_configs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins can view all notification logs" ON "public"."notification_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins can view all trusted devices" ON "public"."trusted_devices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete customer groups" ON "public"."protheus_customer_groups" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete external recipients" ON "public"."form_external_recipients" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete forms" ON "public"."forms" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete portal users" ON "public"."portal_users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete reps" ON "public"."commercial_representatives" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete site documents" ON "public"."site_documents" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete supplier groups" ON "public"."protheus_supplier_groups" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can delete vendor-user links" ON "public"."vendor_user_links" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert customer groups" ON "public"."protheus_customer_groups" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert external recipients" ON "public"."form_external_recipients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert portal users" ON "public"."portal_users" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Admins/directors can insert reps" ON "public"."commercial_representatives" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert site documents" ON "public"."site_documents" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert supplier groups" ON "public"."protheus_supplier_groups" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can insert vendor-user links" ON "public"."vendor_user_links" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can manage applications" ON "public"."site_product_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))));



CREATE POLICY "Admins/directors can manage product names" ON "public"."site_product_names" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update customer groups" ON "public"."protheus_customer_groups" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update external recipients" ON "public"."form_external_recipients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK (true);



CREATE POLICY "Admins/directors can update forms" ON "public"."forms" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update portal users" ON "public"."portal_users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK (true);



CREATE POLICY "Admins/directors can update reps" ON "public"."commercial_representatives" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update site documents" ON "public"."site_documents" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update supplier groups" ON "public"."protheus_supplier_groups" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can update vendor-user links" ON "public"."vendor_user_links" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can view active portal users" ON "public"."portal_users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) AND ("is_active" = true)));



CREATE POLICY "Admins/directors can view all site documents" ON "public"."site_documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can view chatter_email_messages" ON "public"."chatter_email_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can view external recipients" ON "public"."form_external_recipients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text") AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can view protheus_sa1010_80f17f00" ON "public"."protheus_sa1010_80f17f00" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Admins/directors can view protheus_sa3010_fc3d70f6" ON "public"."protheus_sa3010_fc3d70f6" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Anonymous users can create access requests" ON "public"."pending_access_requests" FOR INSERT WITH CHECK ((("name" IS NOT NULL) AND ("email" IS NOT NULL) AND ("department" IS NOT NULL) AND ("role" IS NOT NULL) AND ("length"("name") > 1) AND ("length"("name") < 200) AND ("length"("email") > 5) AND ("length"("email") < 200) AND ("length"("department") < 200) AND ("length"("role") < 100)));



CREATE POLICY "Anyone can read tags" ON "public"."email_tags" FOR SELECT USING (true);



CREATE POLICY "Anyone can submit responses to public forms" ON "public"."form_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_responses"."form_id") AND (("forms"."is_public" = true) OR ("forms"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Audit logs can be deleted by authenticated users" ON "public"."field_audit_log" FOR DELETE USING (true);



CREATE POLICY "Audit logs can be inserted by authenticated users" ON "public"."field_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Audit logs insert via functions" ON "public"."field_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Audit logs selectable by admins and directors" ON "public"."field_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Authenticated users can create templates" ON "public"."task_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authenticated users can delete documents" ON "public"."documents" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert cities" ON "public"."site_cities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authenticated users can insert documents" ON "public"."documents" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can read protheus_binary_assets" ON "public"."protheus_binary_assets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_config" ON "public"."protheus_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_customer_group_units" ON "public"."protheus_customer_group_units" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_customer_groups" ON "public"."protheus_customer_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_dynamic_tables" ON "public"."protheus_dynamic_tables" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_group_update_results" ON "public"."protheus_group_update_results" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_group_update_runs" ON "public"."protheus_group_update_runs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sa1010_80f17f00" ON "public"."protheus_sa1010_80f17f00" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sa2010_72a51158" ON "public"."protheus_sa2010_72a51158" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sa3010_fc3d70f6" ON "public"."protheus_sa3010_fc3d70f6" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sa4010_ea26a13a" ON "public"."protheus_sa4010_ea26a13a" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sb1010_b0316113" ON "public"."protheus_sb1010_b0316113" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_supplier_groups" ON "public"."protheus_supplier_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sy1010_3249e97a" ON "public"."protheus_sy1010_3249e97a" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sync_deletions" ON "public"."protheus_sync_deletions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sync_errors" ON "public"."protheus_sync_errors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_sync_logs" ON "public"."protheus_sync_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_table_extra_fields" ON "public"."protheus_table_extra_fields" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_table_relationships" ON "public"."protheus_table_relationships" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_tables" ON "public"."protheus_tables" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read protheus_usage_logs" ON "public"."protheus_usage_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update documents" ON "public"."documents" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view cities" ON "public"."site_cities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view documents" ON "public"."documents" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view portals" ON "public"."portals" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view product applications" ON "public"."site_product_applications_map" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view product groups" ON "public"."site_product_groups_map" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view product names" ON "public"."site_product_names" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view product segments" ON "public"."site_product_segments_map" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sa2010_72a51158" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sa4010_ea26a13a" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sa5010_6d3daa8e" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sb1010_b0316113" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sds010_f444bb4c" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view protheus data" ON "public"."protheus_sy1010_3249e97a" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view site applications" ON "public"."site_product_applications" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view site products" ON "public"."site_products" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view unified account segments" ON "public"."unified_account_segments_map" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view vendor-user links" ON "public"."vendor_user_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "Buyer links delete by owner or admins" ON "public"."buyer_user_links" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Buyer links insert by creator or admins" ON "public"."buyer_user_links" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Buyer links update by owner or admins" ON "public"."buyer_user_links" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Buyer links viewable by authenticated" ON "public"."buyer_user_links" FOR SELECT USING (true);



CREATE POLICY "Creators can delete own reps" ON "public"."commercial_representatives" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete own vendor-user links" ON "public"."vendor_user_links" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete their tags" ON "public"."email_tags" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can insert own reps" ON "public"."commercial_representatives" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can insert own vendor-user links" ON "public"."vendor_user_links" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update own reps" ON "public"."commercial_representatives" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update own vendor-user links" ON "public"."vendor_user_links" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update their product names" ON "public"."site_product_names" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update/delete their tags" ON "public"."email_tags" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Customer group units manageable by admins/directors" ON "public"."protheus_customer_group_units" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Customer group units viewable by authenticated users" ON "public"."protheus_customer_group_units" FOR SELECT USING (true);



CREATE POLICY "Customer groups viewable by authenticated users" ON "public"."protheus_customer_groups" FOR SELECT USING (true);



CREATE POLICY "Deny all access to anonymous users" ON "public"."portal_users" TO "anon" USING (false);



CREATE POLICY "Deny anonymous access to field_audit_log" ON "public"."field_audit_log" TO "anon" USING (false);



CREATE POLICY "Deny anonymous access to password_reset_tokens" ON "public"."password_reset_tokens" TO "anon" USING (false);



CREATE POLICY "Deny anonymous access to trusted_devices" ON "public"."trusted_devices" TO "anon" USING (false);



CREATE POLICY "Department permissions are viewable by authenticated users" ON "public"."department_permissions" FOR SELECT USING (true);



CREATE POLICY "Departments are viewable by authenticated users" ON "public"."departments" FOR SELECT USING (true);



CREATE POLICY "Departments can be created by admins/directors" ON "public"."departments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Departments can be deleted by admins/directors" ON "public"."departments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Departments can be updated by admins/directors" ON "public"."departments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Documents managed by admins" ON "public"."documents" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "Documents selectable by dept members or admins" ON "public"."documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])) OR ("p"."department_id" = "documents"."department_id"))))));



CREATE POLICY "Economic group segments delete by owner or admins" ON "public"."economic_group_segments_map" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Economic group segments insert by owner or admins" ON "public"."economic_group_segments_map" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Economic group segments viewable by authenticated" ON "public"."economic_group_segments_map" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Employee documents are viewable by authenticated users" ON "public"."employee_documents" FOR SELECT USING (true);



CREATE POLICY "Employee documents can be created by authenticated users" ON "public"."employee_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Employee documents can be deleted by uploader or HR/Directors" ON "public"."employee_documents" FOR DELETE USING ((("auth"."uid"() = "uploaded_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'hr'::"text") OR ("profiles"."role" = 'director'::"text")))))));



CREATE POLICY "Employee documents can be updated by uploader or HR/Directors" ON "public"."employee_documents" FOR UPDATE USING ((("auth"."uid"() = "uploaded_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'hr'::"text") OR ("profiles"."role" = 'director'::"text")))))));



CREATE POLICY "Employees can be created by HR/Directors" ON "public"."employees" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'hr'::"text") OR ("profiles"."role" = 'director'::"text") OR ("profiles"."is_leader" = true))))));



CREATE POLICY "Employees can be deleted by HR/Directors" ON "public"."employees" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'hr'::"text") OR ("profiles"."role" = 'director'::"text") OR ("profiles"."is_leader" = true))))));



CREATE POLICY "Employees can be updated by HR/Directors" ON "public"."employees" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'hr'::"text") OR ("profiles"."role" = 'director'::"text") OR ("profiles"."is_leader" = true))))));



CREATE POLICY "Everyone can view active applications" ON "public"."site_product_applications" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Families: owners can insert" ON "public"."site_product_families" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Families: owners can select" ON "public"."site_product_families" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Families: owners/admin can delete" ON "public"."site_product_families" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Families: owners/admin can update" ON "public"."site_product_families" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Folders managed by admins" ON "public"."folders" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "Folders selectable by dept members or admins" ON "public"."folders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])) OR ("p"."department_id" = "folders"."department_id"))))));



CREATE POLICY "Form creators can manage versions" ON "public"."form_versions" USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_versions"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form creators can view analytics" ON "public"."form_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_analytics"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form creators can view drafts for their forms" ON "public"."form_response_drafts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_response_drafts"."form_id") AND ("f"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form creators can view responses" ON "public"."form_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_responses"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form owners can delete external recipients" ON "public"."form_external_recipients" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_external_recipients"."form_id") AND ("f"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form owners can insert external recipients" ON "public"."form_external_recipients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_external_recipients"."form_id") AND ("f"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form owners can update external recipients" ON "public"."form_external_recipients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_external_recipients"."form_id") AND ("f"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_external_recipients"."form_id") AND ("f"."created_by" = "auth"."uid"())))));



CREATE POLICY "Form owners can view external recipients" ON "public"."form_external_recipients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_external_recipients"."form_id") AND ("f"."created_by" = "auth"."uid"())))));



CREATE POLICY "Functions can read app settings" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "Group update results manageable by admins/directors" ON "public"."protheus_group_update_results" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Group update results viewable by authenticated users" ON "public"."protheus_group_update_results" FOR SELECT USING (true);



CREATE POLICY "Group update runs manageable by admins/directors" ON "public"."protheus_group_update_runs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Group update runs viewable by authenticated users" ON "public"."protheus_group_update_runs" FOR SELECT USING (true);



CREATE POLICY "HR/admins can delete employees" ON "public"."employees" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "HR/admins can insert employees" ON "public"."employees" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "HR/admins can update employees" ON "public"."employees" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "HR/admins can view employees" ON "public"."employees" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))));



CREATE POLICY "Leads delete by owner or admins" ON "public"."sales_leads" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Leads insert by owner" ON "public"."sales_leads" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Leads update by owner or admins" ON "public"."sales_leads" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Leads viewable by owner or admins" ON "public"."sales_leads" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Map: owners can insert" ON "public"."site_product_segments_map" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."site_products" "sp"
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND ("sp"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Map: owners/admin can delete" ON "public"."site_product_segments_map" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."site_products" "sp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND (("sp"."created_by" = "auth"."uid"()) OR (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))));



CREATE POLICY "Map: owners/admin can select" ON "public"."site_product_segments_map" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."site_products" "sp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND (("sp"."created_by" = "auth"."uid"()) OR (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))));



CREATE POLICY "Map: owners/admin can update" ON "public"."site_product_segments_map" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."site_products" "sp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND (("sp"."created_by" = "auth"."uid"()) OR (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."site_products" "sp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND (("sp"."created_by" = "auth"."uid"()) OR (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))));



CREATE POLICY "Material types delete by owner or admins" ON "public"."purchases_material_types" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Material types insert by creator" ON "public"."purchases_material_types" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Material types update by owner or admins" ON "public"."purchases_material_types" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Material types viewable by authenticated" ON "public"."purchases_material_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "No direct user access to login attempts" ON "public"."form_external_login_attempts" TO "authenticated", "anon" USING (false);



CREATE POLICY "No direct user access to reset tokens" ON "public"."password_reset_tokens" TO "authenticated", "anon" USING (false);



CREATE POLICY "Only admins and directors can create department permissions" ON "public"."department_permissions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins and directors can delete department permissions" ON "public"."department_permissions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins and directors can update department permissions" ON "public"."department_permissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins can view cron job logs" ON "public"."cron_job_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins/directors can delete vendor links" ON "public"."sales_vendor_user_links" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins/directors can insert vendor links" ON "public"."sales_vendor_user_links" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only admins/directors can update vendor links" ON "public"."sales_vendor_user_links" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Only owners can delete drafts" ON "public"."email_drafts" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Owners and sharees can manage draft tags" ON "public"."email_draft_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."email_drafts" "d"
  WHERE (("d"."id" = "email_draft_tags"."draft_id") AND (("d"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."email_draft_shares" "s"
          WHERE (("s"."draft_id" = "d"."id") AND ("s"."user_id" = "auth"."uid"()))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."email_drafts" "d"
  WHERE (("d"."id" = "email_draft_tags"."draft_id") AND (("d"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."email_draft_shares" "s"
          WHERE (("s"."draft_id" = "d"."id") AND ("s"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Owners and sharees can read drafts" ON "public"."email_drafts" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."email_draft_shares" "s"
  WHERE (("s"."draft_id" = "email_drafts"."id") AND ("s"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Owners and sharees can update drafts" ON "public"."email_drafts" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."email_draft_shares" "s"
  WHERE (("s"."draft_id" = "email_drafts"."id") AND ("s"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Owners can create lead-tag links" ON "public"."sales_lead_tags" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."sales_leads" "l"
  WHERE (("l"."id" = "sales_lead_tags"."lead_id") AND ("l"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Owners can delete their lead-tag links" ON "public"."sales_lead_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."sales_leads" "l"
  WHERE (("l"."id" = "sales_lead_tags"."lead_id") AND ("l"."created_by" = "auth"."uid"())))));



CREATE POLICY "Owners can manage shares for their drafts" ON "public"."email_draft_shares" USING ((EXISTS ( SELECT 1
   FROM "public"."email_drafts" "d"
  WHERE (("d"."id" = "email_draft_shares"."draft_id") AND ("d"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."email_drafts" "d"
  WHERE (("d"."id" = "email_draft_shares"."draft_id") AND ("d"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Owners can update their lead-tag links" ON "public"."sales_lead_tags" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."sales_leads" "l"
  WHERE (("l"."id" = "sales_lead_tags"."lead_id") AND ("l"."created_by" = "auth"."uid"()))))) WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."sales_leads" "l"
  WHERE (("l"."id" = "sales_lead_tags"."lead_id") AND ("l"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Owners can view their lead-tag links" ON "public"."sales_lead_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sales_leads" "l"
  WHERE (("l"."id" = "sales_lead_tags"."lead_id") AND ("l"."created_by" = "auth"."uid"())))));



CREATE POLICY "PEGMT delete by owner or admins" ON "public"."purchases_economic_group_material_types" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "PEGMT insert by owner or admins" ON "public"."purchases_economic_group_material_types" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "PEGMT viewable by authenticated" ON "public"."purchases_economic_group_material_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "PSGMT delete by owner or admins" ON "public"."purchases_supplier_group_material_types" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "PSGMT insert by owner or admins" ON "public"."purchases_supplier_group_material_types" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "PSGMT viewable by authenticated" ON "public"."purchases_supplier_group_material_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Portal owner can delete portal users" ON "public"."portal_users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portals" "prt"
  WHERE (("prt"."id" = "portal_users"."portal_id") AND ("prt"."created_by" = "auth"."uid"())))));



CREATE POLICY "Portal owner can insert portal users" ON "public"."portal_users" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."portals" "prt"
  WHERE (("prt"."id" = "portal_users"."portal_id") AND ("prt"."created_by" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Portal owner can update portal users" ON "public"."portal_users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."portals" "prt"
  WHERE (("prt"."id" = "portal_users"."portal_id") AND ("prt"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."portals" "prt"
  WHERE (("prt"."id" = "portal_users"."portal_id") AND ("prt"."created_by" = "auth"."uid"())))));



CREATE POLICY "Portal owner can view portal users" ON "public"."portal_users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."portals" "prt"
  WHERE (("prt"."id" = "portal_users"."portal_id") AND ("prt"."created_by" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text")))) AND ("is_active" = true)));



CREATE POLICY "Potential suppliers delete by owner or admins" ON "public"."purchases_potential_suppliers" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Potential suppliers insert by owner or admins" ON "public"."purchases_potential_suppliers" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Potential suppliers update by owner or admins" ON "public"."purchases_potential_suppliers" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Potential suppliers viewable by authenticated" ON "public"."purchases_potential_suppliers" FOR SELECT USING (true);



CREATE POLICY "Products: owners can insert" ON "public"."site_products" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Products: owners/admin can delete" ON "public"."site_products" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Products: owners/admin can select" ON "public"."site_products" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Products: owners/admin can update" ON "public"."site_products" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Profiles can be deleted by authenticated users" ON "public"."profiles" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Profiles can be inserted by authenticated users" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Public can view published site documents" ON "public"."site_documents" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public select active site_product_applications" ON "public"."site_product_applications" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public select active site_product_names" ON "public"."site_product_names" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public select active site_products" ON "public"."site_products" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public select site_product_applications_map" ON "public"."site_product_applications_map" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."site_products" "p"
  WHERE (("p"."id" = "site_product_applications_map"."product_id") AND ("p"."is_active" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."site_product_applications" "a"
  WHERE (("a"."id" = "site_product_applications_map"."application_id") AND ("a"."is_active" = true))))));



CREATE POLICY "Public select site_product_groups_map" ON "public"."site_product_groups_map" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."site_products" "p"
  WHERE (("p"."id" = "site_product_groups_map"."product_id") AND ("p"."is_active" = true)))));



CREATE POLICY "Public select site_product_segments_map" ON "public"."site_product_segments_map" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."site_products" "p"
  WHERE (("p"."id" = "site_product_segments_map"."product_id") AND ("p"."is_active" = true)))));



CREATE POLICY "Public site can view active families" ON "public"."site_product_families" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public site can view active product-segment mapping" ON "public"."site_product_segments_map" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."site_products" "sp"
  WHERE (("sp"."id" = "site_product_segments_map"."product_id") AND ("sp"."is_active" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."site_product_segments" "ss"
  WHERE (("ss"."id" = "site_product_segments_map"."segment_id") AND ("ss"."is_active" = true))))));



CREATE POLICY "Public site can view active products" ON "public"."site_products" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public site can view active segments" ON "public"."site_product_segments" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Purchases group members delete by owner or admins" ON "public"."purchases_economic_group_members" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases group members insert by creator or admins" ON "public"."purchases_economic_group_members" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases group members update by owner or admins" ON "public"."purchases_economic_group_members" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases group members viewable by authenticated" ON "public"."purchases_economic_group_members" FOR SELECT USING (true);



CREATE POLICY "Purchases groups delete by owner or admins" ON "public"."purchases_economic_groups" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases groups insert by creator or admins" ON "public"."purchases_economic_groups" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases groups update by owner or admins" ON "public"."purchases_economic_groups" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Purchases groups viewable by authenticated" ON "public"."purchases_economic_groups" FOR SELECT USING (true);



CREATE POLICY "Queue delete by owner/type-owner/admins" ON "public"."purchases_material_type_buyer_queue" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_material_types" "mt"
  WHERE (("mt"."id" = "purchases_material_type_buyer_queue"."material_type_id") AND ("mt"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Queue insert by owner/type-owner/admins" ON "public"."purchases_material_type_buyer_queue" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_material_types" "mt"
  WHERE (("mt"."id" = "purchases_material_type_buyer_queue"."material_type_id") AND ("mt"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Queue update by owner/type-owner/admins" ON "public"."purchases_material_type_buyer_queue" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_material_types" "mt"
  WHERE (("mt"."id" = "purchases_material_type_buyer_queue"."material_type_id") AND ("mt"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_material_types" "mt"
  WHERE (("mt"."id" = "purchases_material_type_buyer_queue"."material_type_id") AND ("mt"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Queue viewable by authenticated" ON "public"."purchases_material_type_buyer_queue" FOR SELECT USING (true);



CREATE POLICY "Remove own supplier material types" ON "public"."purchases_unified_supplier_material_types" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Reps viewable by authenticated users" ON "public"."commercial_representatives" FOR SELECT USING (true);



CREATE POLICY "Segments: owners can insert" ON "public"."site_product_segments" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Segments: owners can select" ON "public"."site_product_segments" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Segments: owners/admin can delete" ON "public"."site_product_segments" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Segments: owners/admin can update" ON "public"."site_product_segments" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text")))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) AND ("p"."status" = 'active'::"text"))))));



CREATE POLICY "Service role can manage cache" ON "public"."ocr_cache" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage metrics" ON "public"."ocr_metrics" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role full access on protheus_binary_assets" ON "public"."protheus_binary_assets" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Sharees can read share entries for their access" ON "public"."email_draft_shares" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Signature targets are viewable by owner" ON "public"."email_signature_targets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Signature targets can be deleted by owner" ON "public"."email_signature_targets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Signature targets can be inserted by owner with ownership check" ON "public"."email_signature_targets" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."email_signatures" "s"
  WHERE (("s"."id" = "email_signature_targets"."signature_id") AND ("s"."user_id" = "auth"."uid"())))) AND ((("microsoft_account_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "email_signature_targets"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"()))))) OR (("shared_mailbox_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."microsoft_shared_mailboxes" "sm"
  WHERE (("sm"."id" = "email_signature_targets"."shared_mailbox_id") AND ("sm"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Signature targets can be updated by owner with ownership checks" ON "public"."email_signature_targets" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."email_signatures" "s"
  WHERE (("s"."id" = "email_signature_targets"."signature_id") AND ("s"."user_id" = "auth"."uid"())))) AND ((("microsoft_account_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "email_signature_targets"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"()))))) OR (("shared_mailbox_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."microsoft_shared_mailboxes" "sm"
  WHERE (("sm"."id" = "email_signature_targets"."shared_mailbox_id") AND ("sm"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Signatures are viewable by owner" ON "public"."email_signatures" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Signatures can be deleted by owner" ON "public"."email_signatures" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Signatures can be inserted by owner" ON "public"."email_signatures" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Signatures can be updated by owner" ON "public"."email_signatures" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Supplier groups viewable by authenticated users" ON "public"."protheus_supplier_groups" FOR SELECT USING (true);



CREATE POLICY "Supplier material types delete by owner or admins" ON "public"."protheus_supplier_material_types_map" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Supplier material types insert by owner or admins" ON "public"."protheus_supplier_material_types_map" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Supplier material types viewable by authenticated" ON "public"."protheus_supplier_material_types_map" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Supplier material types viewable by authenticated" ON "public"."purchases_unified_supplier_material_types" FOR SELECT USING (true);



CREATE POLICY "Supplier tag links deletable by creator or admins" ON "public"."purchases_potential_supplier_tags" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Supplier tag links insertable by creator" ON "public"."purchases_potential_supplier_tags" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Supplier tag links viewable by authenticated" ON "public"."purchases_potential_supplier_tags" FOR SELECT USING (true);



CREATE POLICY "System can access tokens for validation" ON "public"."form_publication_tokens" FOR SELECT USING (true);



CREATE POLICY "System can create analytics" ON "public"."form_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create document versions" ON "public"."document_versions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create notification logs" ON "public"."notification_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."app_notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create performance metrics" ON "public"."processing_performance_metrics" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create protheus logs" ON "public"."protheus_usage_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create rejections" ON "public"."access_rejections" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create sync logs" ON "public"."protheus_sync_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create workflow approvals" ON "public"."workflow_approvals" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create workflow corrections" ON "public"."workflow_corrections" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create workflow trigger logs" ON "public"."workflow_trigger_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can delete chunks" ON "public"."doc_chunks" FOR DELETE USING (true);



CREATE POLICY "System can insert chunks" ON "public"."doc_chunks" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert cron job logs" ON "public"."cron_job_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert deletion logs" ON "public"."protheus_sync_deletions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert sync errors" ON "public"."protheus_sync_errors" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert task history" ON "public"."task_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage api health" ON "public"."api_health_status" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage cache" ON "public"."processing_cache" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage distance errors" ON "public"."site_city_distance_errors" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage distance jobs" ON "public"."site_city_distance_jobs" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage dynamic tables" ON "public"."protheus_dynamic_tables" USING (true);



CREATE POLICY "System can manage external login attempts" ON "public"."form_external_login_attempts" TO "service_role" USING (true);



CREATE POLICY "System can manage external sessions" ON "public"."form_external_sessions" TO "service_role" USING (true);



CREATE POLICY "System can manage password reset tokens" ON "public"."password_reset_tokens" TO "service_role" USING (true);



CREATE POLICY "System can manage processing steps" ON "public"."processing_steps" USING (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sa2010_72a51158" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sa4010_ea26a13a" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sa5010_6d3daa8e" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sb1010_b0316113" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sds010_f444bb4c" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage protheus data" ON "public"."protheus_sy1010_3249e97a" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage version chunks" ON "public"."document_version_chunks" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage workflow execution steps" ON "public"."workflow_execution_steps" USING (true);



CREATE POLICY "System can manage workflow executions" ON "public"."workflow_executions" USING (true);



CREATE POLICY "System can manage workflow queue" ON "public"."workflow_queue" USING (true);



CREATE POLICY "System can update chunks" ON "public"."doc_chunks" FOR UPDATE USING (true);



CREATE POLICY "System can update document versions" ON "public"."document_versions" FOR UPDATE USING (true);



CREATE POLICY "System can update sync logs" ON "public"."protheus_sync_logs" FOR UPDATE USING (true);



CREATE POLICY "Template creators can delete" ON "public"."task_templates" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Template creators can update" ON "public"."task_templates" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Unified accounts delete by admins/directors" ON "public"."unified_accounts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Unified accounts delete by creator" ON "public"."unified_accounts" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified accounts insert by admins/directors" ON "public"."unified_accounts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Unified accounts insert by creator" ON "public"."unified_accounts" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified accounts update by admins/directors" ON "public"."unified_accounts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "Unified accounts update by creator" ON "public"."unified_accounts" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified accounts viewable by authenticated users" ON "public"."unified_accounts" FOR SELECT USING (true);



CREATE POLICY "Unified supplier tags delete by creator" ON "public"."purchases_unified_supplier_tags" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified supplier tags insert by creator" ON "public"."purchases_unified_supplier_tags" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified supplier tags update by creator" ON "public"."purchases_unified_supplier_tags" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Unified supplier tags viewable by authenticated" ON "public"."purchases_unified_supplier_tags" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."uid"() IS NOT NULL)));



CREATE POLICY "Unified suppliers delete by owner or admins" ON "public"."purchases_unified_suppliers" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Unified suppliers insert by creator or admins" ON "public"."purchases_unified_suppliers" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Unified suppliers update by owner or admins" ON "public"."purchases_unified_suppliers" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("created_by" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR ("created_by" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Unified suppliers viewable by authenticated" ON "public"."purchases_unified_suppliers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users are viewable by authenticated users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can be deleted by authenticated users" ON "public"."users" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Users can be inserted by authenticated users" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can be updated by authenticated users" ON "public"."users" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can create application mappings" ON "public"."site_product_applications_map" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create chatter messages" ON "public"."chatter_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create employee links for their friend/family links" ON "public"."contact_friend_family_link_employees" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."contact_friend_family_links" "ff"
     JOIN "public"."contacts" "c" ON (("c"."id" = "ff"."contact_id")))
  WHERE (("ff"."id" = "contact_friend_family_link_employees"."link_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can create extra fields for their tables" ON "public"."protheus_table_extra_fields" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."protheus_tables" "pt"
  WHERE (("pt"."id" = "protheus_table_extra_fields"."protheus_table_id") AND (("pt"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can create forms" ON "public"."forms" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create messages in own conversations" ON "public"."ai_conversation_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_conversation_messages"."conversation_id") AND ("c"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create own chatter emails" ON "public"."chatter_email_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create own conversations" ON "public"."ai_conversations" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create own drafts" ON "public"."task_drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own trusted devices" ON "public"."trusted_devices" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create product group mappings" ON "public"."site_product_groups_map" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create product groups" ON "public"."site_product_groups" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create projects for their own partners" ON "public"."contact_partner_projects" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."contact_entity_external_partners" "ep"
     JOIN "public"."contact_entities" "ce" ON (("ce"."id" = "ep"."contact_entity_id")))
  WHERE (("ep"."id" = "contact_partner_projects"."partner_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create protheus table relationships" ON "public"."protheus_table_relationships" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create protheus tables" ON "public"."protheus_tables" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create record shares" ON "public"."record_shares" FOR INSERT WITH CHECK (("shared_by" = "auth"."uid"()));



CREATE POLICY "Users can create tags" ON "public"."email_tags" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create task comments" ON "public"."task_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create task dependencies for tasks they manage" ON "public"."task_dependencies" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tasks" "t1"
  WHERE (("t1"."id" = "task_dependencies"."task_id") AND (("t1"."created_by" = "auth"."uid"()) OR ("t1"."assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can create task types" ON "public"."task_types" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own access logs" ON "public"."document_access_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own association details" ON "public"."contact_entity_associations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_associations"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create their own contacts" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own entities" ON "public"."contact_entities" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own external partner details" ON "public"."contact_entity_external_partners" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_external_partners"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create their own friend/family links" ON "public"."contact_friend_family_links" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_friend_family_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can create their own notification configs" ON "public"."user_notification_configs" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Users can create their own protheus config" ON "public"."protheus_config" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own public org details" ON "public"."contact_entity_public_orgs" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create tokens for their forms" ON "public"."form_publication_tokens" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_publication_tokens"."form_id") AND ("forms"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Users can create workflow auto triggers" ON "public"."workflow_auto_triggers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_auto_triggers"."workflow_id") AND ("w"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create workflow templates" ON "public"."workflow_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create workflows" ON "public"."workflows" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete application mappings" ON "public"."site_product_applications_map" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete applications with permissions" ON "public"."site_product_applications" FOR DELETE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can delete approved files they uploaded" ON "public"."chatter_files" FOR DELETE USING ((("uploaded_by" = "auth"."uid"()) AND ("approval_status" = 'approved'::"public"."approval_status")));



CREATE POLICY "Users can delete employee links for their friend/family links" ON "public"."contact_friend_family_link_employees" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM ("public"."contact_friend_family_links" "ff"
     JOIN "public"."contacts" "c" ON (("c"."id" = "ff"."contact_id")))
  WHERE (("ff"."id" = "contact_friend_family_link_employees"."link_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete extra fields for their tables" ON "public"."protheus_table_extra_fields" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."protheus_tables" "pt"
  WHERE (("pt"."id" = "protheus_table_extra_fields"."protheus_table_id") AND (("pt"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can delete own chatter emails" ON "public"."chatter_email_messages" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can delete own conversations" ON "public"."ai_conversations" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete own email prefs" ON "public"."user_email_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own trusted devices" ON "public"."trusted_devices" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete product applications with permissions" ON "public"."site_product_applications_map" FOR DELETE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can delete product group mappings" ON "public"."site_product_groups_map" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete product groups" ON "public"."site_product_groups" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete product groups with permissions" ON "public"."site_product_groups_map" FOR DELETE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can delete product segments with permissions" ON "public"."site_product_segments_map" FOR DELETE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can delete projects of their own partners" ON "public"."contact_partner_projects" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."contact_entity_external_partners" "ep"
     JOIN "public"."contact_entities" "ce" ON (("ce"."id" = "ep"."contact_entity_id")))
  WHERE (("ep"."id" = "contact_partner_projects"."partner_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete site products with permissions" ON "public"."site_products" FOR DELETE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can delete task dependencies for tasks they manage" ON "public"."task_dependencies" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."tasks" "t1"
  WHERE (("t1"."id" = "task_dependencies"."task_id") AND (("t1"."created_by" = "auth"."uid"()) OR ("t1"."assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can delete tasks they created" ON "public"."tasks" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their forms" ON "public"."forms" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own association details" ON "public"."contact_entity_associations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_associations"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own chatter messages" ON "public"."chatter_messages" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can delete their own contacts" ON "public"."contacts" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own entities" ON "public"."contact_entities" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own external partner details" ON "public"."contact_entity_external_partners" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_external_partners"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own friend/family links" ON "public"."contact_friend_family_links" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_friend_family_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their own notification configs" ON "public"."user_notification_configs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."app_notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own public org details" ON "public"."contact_entity_public_orgs" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own shared mailboxes" ON "public"."microsoft_shared_mailboxes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own shares" ON "public"."record_shares" FOR DELETE USING (("shared_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own tokens" ON "public"."ms_oauth_tokens" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "ms_oauth_tokens"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their protheus table relationships" ON "public"."protheus_table_relationships" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their protheus tables" ON "public"."protheus_tables" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their task attachments" ON "public"."task_attachments" FOR DELETE USING ((("auth"."uid"() = "uploaded_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their task comments" ON "public"."task_comments" FOR DELETE USING ((("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can delete their task types" ON "public"."task_types" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their workflow auto triggers" ON "public"."workflow_auto_triggers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_auto_triggers"."workflow_id") AND ("w"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their workflow templates" ON "public"."workflow_templates" FOR DELETE USING ((("auth"."uid"() = "created_by") OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"]))))) AND "public"."can_access_workflow"("confidentiality_level", "auth"."uid"()))));



CREATE POLICY "Users can delete their workflows" ON "public"."workflows" FOR DELETE USING (((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))) AND "public"."can_access_workflow"("confidentiality_level", "auth"."uid"())));



CREATE POLICY "Users can insert applications with permissions" ON "public"."site_product_applications" FOR INSERT WITH CHECK ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can insert own email prefs" ON "public"."user_email_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert product applications with permissions" ON "public"."site_product_applications_map" FOR INSERT WITH CHECK ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can insert product groups with permissions" ON "public"."site_product_groups_map" FOR INSERT WITH CHECK ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can insert product segments with permissions" ON "public"."site_product_segments_map" FOR INSERT WITH CHECK ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can insert site products with permissions" ON "public"."site_products" FOR INSERT WITH CHECK ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can insert their own drafts" ON "public"."email_drafts" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own product names" ON "public"."site_product_names" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own shared mailboxes" ON "public"."microsoft_shared_mailboxes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tokens" ON "public"."ms_oauth_tokens" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "ms_oauth_tokens"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage tags of their own entities" ON "public"."contact_entity_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_tags"."entity_id") AND ("ce"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_tags"."entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can manage task dependencies" ON "public"."task_dependencies" USING (true);



CREATE POLICY "Users can manage their own drafts" ON "public"."form_response_drafts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own favorites" ON "public"."user_favorites" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage uploads for own drafts" ON "public"."task_draft_uploads" USING ((EXISTS ( SELECT 1
   FROM "public"."task_drafts" "d"
  WHERE (("d"."id" = "task_draft_uploads"."draft_id") AND ("d"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."task_drafts" "d"
  WHERE (("d"."id" = "task_draft_uploads"."draft_id") AND ("d"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can only access their own sessions" ON "public"."form_external_sessions" FOR SELECT TO "anon" USING (("session_token" = (("current_setting"('request.headers'::"text"))::json ->> 'x-session-token'::"text")));



CREATE POLICY "Users can read own drafts" ON "public"."task_drafts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit responses to task_usage forms when assigned" ON "public"."form_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_responses"."form_id") AND ("f"."status" = 'task_usage'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."tasks" "t"
          WHERE (("t"."form_id" = "f"."id") AND (("t"."assigned_to" = "auth"."uid"()) OR ("auth"."uid"() = ANY ("t"."assigned_users")) OR (("t"."assigned_department" IS NOT NULL) AND (EXISTS ( SELECT 1
                   FROM "public"."profiles" "p"
                  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."department_id" = "t"."assigned_department")))))))))))));



CREATE POLICY "Users can update application mappings" ON "public"."site_product_applications_map" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update applications with permissions" ON "public"."site_product_applications" FOR UPDATE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can update approvals assigned to them" ON "public"."workflow_approvals" FOR UPDATE USING (("approver_id" = "auth"."uid"()));



CREATE POLICY "Users can update corrections assigned to them" ON "public"."workflow_corrections" FOR UPDATE USING ((("assigned_to" = "auth"."uid"()) OR ("requested_by" = "auth"."uid"())));



CREATE POLICY "Users can update employee links for their friend/family links" ON "public"."contact_friend_family_link_employees" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM ("public"."contact_friend_family_links" "ff"
     JOIN "public"."contacts" "c" ON (("c"."id" = "ff"."contact_id")))
  WHERE (("ff"."id" = "contact_friend_family_link_employees"."link_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update extra fields for their tables" ON "public"."protheus_table_extra_fields" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."protheus_tables" "pt"
  WHERE (("pt"."id" = "protheus_table_extra_fields"."protheus_table_id") AND (("pt"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can update files for approval" ON "public"."chatter_files" FOR UPDATE USING ((("uploaded_by" = "auth"."uid"()) OR "public"."can_approve_file"("id", "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])))))));



CREATE POLICY "Users can update own conversations" ON "public"."ai_conversations" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update own drafts" ON "public"."task_drafts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own email prefs" ON "public"."user_email_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own trusted devices" ON "public"."trusted_devices" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update product applications with permissions" ON "public"."site_product_applications_map" FOR UPDATE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can update product group mappings" ON "public"."site_product_groups_map" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update product groups" ON "public"."site_product_groups" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update product groups with permissions" ON "public"."site_product_groups_map" FOR UPDATE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can update product segments with permissions" ON "public"."site_product_segments_map" FOR UPDATE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can update projects of their own partners" ON "public"."contact_partner_projects" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."contact_entity_external_partners" "ep"
     JOIN "public"."contact_entities" "ce" ON (("ce"."id" = "ep"."contact_entity_id")))
  WHERE (("ep"."id" = "contact_partner_projects"."partner_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update site products with permissions" ON "public"."site_products" FOR UPDATE USING ("public"."user_can_modify_page"('Dados do Site'::"text", "auth"."uid"()));



CREATE POLICY "Users can update sync errors" ON "public"."protheus_sync_errors" FOR UPDATE USING (true);



CREATE POLICY "Users can update task dependencies for tasks they manage" ON "public"."task_dependencies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."tasks" "t1"
  WHERE (("t1"."id" = "task_dependencies"."task_id") AND (("t1"."created_by" = "auth"."uid"()) OR ("t1"."assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))))));



CREATE POLICY "Users can update tasks they are involved in" ON "public"."tasks" FOR UPDATE USING ((("auth"."uid"() = "assigned_to") OR ("auth"."uid"() = "created_by") OR ("auth"."uid"() = ANY ("assigned_users")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])) OR ("profiles"."department_id" = "tasks"."assigned_department")))))));



CREATE POLICY "Users can update their forms" ON "public"."forms" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own association details" ON "public"."contact_entity_associations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_associations"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update their own chatter messages" ON "public"."chatter_messages" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own contacts" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own entities" ON "public"."contact_entities" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own external partner details" ON "public"."contact_entity_external_partners" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_external_partners"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update their own friend/family links" ON "public"."contact_friend_family_links" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_friend_family_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update their own notification configs" ON "public"."user_notification_configs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."app_notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile (limited fields)" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own protheus config" ON "public"."protheus_config" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own public org details" ON "public"."contact_entity_public_orgs" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own shared mailboxes" ON "public"."microsoft_shared_mailboxes" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own shares" ON "public"."record_shares" FOR UPDATE USING (("shared_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own tokens" ON "public"."ms_oauth_tokens" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "ms_oauth_tokens"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."microsoft_accounts" "ma"
  WHERE (("ma"."id" = "ms_oauth_tokens"."microsoft_account_id") AND ("ma"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their protheus table relationships" ON "public"."protheus_table_relationships" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update their protheus tables" ON "public"."protheus_tables" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can update their task comments" ON "public"."task_comments" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their task types" ON "public"."task_types" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their workflow auto triggers" ON "public"."workflow_auto_triggers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_auto_triggers"."workflow_id") AND ("w"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update their workflow templates" ON "public"."workflow_templates" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"]))))) AND "public"."can_access_workflow"("confidentiality_level", "auth"."uid"()))));



CREATE POLICY "Users can update their workflows" ON "public"."workflows" FOR UPDATE USING (((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))) AND "public"."can_access_workflow"("confidentiality_level", "auth"."uid"())));



CREATE POLICY "Users can update tokens for their forms" ON "public"."form_publication_tokens" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_publication_tokens"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update unified suppliers" ON "public"."purchases_unified_suppliers" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("created_by" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (("potential_supplier_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "ps"
  WHERE (("ps"."id" = "purchases_unified_suppliers"."potential_supplier_id") AND ("ps"."created_by" = "auth"."uid"()))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR ("created_by" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (("potential_supplier_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "ps"
  WHERE (("ps"."id" = "purchases_unified_suppliers"."potential_supplier_id") AND ("ps"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can upload chatter files" ON "public"."chatter_files" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can upload task attachments" ON "public"."task_attachments" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can view accessible task types" ON "public"."task_types" FOR SELECT USING ((("is_active" = true) AND "public"."can_access_task_type"("confidentiality_level", "allowed_users", "allowed_departments", "allowed_roles", "auth"."uid"())));



CREATE POLICY "Users can view accessible templates" ON "public"."task_templates" FOR SELECT USING ((("is_active" = true) AND "public"."can_access_task_template"("confidentiality_level", "allowed_users", "allowed_departments", "allowed_roles", "auth"."uid"())));



CREATE POLICY "Users can view active product groups" ON "public"."site_product_groups" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view api health" ON "public"."api_health_status" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view application mappings" ON "public"."site_product_applications_map" FOR SELECT USING (true);



CREATE POLICY "Users can view approvals assigned to them or that they created" ON "public"."workflow_approvals" FOR SELECT USING ((("approver_id" = "auth"."uid"()) OR ("approved_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflow_executions" "we"
  WHERE (("we"."id" = "workflow_approvals"."workflow_execution_id") AND ("we"."triggered_by" = "auth"."uid"()))))));



CREATE POLICY "Users can view basic employee info" ON "public"."employees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."status" = 'active'::"text")))));



CREATE POLICY "Users can view chatter files with confidentiality check" ON "public"."chatter_files" FOR SELECT USING (("public"."can_access_confidential_file"("confidentiality_level", "auth"."uid"()) AND (("approval_status" = 'approved'::"public"."approval_status") OR (("approval_status" = 'pending'::"public"."approval_status") AND (("uploaded_by" = "auth"."uid"()) OR "public"."can_approve_file"("id", "auth"."uid"()))) OR (("approval_status" = 'rejected'::"public"."approval_status") AND ("uploaded_by" = "auth"."uid"())))));



CREATE POLICY "Users can view chunks of documents they can access" ON "public"."doc_chunks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "doc_chunks"."document_id") AND ("d"."acl_hash" = "doc_chunks"."acl_hash")))));



CREATE POLICY "Users can view corrections assigned to them or requested by the" ON "public"."workflow_corrections" FOR SELECT USING ((("assigned_to" = "auth"."uid"()) OR ("requested_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflow_executions" "we"
  WHERE (("we"."id" = "workflow_corrections"."workflow_execution_id") AND ("we"."triggered_by" = "auth"."uid"()))))));



CREATE POLICY "Users can view deletion logs" ON "public"."protheus_sync_deletions" FOR SELECT USING (true);



CREATE POLICY "Users can view document versions they have access to" ON "public"."document_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_versions"."document_id") AND (("auth"."uid"() = "d"."created_by") OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) OR ("p"."department_id" = "d"."department_id"))))))))));



CREATE POLICY "Users can view dynamic tables" ON "public"."protheus_dynamic_tables" FOR SELECT USING (true);



CREATE POLICY "Users can view employee links for their friend/family links" ON "public"."contact_friend_family_link_employees" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."contact_friend_family_links" "ff"
     JOIN "public"."contacts" "c" ON (("c"."id" = "ff"."contact_id")))
  WHERE (("ff"."id" = "contact_friend_family_link_employees"."link_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can view errors for their jobs" ON "public"."site_city_distance_errors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."site_city_distance_jobs" "j"
  WHERE (("j"."id" = "site_city_distance_errors"."job_id") AND ("j"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view extra fields for accessible tables" ON "public"."protheus_table_extra_fields" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."protheus_tables" "pt"
  WHERE ("pt"."id" = "protheus_table_extra_fields"."protheus_table_id"))));



CREATE POLICY "Users can view form responses with enhanced access control" ON "public"."form_responses" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_responses"."form_id") AND ("f"."created_by" = "auth"."uid"())))) OR "public"."can_access_form_response"("form_id")));



CREATE POLICY "Users can view form versions with access" ON "public"."form_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_versions"."form_id") AND "public"."can_access_form"("forms"."confidentiality_level", "forms"."allowed_users", "forms"."allowed_departments", "forms"."allowed_roles", "auth"."uid"())))));



CREATE POLICY "Users can view forms with confidentiality check" ON "public"."forms" FOR SELECT USING ("public"."can_access_form"("confidentiality_level", "allowed_users", "allowed_departments", "allowed_roles", "auth"."uid"()));



CREATE POLICY "Users can view messages of accessible conversations" ON "public"."ai_conversation_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_conversation_messages"."conversation_id") AND (("c"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p1",
            "public"."profiles" "p2"
          WHERE (("p1"."id" = "auth"."uid"()) AND ("p2"."id" = "c"."created_by") AND ("p1"."department_id" = "p2"."department_id") AND ("p1"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"]))))))))));



CREATE POLICY "Users can view own conversations and subordinates" ON "public"."ai_conversations" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p1",
    "public"."profiles" "p2"
  WHERE (("p1"."id" = "auth"."uid"()) AND ("p2"."id" = "ai_conversations"."created_by") AND ("p1"."department_id" = "p2"."department_id") AND ("p1"."role" = ANY (ARRAY['admin'::"text", 'director'::"text", 'hr'::"text"])))))));



CREATE POLICY "Users can view own email prefs" ON "public"."user_email_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own trusted devices" ON "public"."trusted_devices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view performance metrics" ON "public"."processing_performance_metrics" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view processing steps for their documents" ON "public"."processing_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "processing_steps"."document_id") AND ("d"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view product group mappings" ON "public"."site_product_groups_map" FOR SELECT USING (true);



CREATE POLICY "Users can view projects of their own partners" ON "public"."contact_partner_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."contact_entity_external_partners" "ep"
     JOIN "public"."contact_entities" "ce" ON (("ce"."id" = "ep"."contact_entity_id")))
  WHERE (("ep"."id" = "contact_partner_projects"."partner_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view protheus table relationships" ON "public"."protheus_table_relationships" FOR SELECT USING (true);



CREATE POLICY "Users can view protheus tables" ON "public"."protheus_tables" FOR SELECT USING (true);



CREATE POLICY "Users can view shares involving them or their team" ON "public"."record_shares" FOR SELECT USING ((("shared_by" = "auth"."uid"()) OR ("shared_with" = "auth"."uid"()) OR ("shared_by" IN ( SELECT "get_all_subordinates"."subordinate_id"
   FROM "public"."get_all_subordinates"("auth"."uid"()) "get_all_subordinates"("subordinate_id"))) OR ("shared_with" IN ( SELECT "get_all_subordinates"."subordinate_id"
   FROM "public"."get_all_subordinates"("auth"."uid"()) "get_all_subordinates"("subordinate_id"))) OR ("auth"."uid"() IN ( SELECT "get_all_subordinates"."subordinate_id"
   FROM "public"."get_all_subordinates"("record_shares"."shared_with") "get_all_subordinates"("subordinate_id"))) OR ("auth"."uid"() IN ( SELECT "get_all_subordinates"."subordinate_id"
   FROM "public"."get_all_subordinates"("record_shares"."shared_by") "get_all_subordinates"("subordinate_id")))));



CREATE POLICY "Users can view sync errors" ON "public"."protheus_sync_errors" FOR SELECT USING (true);



CREATE POLICY "Users can view sync logs" ON "public"."protheus_sync_logs" FOR SELECT USING (true);



CREATE POLICY "Users can view tags of their own entities" ON "public"."contact_entity_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_tags"."entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view task attachments" ON "public"."task_attachments" FOR SELECT USING (true);



CREATE POLICY "Users can view task comments" ON "public"."task_comments" FOR SELECT USING (true);



CREATE POLICY "Users can view task dependencies" ON "public"."task_dependencies" FOR SELECT USING (true);



CREATE POLICY "Users can view task dependencies they have access to" ON "public"."task_dependencies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tasks" "t1"
  WHERE (("t1"."id" = "task_dependencies"."task_id") AND (("t1"."created_by" = "auth"."uid"()) OR ("t1"."assigned_to" = "auth"."uid"()) OR ("auth"."uid"() = ANY ("t1"."assigned_users")) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) OR ("p"."department_id" = "t1"."assigned_department"))))))))));



CREATE POLICY "Users can view task history" ON "public"."task_history" FOR SELECT USING (true);



CREATE POLICY "Users can view task_usage forms when assigned to tasks" ON "public"."forms" FOR SELECT USING ((("status" = 'task_usage'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."tasks" "t"
  WHERE (("t"."form_id" = "forms"."id") AND (("t"."assigned_to" = "auth"."uid"()) OR ("auth"."uid"() = ANY ("t"."assigned_users")) OR (("t"."assigned_department" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."department_id" = "t"."assigned_department")))))))))));



CREATE POLICY "Users can view tasks they are involved in" ON "public"."tasks" FOR SELECT USING ((("auth"."uid"() = "assigned_to") OR ("auth"."uid"() = "created_by") OR ("auth"."uid"() = ANY ("assigned_users")) OR (("assigned_department" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."department_id" = "tasks"."assigned_department"))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can view their own access logs" ON "public"."document_access_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own association details" ON "public"."contact_entity_associations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_associations"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own contacts" ON "public"."contacts" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own distance jobs" ON "public"."site_city_distance_jobs" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own entities" ON "public"."contact_entities" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own external partner details" ON "public"."contact_entity_external_partners" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_external_partners"."contact_entity_id") AND ("ce"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own favorites" ON "public"."user_favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own friend/family links" ON "public"."contact_friend_family_links" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_friend_family_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can view their own notification configs" ON "public"."user_notification_configs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notification logs" ON "public"."notification_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."app_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own protheus config" ON "public"."protheus_config" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own protheus logs" ON "public"."protheus_usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own public org details" ON "public"."contact_entity_public_orgs" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own shared mailboxes" ON "public"."microsoft_shared_mailboxes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view tokens for their forms" ON "public"."form_publication_tokens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_publication_tokens"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view version chunks they have access to" ON "public"."document_version_chunks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."document_versions" "dv"
     JOIN "public"."documents" "d" ON (("d"."id" = "dv"."document_id")))
  WHERE (("dv"."id" = "document_version_chunks"."version_id") AND (("auth"."uid"() = "d"."created_by") OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])) OR ("p"."department_id" = "d"."department_id"))))))))));



CREATE POLICY "Users can view workflow auto triggers with confidentiality chec" ON "public"."workflow_auto_triggers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_auto_triggers"."workflow_id") AND ("public"."can_access_workflow"("w"."confidentiality_level", "auth"."uid"()) OR (( SELECT "profiles"."role"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "Users can view workflow execution steps" ON "public"."workflow_execution_steps" FOR SELECT USING (true);



CREATE POLICY "Users can view workflow executions" ON "public"."workflow_executions" FOR SELECT USING (true);



CREATE POLICY "Users can view workflow queue" ON "public"."workflow_queue" FOR SELECT USING (true);



CREATE POLICY "Users can view workflow templates with confidentiality check" ON "public"."workflow_templates" FOR SELECT USING ("public"."can_access_workflow"("confidentiality_level", "auth"."uid"()));



CREATE POLICY "Users can view workflow trigger logs" ON "public"."workflow_trigger_logs" FOR SELECT USING (true);



CREATE POLICY "Users can view workflows with confidentiality check" ON "public"."workflows" FOR SELECT USING (("public"."can_access_workflow"("confidentiality_level", "auth"."uid"()) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"text", 'director'::"text"]))));



CREATE POLICY "Users manage own ms accounts" ON "public"."microsoft_accounts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar convites de seus formulários" ON "public"."form_external_invitations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_invitations"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem criar convites em seus formulários" ON "public"."form_external_invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_invitations"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem criar relacionamentos em seus formulários" ON "public"."form_external_contacts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_contacts"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem deletar convites de seus formulários" ON "public"."form_external_invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_invitations"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem deletar relacionamentos de seus formulários" ON "public"."form_external_contacts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_contacts"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem ver convites de seus formulários" ON "public"."form_external_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_invitations"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Usuários podem ver relacionamentos de seus formulários" ON "public"."form_external_contacts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms"
  WHERE (("forms"."id" = "form_external_contacts"."form_id") AND ("forms"."created_by" = "auth"."uid"())))));



CREATE POLICY "Vendor links are viewable by authenticated users" ON "public"."sales_vendor_user_links" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "View active external partners" ON "public"."contact_entities" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("type" = 'parceiros_externos'::"text") AND ("status" = 'active'::"text")));



CREATE POLICY "View external partner details" ON "public"."contact_entity_external_partners" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_external_partners"."contact_entity_id") AND ("ce"."type" = 'parceiros_externos'::"text") AND ("ce"."status" = 'active'::"text"))))));



CREATE POLICY "View external partner entity tags" ON "public"."contact_entity_tags" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."contact_entities" "ce"
  WHERE (("ce"."id" = "contact_entity_tags"."entity_id") AND ("ce"."type" = 'parceiros_externos'::"text") AND ("ce"."status" = 'active'::"text"))))));



CREATE POLICY "View own, target-profile, or admin" ON "public"."chatter_messages" FOR SELECT USING ((("author_id" = "auth"."uid"()) OR (("record_type" = 'user'::"text") AND ("record_id" = "auth"."uid"())) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



ALTER TABLE "public"."access_rejections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_health_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buyer_user_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chatter_email_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chatter_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chatter_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commercial_representatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_entity_associations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_entity_external_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_entity_public_orgs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_entity_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_friend_family_link_employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_friend_family_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_links_delete" ON "public"."contact_links" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "contact_links_insert" ON "public"."contact_links" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "contact_links_select" ON "public"."contact_links" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



CREATE POLICY "contact_links_update" ON "public"."contact_links" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "contact_links"."contact_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))));



ALTER TABLE "public"."contact_partner_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cron_job_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."department_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."doc_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_access_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_version_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."economic_group_segments_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_draft_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_draft_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_signature_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_external_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_external_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_external_login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_external_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_external_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_publication_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_response_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."microsoft_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."microsoft_shared_mailboxes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ms_oauth_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ocr_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ocr_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pending_access_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portal_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ppsm_types delete by owner/admin/parent-owner" ON "public"."purchases_potential_supplier_material_types" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "s"
  WHERE (("s"."id" = "purchases_potential_supplier_material_types"."supplier_id") AND ("s"."created_by" = "auth"."uid"()))))));



CREATE POLICY "ppsm_types insert by owner/admin/parent-owner" ON "public"."purchases_potential_supplier_material_types" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "s"
  WHERE (("s"."id" = "purchases_potential_supplier_material_types"."supplier_id") AND ("s"."created_by" = "auth"."uid"()))))));



CREATE POLICY "ppsm_types selectable by authenticated" ON "public"."purchases_potential_supplier_material_types" FOR SELECT USING (true);



CREATE POLICY "ppsm_types update by owner/admin/parent-owner" ON "public"."purchases_potential_supplier_material_types" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "s"
  WHERE (("s"."id" = "purchases_potential_supplier_material_types"."supplier_id") AND ("s"."created_by" = "auth"."uid"())))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."purchases_potential_suppliers" "s"
  WHERE (("s"."id" = "purchases_potential_supplier_material_types"."supplier_id") AND ("s"."created_by" = "auth"."uid"()))))));



ALTER TABLE "public"."processing_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processing_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processing_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_binary_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_customer_group_units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_customer_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_dynamic_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_group_update_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_group_update_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sa1010_80f17f00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sa2010_72a51158" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sa3010_fc3d70f6" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sa4010_ea26a13a" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sa5010_6d3daa8e" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sb1010_b0316113" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sds010_f444bb4c" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_supplier_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_supplier_material_types_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sy1010_3249e97a" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sync_deletions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sync_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_table_extra_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_table_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protheus_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_economic_group_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_economic_group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_economic_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_material_type_buyer_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_potential_supplier_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_potential_supplier_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_potential_suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_supplier_group_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_unified_supplier_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_unified_supplier_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases_unified_suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."record_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_lead_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_vendor_user_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "series_owner" ON "public"."task_series" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."site_cities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_cities_delete_admins_directors" ON "public"."site_cities" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "site_cities_insert_admins_directors" ON "public"."site_cities" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



CREATE POLICY "site_cities_select_authenticated" ON "public"."site_cities" FOR SELECT USING (true);



CREATE POLICY "site_cities_update_admins_directors" ON "public"."site_cities" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'director'::"text"]))))));



ALTER TABLE "public"."site_city_distance_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_city_distance_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_applications_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_families" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_groups_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_names" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_product_segments_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_dependencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_draft_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_series" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trusted_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unified_account_segments_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unified_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_email_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notification_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_user_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_auto_triggers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_corrections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_execution_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_trigger_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_lead_to_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_lead_to_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_lead_to_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_member_to_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_member_to_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_member_to_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_unified_supplier_to_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_unified_to_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_unified_to_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_unified_to_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_material_types_to_purchases_group_members"("p_id_grupo" integer, "p_material_type_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."apply_material_types_to_purchases_group_members"("p_id_grupo" integer, "p_material_type_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_material_types_to_purchases_group_members"("p_id_grupo" integer, "p_material_type_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_document_version"("p_document_id" "uuid", "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_document_version"("p_document_id" "uuid", "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_document_version"("p_document_id" "uuid", "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_departments_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_departments_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_departments_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_employee_sensitive_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_employee_sensitive_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_employee_sensitive_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_employees_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_employees_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_employees_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_profiles_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_profiles_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_profiles_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_record_shares"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_record_shares"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_record_shares"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_task_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_task_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_task_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_tasks_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_tasks_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_tasks_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_share_approval_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_share_approval_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_share_approval_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_chunk_quality_score"("chunk_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_chunk_quality_score"("chunk_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_chunk_quality_score"("chunk_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_trigger_next_execution"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_trigger_next_execution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_trigger_next_execution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_confidential_file"("file_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_confidential_file"("file_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_confidential_file"("file_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_form"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_form"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_form"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_form_response"("response_form_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_form_response"("response_form_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_form_response"("response_form_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_task_template"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_task_template"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_task_template"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_task_type"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_task_type"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_task_type"("p_confidentiality_level" "public"."confidentiality_level", "p_allowed_users" "uuid"[], "p_allowed_departments" "uuid"[], "p_allowed_roles" "text"[], "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "workflow_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "workflow_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_workflow"("workflow_confidentiality" "public"."confidentiality_level", "workflow_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_approve_access_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_approve_access_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_approve_access_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_approve_file"("file_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_approve_file"("file_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_approve_file"("file_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_delete_workflow"("workflow_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_delete_workflow"("workflow_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_delete_workflow"("workflow_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_modify_user_role"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_modify_user_role"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_modify_user_role"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_employee_sensitive_data"("employee_record" "public"."employees") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_employee_sensitive_data"("employee_record" "public"."employees") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_employee_sensitive_data"("employee_record" "public"."employees") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_device_trust_anonymous"("device_fingerprint_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_device_trust_anonymous"("device_fingerprint_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_device_trust_anonymous"("device_fingerprint_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_document_expiry_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_document_expiry_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_document_expiry_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ip_rate_limit"("ip_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_ip_rate_limit"("ip_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ip_rate_limit"("ip_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_shared_record_access"("p_record_type" "text", "p_record_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_shared_record_access"("p_record_type" "text", "p_record_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_shared_record_access"("p_record_type" "text", "p_record_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_single_open_draft"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_single_open_draft"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_single_open_draft"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_audit_logs"("days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."clean_audit_logs"("days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_audit_logs"("days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_message_preview"("message_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."clean_message_preview"("message_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_message_preview"("message_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_access_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_access_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_access_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_password_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_password_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_password_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_telegram_codes"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_telegram_codes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_telegram_codes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trusted_devices_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_whatsapp_codes"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_whatsapp_codes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_whatsapp_codes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_access_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_access_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_access_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_processed_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_processed_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_processed_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_task_drafts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_task_drafts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_task_drafts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_stuck_documents"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_stuck_documents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_stuck_documents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_acl_hash"("department_id" "uuid", "user_id" "uuid", "confidentiality_level" "text", "folder_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_acl_hash"("department_id" "uuid", "user_id" "uuid", "confidentiality_level" "text", "folder_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_acl_hash"("department_id" "uuid", "user_id" "uuid", "confidentiality_level" "text", "folder_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_document_acl_hash"("doc_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_document_acl_hash"("doc_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_document_acl_hash"("doc_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_potential_without_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_potential_without_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_potential_without_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_protheus_without_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_protheus_without_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_protheus_without_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_purchases_economic_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_purchases_economic_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_purchases_economic_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unified_suppliers_without_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_unified_suppliers_without_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unified_suppliers_without_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_approval_with_record_access"("p_workflow_execution_id" "uuid", "p_step_id" "text", "p_approver_id" "uuid", "p_approval_data" "jsonb", "p_expires_at" timestamp with time zone, "p_priority" "text", "p_approval_type" "public"."approval_type", "p_record_reference" "jsonb", "p_requires_record_access" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_approval_with_record_access"("p_workflow_execution_id" "uuid", "p_step_id" "text", "p_approver_id" "uuid", "p_approval_data" "jsonb", "p_expires_at" timestamp with time zone, "p_priority" "text", "p_approval_type" "public"."approval_type", "p_record_reference" "jsonb", "p_requires_record_access" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_approval_with_record_access"("p_workflow_execution_id" "uuid", "p_step_id" "text", "p_approver_id" "uuid", "p_approval_data" "jsonb", "p_expires_at" timestamp with time zone, "p_priority" "text", "p_approval_type" "public"."approval_type", "p_record_reference" "jsonb", "p_requires_record_access" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_customer_group"("p_table_id" "uuid", "p_nome_grupo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_customer_group"("p_table_id" "uuid", "p_nome_grupo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_customer_group"("p_table_id" "uuid", "p_nome_grupo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dynamic_table"("table_definition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_dynamic_table"("table_definition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dynamic_table"("table_definition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_economic_group"("p_nome_grupo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_economic_group"("p_nome_grupo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_economic_group"("p_nome_grupo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_form_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_form_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_form_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_missing_purchases_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_missing_purchases_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_missing_purchases_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_missing_unified_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_missing_unified_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_missing_unified_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers_from_protheus"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers_from_protheus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_missing_unified_suppliers_from_protheus"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchases_economic_group"("p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchases_economic_group"("p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchases_economic_group"("p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_economic_group"("p_id_grupo" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_economic_group"("p_id_grupo" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_economic_group"("p_id_grupo" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_dynamic_table"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."drop_dynamic_table"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_dynamic_table"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."emit_protheus_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."emit_protheus_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."emit_protheus_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_table_rls"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enable_table_rls"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_table_rls"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_external_form_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_external_form_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_external_form_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_pending_requests_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_pending_requests_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_pending_requests_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_site_product_name_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_site_product_name_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_site_product_name_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_and_assign_group"("p_potential_id" "uuid", "p_group_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_and_assign_group"("p_potential_id" "uuid", "p_group_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_and_assign_group"("p_potential_id" "uuid", "p_group_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_from_potential"("p_potential_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_from_potential"("p_potential_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_unified_supplier_from_potential"("p_potential_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_chunk_count_inconsistencies"() TO "anon";
GRANT ALL ON FUNCTION "public"."fix_chunk_count_inconsistencies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_chunk_count_inconsistencies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_approval_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_approval_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_approval_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_device_fingerprint"("user_agent_param" "text", "screen_resolution" "text", "timezone_param" "text", "language_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_device_fingerprint"("user_agent_param" "text", "screen_resolution" "text", "timezone_param" "text", "language_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_device_fingerprint"("user_agent_param" "text", "screen_resolution" "text", "timezone_param" "text", "language_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_employee_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_employee_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_employee_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_form_publication_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_form_publication_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_form_publication_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_password_hash"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_password_hash"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_password_hash"("password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_password_reset_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_password_reset_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_password_reset_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_relationship_name"("source_table_name" "text", "target_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_relationship_name"("source_table_name" "text", "target_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_relationship_name"("source_table_name" "text", "target_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_secure_form_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_secure_form_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_secure_form_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_secure_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_secure_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_secure_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_task_occurrences"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_task_occurrences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_task_occurrences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_telegram_setup_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_telegram_setup_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_telegram_setup_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_purchases_economic_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_purchases_economic_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_purchases_economic_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_subordinates"("supervisor_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_subordinates"("supervisor_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_subordinates"("supervisor_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_log_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_log_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_log_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_log_size"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_log_size"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_log_size"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_customer_groups_with_id"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_customer_groups_with_id"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer_groups_with_id"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_department_name"("dept_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_department_name"("dept_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_department_name"("dept_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_group_leads"("p_id_grupo" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_leads"("p_id_grupo" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_leads"("p_id_grupo" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_group_update_results"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_group_update_results"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_group_update_results"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ocr_model_stats"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ocr_model_stats"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ocr_model_stats"("days_back" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_protheus_client_groups"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_protheus_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_protheus_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_protheus_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_group_unit_names"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_protheus_supplier_groups"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated"("p_search_term" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated_v2"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated_v2"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_economic_groups_paginated_v2"("p_page" integer, "p_page_size" integer, "p_search_term" "text", "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_group_members"("p_id_grupo" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_group_members"("p_id_grupo" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_group_members"("p_id_grupo" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchases_supplier_totalizers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchases_supplier_totalizers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchases_supplier_totalizers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_account_names"("p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_account_names"("p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_account_names"("p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_customer_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_customer_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_customer_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_group_members"("p_id_grupo" integer, "p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role_and_department"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_and_department"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_and_department"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_chatter_file_versioning"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_chatter_file_versioning"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_chatter_file_versioning"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_expired_shares"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_expired_shares"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_expired_shares"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_form_versioning"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_form_versioning"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_form_versioning"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_ocr_error"("p_document_id" "uuid", "p_error_message" "text", "p_should_retry" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."handle_ocr_error"("p_document_id" "uuid", "p_error_message" "text", "p_should_retry" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_ocr_error"("p_document_id" "uuid", "p_error_message" "text", "p_should_retry" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_form_token"("token_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hash_form_token"("token_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_form_token"("token_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_device_trusted"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_device_trusted"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_device_trusted"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_test_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_test_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_test_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_group_units"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_group_units"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_group_units"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_missing_unified_suppliers"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_missing_unified_suppliers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_missing_unified_suppliers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_document_access"("p_document_id" "uuid", "p_folder_id" "uuid", "p_access_type" "text", "p_user_agent" "text", "p_ip_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_access"("p_document_id" "uuid", "p_folder_id" "uuid", "p_access_type" "text", "p_user_agent" "text", "p_ip_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_access"("p_document_id" "uuid", "p_folder_id" "uuid", "p_access_type" "text", "p_user_agent" "text", "p_ip_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."matches_protheus_trigger"("trigger_config" "jsonb", "event_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."matches_protheus_trigger"("trigger_config" "jsonb", "event_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."matches_protheus_trigger"("trigger_config" "jsonb", "event_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_all_sa2010_to_unified"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."merge_all_sa2010_to_unified"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_all_sa2010_to_unified"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_unified_supplier_with_protheus"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."merge_unified_supplier_with_protheus"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_unified_supplier_with_protheus"("p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_text"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_text"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_text"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_access_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_access_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_access_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_chatter_general"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_chatter_general"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_chatter_general"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_chatter_mentions"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_chatter_mentions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_chatter_mentions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_expiring_shares"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_expiring_shares"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_expiring_shares"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_access_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_access_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_access_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_record_shared"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_record_shared"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_record_shared"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_delete_linked_protheus_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_delete_linked_protheus_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_delete_linked_protheus_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_access_request_approval"("request_id" "uuid", "approved" boolean, "rejection_reason" "text", "supervisor_id" "uuid", "edited_data" "jsonb", "current_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_access_request_approval"("request_id" "uuid", "approved" boolean, "rejection_reason" "text", "supervisor_id" "uuid", "edited_data" "jsonb", "current_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_access_request_approval"("request_id" "uuid", "approved" boolean, "rejection_reason" "text", "supervisor_id" "uuid", "edited_data" "jsonb", "current_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_email_approval"("p_token_hash" "text", "p_action" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "text", "p_comments" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "text", "p_comments" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "text", "p_comments" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "public"."approval_status", "p_comments" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "public"."approval_status", "p_comments" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_unified_approval"("p_approval_id" "uuid", "p_action" "public"."approval_status", "p_comments" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_workflow_triggers"("trigger_type_param" "text", "trigger_data_param" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_workflow_triggers"("trigger_type_param" "text", "trigger_data_param" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_workflow_triggers"("trigger_type_param" "text", "trigger_data_param" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."purchases_suppliers_validate_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."purchases_suppliers_validate_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchases_suppliers_validate_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purchases_unified_suppliers_validate_attendance"() TO "anon";
GRANT ALL ON FUNCTION "public"."purchases_unified_suppliers_validate_attendance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchases_unified_suppliers_validate_attendance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "order_fields" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "order_fields" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "order_fields" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "count_only" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "count_only" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "count_only" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."query_dynamic_table"("p_table_id" "uuid", "p_columns" "text"[], "p_where_conditions" "text", "p_order_by" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("p_table_id" "uuid", "p_columns" "text"[], "p_where_conditions" "text", "p_order_by" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("p_table_id" "uuid", "p_columns" "text"[], "p_where_conditions" "text", "p_order_by" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "sort_column" "text", "sort_direction" "text", "limit_param" integer, "offset_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "sort_column" "text", "sort_direction" "text", "limit_param" integer, "offset_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "sort_column" "text", "sort_direction" "text", "limit_param" integer, "offset_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "sort_by" "text", "sort_dir" "text", "count_only" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "sort_by" "text", "sort_dir" "text", "count_only" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_dynamic_table"("table_name_param" "text", "search_term" "text", "column_filters" "jsonb", "limit_param" integer, "offset_param" integer, "sort_by" "text", "sort_dir" "text", "count_only" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."rebuild_economic_groups_from_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."rebuild_economic_groups_from_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rebuild_economic_groups_from_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_lead_from_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_lead_from_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_lead_from_group"("p_id_grupo" integer, "p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_member_from_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_member_from_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_member_from_group"("p_id_grupo" integer, "p_table_id" "uuid", "p_filial" "text", "p_cod" "text", "p_loja" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_unified_from_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_unified_from_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_unified_from_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_group"("p_group_id" "uuid", "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_unified_supplier_from_purchases_group"("p_id_grupo" integer, "p_unified_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_purchases_economic_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_purchases_economic_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_purchases_economic_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_form_token"("token_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_form_token"("token_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_form_token"("token_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_auto_share_on_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_auto_share_on_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_auto_share_on_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_leads_validate_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_leads_validate_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_leads_validate_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_customers_for_groups"("p_table_id" "uuid", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_customers_for_groups"("p_table_id" "uuid", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_customers_for_groups"("p_table_id" "uuid", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "include_archived" boolean, "include_hidden" boolean, "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "include_archived" boolean, "include_hidden" boolean, "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "include_archived" boolean, "include_hidden" boolean, "max_results" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_documents"("query_embedding" "public"."vector", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_documents_by_type"("query_embedding" "public"."vector", "p_embedding_type" "text", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_documents_by_type"("query_embedding" "public"."vector", "p_embedding_type" "text", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_documents_by_type"("query_embedding" "public"."vector", "p_embedding_type" "text", "acl_hash" "text", "department_id" "uuid", "folder_statuses" "text"[], "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_leads_for_groups"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_leads_for_groups"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_leads_for_groups"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_purchases_economic_groups"("p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_purchases_economic_groups"("p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_purchases_economic_groups"("p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_purchases_unified_suppliers"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_purchases_unified_suppliers"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_purchases_unified_suppliers"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups"("p_search_term" "text", "p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups"("p_search_term" "text", "p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups"("p_search_term" "text", "p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups_simple"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups_simple"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_unified_accounts_for_groups_simple"("p_search_term" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_unified_suppliers_for_groups_simple"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_created_by_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_created_by_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_created_by_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_document_acl_hash"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_document_acl_hash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_document_acl_hash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_purchases_group_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_purchases_group_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_purchases_group_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_purchases_group_code_after"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_purchases_group_code_after"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_purchases_group_code_after"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_purchases_group_material_types"("p_group_id" integer, "p_material_type_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."set_purchases_group_material_types"("p_group_id" integer, "p_material_type_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_purchases_group_material_types"("p_group_id" integer, "p_material_type_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_unified_supplier_material_types"("p_supplier_id" "uuid", "p_material_type_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."set_unified_supplier_material_types"("p_supplier_id" "uuid", "p_material_type_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_unified_supplier_material_types"("p_supplier_id" "uuid", "p_material_type_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_protheus_table_workflow"("table_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_protheus_table_workflow"("table_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_protheus_table_workflow"("table_name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_workflow"("workflow_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_workflow"("workflow_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_workflow"("workflow_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_existing_unified_to_potential_material_types"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_existing_unified_to_potential_material_types"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_existing_unified_to_potential_material_types"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_purchases_group_material_types_from_members"("p_id_grupo" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sync_purchases_group_material_types_from_members"("p_id_grupo" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_purchases_group_material_types_from_members"("p_id_grupo" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."table_exists"("table_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_claim_unified_supplier_ownership"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_claim_unified_supplier_ownership"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_claim_unified_supplier_ownership"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_cleanup_empty_purchases_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_cleanup_empty_purchases_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_cleanup_empty_purchases_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_copy_material_types_to_group_on_group_set"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_copy_potential_material_types_to_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_copy_potential_material_types_to_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_copy_potential_material_types_to_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_mirror_expected_to_due_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_mirror_expected_to_due_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_mirror_expected_to_due_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_normalize_attendance_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_normalize_attendance_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_normalize_attendance_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_normalize_cnpj"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_normalize_cnpj"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_normalize_cnpj"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_normalize_tags"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_normalize_tags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_normalize_tags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_prevent_fu_id_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_prevent_fu_id_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_prevent_fu_id_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_set_unified_supplier_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_set_unified_supplier_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_set_unified_supplier_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_attendance_potential_to_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_attendance_potential_to_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_attendance_potential_to_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_attendance_unified_to_potential"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_attendance_unified_to_potential"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_attendance_unified_to_potential"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_potential_to_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_from_unified_to_potential"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_buyer_potential_to_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_potential_to_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_potential_to_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_buyer_unified_to_potential"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_unified_to_potential"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_buyer_unified_to_potential"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_lead_group_from_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_lead_group_from_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_lead_group_from_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_potential_material_types_to_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_potential_material_types_to_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_potential_material_types_to_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_potential_tags_to_unified"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_potential_tags_to_unified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_potential_tags_to_unified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_purchases_unified_has_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_purchases_unified_has_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_purchases_unified_has_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_unified_material_types_to_potential"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_material_types_to_potential"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_material_types_to_potential"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_unified_supplier_has_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_supplier_has_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_supplier_has_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_unified_tags_to_potential"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_tags_to_potential"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_unified_tags_to_potential"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_update_acl_hash"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_update_acl_hash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_update_acl_hash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_validate_sales_lead_city_not_null"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_validate_sales_lead_city_not_null"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_validate_sales_lead_city_not_null"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_validate_site_cities_codes"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_validate_site_cities_codes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_validate_site_cities_codes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_document_expired"("document_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_document_expired"("document_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_document_expired"("document_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_field_change"("p_table_name" "text", "p_record_id" "uuid", "p_field_name" "text", "p_old_value" "text", "p_new_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_field_change"("p_table_name" "text", "p_record_id" "uuid", "p_field_name" "text", "p_old_value" "text", "p_new_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_field_change"("p_table_name" "text", "p_record_id" "uuid", "p_field_name" "text", "p_old_value" "text", "p_new_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_file_uploaded"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_file_uploaded"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_file_uploaded"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_record_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_record_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_record_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_task_edited"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_task_edited"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_task_edited"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_task_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_task_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_task_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_user_department_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_user_department_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_user_department_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_user_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_user_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_user_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_conversation_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_conversation_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_conversation_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cache_access"("p_cache_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_cache_access"("p_cache_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cache_access"("p_cache_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_last_used"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_last_used"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_last_used"("user_id_param" "uuid", "device_fingerprint_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_acl_hash"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_acl_hash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_acl_hash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities_manual"("doc_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities_manual"("doc_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_rag_capabilities_manual"("doc_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_storage"("doc_id" "uuid", "new_storage_key" "text", "new_mime_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_storage"("doc_id" "uuid", "new_storage_key" "text", "new_mime_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_storage"("doc_id" "uuid", "new_storage_key" "text", "new_mime_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_documents_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_documents_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_documents_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_email_signatures_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_email_signatures_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_email_signatures_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_form_external_invitations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_form_external_invitations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_form_external_invitations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_group_name"("p_id_grupo" integer, "p_nome_grupo" "text", "p_nome_grupo_sugerido" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_name"("p_id_grupo" integer, "p_nome_grupo" "text", "p_nome_grupo_sugerido" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_name"("p_id_grupo" integer, "p_nome_grupo" "text", "p_nome_grupo_sugerido" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_processing_steps_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_processing_steps_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_processing_steps_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_binary_assets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_binary_assets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_binary_assets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_customer_groups"("p_table_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_customer_groups"("p_table_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_customer_groups"("p_table_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_dynamic_tables_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_dynamic_tables_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_dynamic_tables_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_queries_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_queries_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_queries_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protheus_tables_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protheus_tables_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protheus_tables_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text", "p_protheus_filial" "text", "p_protheus_cod" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text", "p_protheus_filial" "text", "p_protheus_cod" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchases_group_details"("p_id_grupo" integer, "p_name" "text", "p_assigned_buyer_cod" "text", "p_assigned_buyer_filial" "text", "p_protheus_filial" "text", "p_protheus_cod" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchases_group_name"("p_id_grupo" integer, "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchases_group_name"("p_id_grupo" integer, "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchases_group_name"("p_id_grupo" integer, "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_record_shares_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_record_shares_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_record_shares_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_shared_mailboxes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_shared_mailboxes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_shared_mailboxes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_site_product_applications_map_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_site_product_applications_map_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_site_product_applications_map_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_site_product_names_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_site_product_names_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_site_product_names_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_task_series_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_series_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_series_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_task_template_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_template_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_template_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_task_types_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_types_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_types_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_modify_page"("p_page_name" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_modify_page"("p_page_name" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_modify_page"("p_page_name" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_commercial_rep"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_commercial_rep"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_commercial_rep"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_unified_account_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_unified_account_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_unified_account_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("stored_hash" "text", "provided_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("stored_hash" "text", "provided_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("stored_hash" "text", "provided_password" "text") TO "service_role";



GRANT ALL ON TABLE "public"."_new_users_tmp" TO "anon";
GRANT ALL ON TABLE "public"."_new_users_tmp" TO "authenticated";
GRANT ALL ON TABLE "public"."_new_users_tmp" TO "service_role";



GRANT ALL ON TABLE "public"."_old_users_tmp" TO "anon";
GRANT ALL ON TABLE "public"."_old_users_tmp" TO "authenticated";
GRANT ALL ON TABLE "public"."_old_users_tmp" TO "service_role";



GRANT ALL ON TABLE "public"."access_rejections" TO "anon";
GRANT ALL ON TABLE "public"."access_rejections" TO "authenticated";
GRANT ALL ON TABLE "public"."access_rejections" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."api_health_status" TO "anon";
GRANT ALL ON TABLE "public"."api_health_status" TO "authenticated";
GRANT ALL ON TABLE "public"."api_health_status" TO "service_role";



GRANT ALL ON TABLE "public"."app_notifications" TO "anon";
GRANT ALL ON TABLE "public"."app_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."approval_tokens" TO "anon";
GRANT ALL ON TABLE "public"."approval_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."buyer_user_links" TO "anon";
GRANT ALL ON TABLE "public"."buyer_user_links" TO "authenticated";
GRANT ALL ON TABLE "public"."buyer_user_links" TO "service_role";



GRANT ALL ON TABLE "public"."chatter_email_messages" TO "anon";
GRANT ALL ON TABLE "public"."chatter_email_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chatter_email_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chatter_files" TO "anon";
GRANT ALL ON TABLE "public"."chatter_files" TO "authenticated";
GRANT ALL ON TABLE "public"."chatter_files" TO "service_role";



GRANT ALL ON TABLE "public"."chatter_messages" TO "anon";
GRANT ALL ON TABLE "public"."chatter_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chatter_messages" TO "service_role";



GRANT ALL ON TABLE "public"."commercial_representatives" TO "anon";
GRANT ALL ON TABLE "public"."commercial_representatives" TO "authenticated";
GRANT ALL ON TABLE "public"."commercial_representatives" TO "service_role";



GRANT ALL ON TABLE "public"."contact_entities" TO "anon";
GRANT ALL ON TABLE "public"."contact_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_entities" TO "service_role";



GRANT ALL ON TABLE "public"."contact_entity_associations" TO "anon";
GRANT ALL ON TABLE "public"."contact_entity_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_entity_associations" TO "service_role";



GRANT ALL ON TABLE "public"."contact_entity_external_partners" TO "anon";
GRANT ALL ON TABLE "public"."contact_entity_external_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_entity_external_partners" TO "service_role";



GRANT ALL ON TABLE "public"."contact_entity_public_orgs" TO "anon";
GRANT ALL ON TABLE "public"."contact_entity_public_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_entity_public_orgs" TO "service_role";



GRANT ALL ON TABLE "public"."contact_entity_tags" TO "anon";
GRANT ALL ON TABLE "public"."contact_entity_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_entity_tags" TO "service_role";



GRANT ALL ON TABLE "public"."contact_friend_family_link_employees" TO "anon";
GRANT ALL ON TABLE "public"."contact_friend_family_link_employees" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_friend_family_link_employees" TO "service_role";



GRANT ALL ON TABLE "public"."contact_friend_family_links" TO "anon";
GRANT ALL ON TABLE "public"."contact_friend_family_links" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_friend_family_links" TO "service_role";



GRANT ALL ON TABLE "public"."contact_links" TO "anon";
GRANT ALL ON TABLE "public"."contact_links" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_links" TO "service_role";



GRANT ALL ON TABLE "public"."contact_partner_projects" TO "anon";
GRANT ALL ON TABLE "public"."contact_partner_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_partner_projects" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "service_role";



GRANT ALL ON TABLE "public"."department_permissions" TO "anon";
GRANT ALL ON TABLE "public"."department_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."department_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."doc_chunks" TO "anon";
GRANT ALL ON TABLE "public"."doc_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."doc_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."document_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."document_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."document_access_logs" TO "service_role";



GRANT ALL ON TABLE "public"."document_version_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_version_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_version_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."document_versions" TO "anon";
GRANT ALL ON TABLE "public"."document_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_versions" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."economic_group_segments_map" TO "anon";
GRANT ALL ON TABLE "public"."economic_group_segments_map" TO "authenticated";
GRANT ALL ON TABLE "public"."economic_group_segments_map" TO "service_role";



GRANT ALL ON TABLE "public"."email_draft_shares" TO "anon";
GRANT ALL ON TABLE "public"."email_draft_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."email_draft_shares" TO "service_role";



GRANT ALL ON TABLE "public"."email_draft_tags" TO "anon";
GRANT ALL ON TABLE "public"."email_draft_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."email_draft_tags" TO "service_role";



GRANT ALL ON TABLE "public"."email_drafts" TO "anon";
GRANT ALL ON TABLE "public"."email_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."email_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."email_signature_targets" TO "anon";
GRANT ALL ON TABLE "public"."email_signature_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."email_signature_targets" TO "service_role";



GRANT ALL ON TABLE "public"."email_signatures" TO "anon";
GRANT ALL ON TABLE "public"."email_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."email_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."email_tags" TO "anon";
GRANT ALL ON TABLE "public"."email_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."email_tags" TO "service_role";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."field_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."field_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."field_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."folders" TO "anon";
GRANT ALL ON TABLE "public"."folders" TO "authenticated";
GRANT ALL ON TABLE "public"."folders" TO "service_role";



GRANT ALL ON TABLE "public"."folder_descendant_counts" TO "anon";
GRANT ALL ON TABLE "public"."folder_descendant_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."folder_descendant_counts" TO "service_role";



GRANT ALL ON TABLE "public"."folder_document_counts" TO "anon";
GRANT ALL ON TABLE "public"."folder_document_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."folder_document_counts" TO "service_role";



GRANT ALL ON TABLE "public"."form_analytics" TO "anon";
GRANT ALL ON TABLE "public"."form_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."form_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."form_external_contacts" TO "anon";
GRANT ALL ON TABLE "public"."form_external_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."form_external_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."form_external_invitations" TO "anon";
GRANT ALL ON TABLE "public"."form_external_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."form_external_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."form_external_login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."form_external_login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."form_external_login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."form_external_recipients" TO "anon";
GRANT ALL ON TABLE "public"."form_external_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."form_external_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."form_external_sessions" TO "anon";
GRANT ALL ON TABLE "public"."form_external_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_external_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."form_publication_tokens" TO "anon";
GRANT ALL ON TABLE "public"."form_publication_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."form_publication_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."form_response_drafts" TO "anon";
GRANT ALL ON TABLE "public"."form_response_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."form_response_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."form_responses" TO "anon";
GRANT ALL ON TABLE "public"."form_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."form_responses" TO "service_role";



GRANT ALL ON TABLE "public"."form_versions" TO "anon";
GRANT ALL ON TABLE "public"."form_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_versions" TO "service_role";



GRANT ALL ON TABLE "public"."forms" TO "anon";
GRANT ALL ON TABLE "public"."forms" TO "authenticated";
GRANT ALL ON TABLE "public"."forms" TO "service_role";



GRANT ALL ON TABLE "public"."microsoft_accounts" TO "anon";
GRANT ALL ON TABLE "public"."microsoft_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."microsoft_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."microsoft_shared_mailboxes" TO "anon";
GRANT ALL ON TABLE "public"."microsoft_shared_mailboxes" TO "authenticated";
GRANT ALL ON TABLE "public"."microsoft_shared_mailboxes" TO "service_role";



GRANT ALL ON TABLE "public"."ms_oauth_tokens" TO "anon";
GRANT ALL ON TABLE "public"."ms_oauth_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."ms_oauth_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."notification_log" TO "anon";
GRANT ALL ON TABLE "public"."notification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_log" TO "service_role";



GRANT ALL ON TABLE "public"."ocr_cache" TO "anon";
GRANT ALL ON TABLE "public"."ocr_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ocr_cache" TO "service_role";



GRANT ALL ON TABLE "public"."ocr_metrics" TO "anon";
GRANT ALL ON TABLE "public"."ocr_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."ocr_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."pending_access_requests" TO "anon";
GRANT ALL ON TABLE "public"."pending_access_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_access_requests" TO "service_role";



GRANT ALL ON TABLE "public"."portal_users" TO "anon";
GRANT ALL ON TABLE "public"."portal_users" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_users" TO "service_role";



GRANT ALL ON TABLE "public"."portals" TO "anon";
GRANT ALL ON TABLE "public"."portals" TO "authenticated";
GRANT ALL ON TABLE "public"."portals" TO "service_role";



GRANT ALL ON TABLE "public"."processing_cache" TO "anon";
GRANT ALL ON TABLE "public"."processing_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_cache" TO "service_role";



GRANT ALL ON TABLE "public"."processing_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."processing_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."processing_steps" TO "anon";
GRANT ALL ON TABLE "public"."processing_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_steps" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_binary_assets" TO "anon";
GRANT ALL ON TABLE "public"."protheus_binary_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_binary_assets" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_config" TO "anon";
GRANT ALL ON TABLE "public"."protheus_config" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_config" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_customer_group_units" TO "anon";
GRANT ALL ON TABLE "public"."protheus_customer_group_units" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_customer_group_units" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_customer_groups" TO "anon";
GRANT ALL ON TABLE "public"."protheus_customer_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_customer_groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."protheus_customer_groups_id_grupo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."protheus_customer_groups_id_grupo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."protheus_customer_groups_id_grupo_seq" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_dynamic_tables" TO "anon";
GRANT ALL ON TABLE "public"."protheus_dynamic_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_dynamic_tables" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_group_update_results" TO "anon";
GRANT ALL ON TABLE "public"."protheus_group_update_results" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_group_update_results" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_group_update_runs" TO "anon";
GRANT ALL ON TABLE "public"."protheus_group_update_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_group_update_runs" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sa1010_80f17f00" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sa1010_80f17f00" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sa1010_80f17f00" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sa2010_72a51158" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sa2010_72a51158" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sa2010_72a51158" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sa3010_fc3d70f6" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sa3010_fc3d70f6" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sa3010_fc3d70f6" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sa4010_ea26a13a" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sa4010_ea26a13a" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sa4010_ea26a13a" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sa5010_6d3daa8e" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sa5010_6d3daa8e" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sa5010_6d3daa8e" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sb1010_b0316113" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sb1010_b0316113" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sb1010_b0316113" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sds010_f444bb4c" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sds010_f444bb4c" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sds010_f444bb4c" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_supplier_groups" TO "anon";
GRANT ALL ON TABLE "public"."protheus_supplier_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_supplier_groups" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_supplier_material_types_map" TO "anon";
GRANT ALL ON TABLE "public"."protheus_supplier_material_types_map" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_supplier_material_types_map" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sy1010_3249e97a" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sy1010_3249e97a" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sy1010_3249e97a" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sync_deletions" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sync_deletions" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sync_deletions" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sync_errors" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sync_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sync_errors" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."protheus_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_table_extra_fields" TO "anon";
GRANT ALL ON TABLE "public"."protheus_table_extra_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_table_extra_fields" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_table_relationships" TO "anon";
GRANT ALL ON TABLE "public"."protheus_table_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_table_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_tables" TO "anon";
GRANT ALL ON TABLE "public"."protheus_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_tables" TO "service_role";



GRANT ALL ON TABLE "public"."protheus_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."protheus_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."protheus_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_economic_group_material_types" TO "anon";
GRANT ALL ON TABLE "public"."purchases_economic_group_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_economic_group_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_economic_group_members" TO "anon";
GRANT ALL ON TABLE "public"."purchases_economic_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_economic_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_economic_groups" TO "anon";
GRANT ALL ON TABLE "public"."purchases_economic_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_economic_groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_economic_groups_id_grupo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_economic_groups_id_grupo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_economic_groups_id_grupo_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_material_type_buyer_queue" TO "anon";
GRANT ALL ON TABLE "public"."purchases_material_type_buyer_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_material_type_buyer_queue" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_material_types" TO "anon";
GRANT ALL ON TABLE "public"."purchases_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_potential_supplier_material_types" TO "anon";
GRANT ALL ON TABLE "public"."purchases_potential_supplier_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_potential_supplier_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_potential_supplier_tags" TO "anon";
GRANT ALL ON TABLE "public"."purchases_potential_supplier_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_potential_supplier_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_potential_suppliers_pf_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_potential_suppliers_pf_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_potential_suppliers_pf_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_potential_suppliers" TO "anon";
GRANT ALL ON TABLE "public"."purchases_potential_suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_potential_suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_supplier_group_material_types" TO "anon";
GRANT ALL ON TABLE "public"."purchases_supplier_group_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_supplier_group_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_unified_supplier_material_types" TO "anon";
GRANT ALL ON TABLE "public"."purchases_unified_supplier_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_unified_supplier_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_unified_supplier_tags" TO "anon";
GRANT ALL ON TABLE "public"."purchases_unified_supplier_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_unified_supplier_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_unified_suppliers_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_unified_suppliers_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_unified_suppliers_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_unified_suppliers" TO "anon";
GRANT ALL ON TABLE "public"."purchases_unified_suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_unified_suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."record_shares" TO "anon";
GRANT ALL ON TABLE "public"."record_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."record_shares" TO "service_role";



GRANT ALL ON TABLE "public"."sales_lead_tags" TO "anon";
GRANT ALL ON TABLE "public"."sales_lead_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_lead_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_leads_lead_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_leads_lead_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_leads_lead_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_leads" TO "anon";
GRANT ALL ON TABLE "public"."sales_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_leads" TO "service_role";



GRANT ALL ON TABLE "public"."sales_vendor_user_links" TO "anon";
GRANT ALL ON TABLE "public"."sales_vendor_user_links" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_vendor_user_links" TO "service_role";



GRANT ALL ON TABLE "public"."site_cities" TO "anon";
GRANT ALL ON TABLE "public"."site_cities" TO "authenticated";
GRANT ALL ON TABLE "public"."site_cities" TO "service_role";



GRANT ALL ON TABLE "public"."site_city_distance_errors" TO "anon";
GRANT ALL ON TABLE "public"."site_city_distance_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."site_city_distance_errors" TO "service_role";



GRANT ALL ON TABLE "public"."site_city_distance_jobs" TO "anon";
GRANT ALL ON TABLE "public"."site_city_distance_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."site_city_distance_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."site_documents" TO "anon";
GRANT ALL ON TABLE "public"."site_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."site_documents" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_applications" TO "anon";
GRANT ALL ON TABLE "public"."site_product_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_applications" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_applications_map" TO "anon";
GRANT ALL ON TABLE "public"."site_product_applications_map" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_applications_map" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_families" TO "anon";
GRANT ALL ON TABLE "public"."site_product_families" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_families" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_groups" TO "anon";
GRANT ALL ON TABLE "public"."site_product_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_groups" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_groups_map" TO "anon";
GRANT ALL ON TABLE "public"."site_product_groups_map" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_groups_map" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_names" TO "anon";
GRANT ALL ON TABLE "public"."site_product_names" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_names" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_segments" TO "anon";
GRANT ALL ON TABLE "public"."site_product_segments" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_segments" TO "service_role";



GRANT ALL ON TABLE "public"."site_product_segments_map" TO "anon";
GRANT ALL ON TABLE "public"."site_product_segments_map" TO "authenticated";
GRANT ALL ON TABLE "public"."site_product_segments_map" TO "service_role";



GRANT ALL ON TABLE "public"."site_products" TO "anon";
GRANT ALL ON TABLE "public"."site_products" TO "authenticated";
GRANT ALL ON TABLE "public"."site_products" TO "service_role";



GRANT ALL ON TABLE "public"."task_attachments" TO "anon";
GRANT ALL ON TABLE "public"."task_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_dependencies" TO "anon";
GRANT ALL ON TABLE "public"."task_dependencies" TO "authenticated";
GRANT ALL ON TABLE "public"."task_dependencies" TO "service_role";



GRANT ALL ON TABLE "public"."task_draft_uploads" TO "anon";
GRANT ALL ON TABLE "public"."task_draft_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."task_draft_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."task_drafts" TO "anon";
GRANT ALL ON TABLE "public"."task_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."task_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."task_history" TO "anon";
GRANT ALL ON TABLE "public"."task_history" TO "authenticated";
GRANT ALL ON TABLE "public"."task_history" TO "service_role";



GRANT ALL ON TABLE "public"."task_series" TO "anon";
GRANT ALL ON TABLE "public"."task_series" TO "authenticated";
GRANT ALL ON TABLE "public"."task_series" TO "service_role";



GRANT ALL ON TABLE "public"."task_templates" TO "anon";
GRANT ALL ON TABLE "public"."task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."task_types" TO "anon";
GRANT ALL ON TABLE "public"."task_types" TO "authenticated";
GRANT ALL ON TABLE "public"."task_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tasks_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tasks_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tasks_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."tasks_blockers_v" TO "anon";
GRANT ALL ON TABLE "public"."tasks_blockers_v" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks_blockers_v" TO "service_role";



GRANT ALL ON TABLE "public"."trusted_devices" TO "anon";
GRANT ALL ON TABLE "public"."trusted_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."trusted_devices" TO "service_role";



GRANT ALL ON TABLE "public"."unified_account_segments_map" TO "anon";
GRANT ALL ON TABLE "public"."unified_account_segments_map" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_account_segments_map" TO "service_role";



GRANT ALL ON SEQUENCE "public"."unified_accounts_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."unified_accounts_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."unified_accounts_seq" TO "service_role";



GRANT ALL ON TABLE "public"."unified_accounts" TO "anon";
GRANT ALL ON TABLE "public"."unified_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."user_email_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_email_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_email_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."user_id_map" TO "anon";
GRANT ALL ON TABLE "public"."user_id_map" TO "authenticated";
GRANT ALL ON TABLE "public"."user_id_map" TO "service_role";



GRANT ALL ON TABLE "public"."user_notification_configs" TO "anon";
GRANT ALL ON TABLE "public"."user_notification_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notification_configs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_user_links" TO "anon";
GRANT ALL ON TABLE "public"."vendor_user_links" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_user_links" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_approvals" TO "anon";
GRANT ALL ON TABLE "public"."workflow_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_auto_triggers" TO "anon";
GRANT ALL ON TABLE "public"."workflow_auto_triggers" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_auto_triggers" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_corrections" TO "anon";
GRANT ALL ON TABLE "public"."workflow_corrections" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_corrections" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_execution_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_execution_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_execution_steps" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_queue" TO "anon";
GRANT ALL ON TABLE "public"."workflow_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_queue" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_templates" TO "anon";
GRANT ALL ON TABLE "public"."workflow_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_templates" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_trigger_logs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_trigger_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_trigger_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
