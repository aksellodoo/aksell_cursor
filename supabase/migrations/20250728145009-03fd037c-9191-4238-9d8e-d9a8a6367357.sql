-- Criar enum para níveis de confidencialidade
CREATE TYPE confidentiality_level AS ENUM ('public', 'department_leaders', 'directors_admins');

-- Criar enum para status de aprovação
CREATE TYPE approval_status AS ENUM ('approved', 'pending', 'rejected');

-- Adicionar novos campos à tabela chatter_files
ALTER TABLE public.chatter_files 
ADD COLUMN description text NOT NULL DEFAULT '',
ADD COLUMN confidentiality_level confidentiality_level NOT NULL DEFAULT 'public',
ADD COLUMN document_group_id uuid,
ADD COLUMN version_number integer DEFAULT 1,
ADD COLUMN is_current_version boolean DEFAULT true,
ADD COLUMN effective_date timestamp with time zone DEFAULT now(),
ADD COLUMN expiry_date timestamp with time zone,
ADD COLUMN notify_before_expiry interval,
ADD COLUMN notify_users uuid[],
ADD COLUMN notify_department_id uuid,
ADD COLUMN requires_approval boolean DEFAULT false,
ADD COLUMN approval_users uuid[],
ADD COLUMN approval_department_id uuid,
ADD COLUMN approval_status approval_status DEFAULT 'approved',
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone;

-- Atualizar registros existentes
UPDATE public.chatter_files 
SET document_group_id = gen_random_uuid()
WHERE document_group_id IS NULL;

-- Tornar document_group_id obrigatório
ALTER TABLE public.chatter_files 
ALTER COLUMN document_group_id SET NOT NULL;

-- Criar índices para performance
CREATE INDEX idx_chatter_files_document_group ON public.chatter_files(document_group_id);
CREATE INDEX idx_chatter_files_record ON public.chatter_files(record_type, record_id);
CREATE INDEX idx_chatter_files_approval_status ON public.chatter_files(approval_status);
CREATE INDEX idx_chatter_files_expiry ON public.chatter_files(expiry_date) WHERE expiry_date IS NOT NULL;

-- Função para auto-geração de document_group_id e controle de versões
CREATE OR REPLACE FUNCTION public.handle_chatter_file_versioning()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para versionamento
CREATE TRIGGER chatter_files_versioning_trigger
  BEFORE INSERT ON public.chatter_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_chatter_file_versioning();

-- Função para verificar permissões de confidencialidade
CREATE OR REPLACE FUNCTION public.can_access_confidential_file(
  file_confidentiality confidentiality_level,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Função para verificar se usuário pode aprovar arquivo
CREATE OR REPLACE FUNCTION public.can_approve_file(
  file_id uuid,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Atualizar RLS policies para chatter_files
DROP POLICY IF EXISTS "Users can view chatter files for accessible records" ON public.chatter_files;
DROP POLICY IF EXISTS "Users can upload chatter files" ON public.chatter_files;
DROP POLICY IF EXISTS "Users can delete their own chatter files" ON public.chatter_files;

-- Política para visualização (considera confidencialidade e status de aprovação)
CREATE POLICY "Users can view chatter files with confidentiality check"
ON public.chatter_files FOR SELECT
USING (
  -- Pode ver se tem acesso baseado na confidencialidade
  public.can_access_confidential_file(confidentiality_level, auth.uid())
  AND (
    -- Arquivo aprovado - todos podem ver
    approval_status = 'approved'
    OR
    -- Arquivo pendente - apenas quem fez upload e aprovadores podem ver
    (approval_status = 'pending' AND (
      uploaded_by = auth.uid() 
      OR public.can_approve_file(id, auth.uid())
    ))
    OR
    -- Arquivo rejeitado - apenas quem fez upload pode ver
    (approval_status = 'rejected' AND uploaded_by = auth.uid())
  )
);

-- Política para upload
CREATE POLICY "Users can upload chatter files"
ON public.chatter_files FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Política para atualização (aprovação)
CREATE POLICY "Users can update files for approval"
ON public.chatter_files FOR UPDATE
USING (
  uploaded_by = auth.uid() 
  OR public.can_approve_file(id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director', 'hr')
  )
);

-- Política para exclusão (apenas arquivos aprovados podem ser excluídos pelo uploader)
CREATE POLICY "Users can delete approved files they uploaded"
ON public.chatter_files FOR DELETE
USING (
  uploaded_by = auth.uid() 
  AND approval_status = 'approved'
);

-- Função para notificar sobre documentos próximos ao vencimento
CREATE OR REPLACE FUNCTION public.check_document_expiry_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  END LOOP;
END;
$$;