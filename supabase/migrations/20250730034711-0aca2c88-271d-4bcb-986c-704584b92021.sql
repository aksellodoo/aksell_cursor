-- Criar tabela para controlar compartilhamentos de registros
CREATE TABLE public.record_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_by UUID NOT NULL REFERENCES public.profiles(id),
  shared_with UUID NOT NULL REFERENCES public.profiles(id),
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_name TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view'],
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  expiry_condition JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.record_shares ENABLE ROW LEVEL SECURITY;

-- Função recursiva para buscar todos os subordinados
CREATE OR REPLACE FUNCTION public.get_all_subordinates(user_id UUID)
RETURNS TABLE(subordinate_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    -- Base case: direct subordinates
    SELECT id
    FROM public.profiles
    WHERE supervisor_id = user_id
    
    UNION
    
    -- Recursive case: subordinates of subordinates
    SELECT p.id
    FROM public.profiles p
    INNER JOIN subordinates s ON p.supervisor_id = s.id
  )
  SELECT id FROM subordinates;
END;
$$;

-- Função para verificar acesso a registro compartilhado
CREATE OR REPLACE FUNCTION public.check_shared_record_access(
  p_record_type TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- RLS Policies para record_shares
CREATE POLICY "Users can view shares involving them or their team"
ON public.record_shares
FOR SELECT
USING (
  shared_by = auth.uid() 
  OR shared_with = auth.uid()
  OR shared_by IN (SELECT subordinate_id FROM public.get_all_subordinates(auth.uid()))
  OR shared_with IN (SELECT subordinate_id FROM public.get_all_subordinates(auth.uid()))
  OR auth.uid() IN (SELECT subordinate_id FROM public.get_all_subordinates(shared_with))
  OR auth.uid() IN (SELECT subordinate_id FROM public.get_all_subordinates(shared_by))
);

CREATE POLICY "Users can create record shares"
ON public.record_shares
FOR INSERT
WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update their own shares"
ON public.record_shares
FOR UPDATE
USING (shared_by = auth.uid());

CREATE POLICY "Users can delete their own shares"
ON public.record_shares
FOR DELETE
USING (shared_by = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_record_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_record_shares_updated_at
  BEFORE UPDATE ON public.record_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_record_shares_updated_at();

-- Índices para performance
CREATE INDEX idx_record_shares_shared_with ON public.record_shares(shared_with);
CREATE INDEX idx_record_shares_shared_by ON public.record_shares(shared_by);
CREATE INDEX idx_record_shares_record ON public.record_shares(record_type, record_id);
CREATE INDEX idx_record_shares_status ON public.record_shares(status);
CREATE INDEX idx_record_shares_expires_at ON public.record_shares(expires_at);

-- Log de auditoria para compartilhamentos
CREATE OR REPLACE FUNCTION public.audit_record_shares()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_record_shares_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.record_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_record_shares();