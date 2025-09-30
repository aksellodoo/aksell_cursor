import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: string;
  publication_status?: string;
  is_published?: boolean;
  published_at?: string;
  version_number?: number;
  is_public: boolean;
  allow_anonymous: boolean;
  allows_anonymous_responses?: boolean;
  internal_recipients?: any;
  external_recipients?: any[];
  has_responses?: boolean;
  settings: any;
  fields_definition: any;
  share_settings: any;
  publication_settings?: any;
  confidentiality_level: 'public' | 'department_leaders' | 'directors_admins' | 'private';
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
}

export interface FormResponse {
  id: string;
  form_id: string;
  response_data: any;
  submitted_by?: string;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
  metadata: any;
}

export const useForms = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Verificar quais formulários têm respostas
      if (data && data.length > 0) {
        const formIds = data.map(form => form.id);
        const { data: responseCounts, error: responseError } = await supabase
          .from('form_responses')
          .select('form_id')
          .in('form_id', formIds);
        
        if (!responseError) {
          const formsWithResponses = new Set(responseCounts?.map(r => r.form_id) || []);
          const enrichedForms = data.map(form => ({
            ...form,
            has_responses: formsWithResponses.has(form.id)
          }));
          setForms(enrichedForms);
        } else {
          setForms(data || []);
        }
      } else {
        setForms(data || []);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (formData: any) => {
    if (!user) return null;

    try {
      const status = formData.status || 'draft';
      const isPublished = ['published_internal', 'published_external', 'published_mixed'].includes(status);
      
      const { data, error } = await supabase
        .from('forms')
        .insert({
          title: formData.title || 'Novo Formulário',
          description: formData.description,
          status: status,
          publication_status: isPublished ? status : 'draft',
          is_published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null,
          is_public: formData.is_public || false,
          allow_anonymous: formData.allow_anonymous || false,
          allows_anonymous_responses: formData.allows_anonymous_responses || false,
          settings: formData.settings || {},
          fields_definition: formData.fields_definition || [],
          share_settings: formData.share_settings || {},
          publication_settings: formData.publication_settings || {},
          internal_recipients: formData.internal_recipients || [],
          confidentiality_level: formData.confidentiality_level || 'public',
          allowed_users: formData.allowed_users || [],
          allowed_departments: formData.allowed_departments || [],
          allowed_roles: formData.allowed_roles || [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setForms(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating form:', error);
      return null;
    }
  };

  const updateForm = async (id: string, formData: Partial<Form>) => {
    try {
      console.log('=== useForms.updateForm INICIADO ===');
      console.log('ID:', id);
      console.log('FormData recebido:', formData);

      if (!id) {
        throw new Error('ID do formulário é obrigatório');
      }

      // Mapear dados de configuração para campos do formulário que existem na tabela
      const mappedData: any = {
        updated_at: new Date().toISOString()
      };

      // Atualizar apenas campos que existem na tabela forms
      if (formData.title !== undefined) mappedData.title = formData.title;
      if (formData.description !== undefined) mappedData.description = formData.description;
      if (formData.fields_definition !== undefined) mappedData.fields_definition = formData.fields_definition;
      if (formData.settings !== undefined) mappedData.settings = formData.settings;
      
      // Status e publicação
      if (formData.status !== undefined) mappedData.status = formData.status;
      if (formData.publication_status !== undefined) mappedData.publication_status = formData.publication_status;
      if (formData.is_published !== undefined) mappedData.is_published = formData.is_published;
      if (formData.published_at !== undefined) mappedData.published_at = formData.published_at;
      
      // Configurações de acesso
      if (formData.allows_anonymous_responses !== undefined) mappedData.allows_anonymous_responses = formData.allows_anonymous_responses;
      if (formData.confidentiality_level !== undefined) mappedData.confidentiality_level = formData.confidentiality_level;
      if (formData.allowed_users !== undefined) mappedData.allowed_users = formData.allowed_users;
      if (formData.allowed_departments !== undefined) mappedData.allowed_departments = formData.allowed_departments;
      if (formData.allowed_roles !== undefined) mappedData.allowed_roles = formData.allowed_roles;
      
      // Configurações e destinatários
      if (formData.publication_settings !== undefined) mappedData.publication_settings = formData.publication_settings;
      
      // internal_recipients como jsonb (não array)
      if (formData.internal_recipients !== undefined) {
        mappedData.internal_recipients = formData.internal_recipients;
      }
      
      // IMPORTANTE: external_recipients NÃO existe na tabela forms
      // Este campo deve ser tratado separadamente na tabela form_external_recipients
      
      console.log('=== DADOS MAPEADOS PARA SALVAMENTO ===');
      console.log('MappedData:', mappedData);
      console.log('Campos que serão atualizados:', Object.keys(mappedData));

      const { data, error } = await supabase
        .from('forms')
        .update(mappedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('=== ERRO NO SUPABASE ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw new Error(`Erro no banco de dados: ${error.message}`);
      }

      console.log('=== FORMULÁRIO ATUALIZADO COM SUCESSO ===');
      console.log('Updated form:', data);

      // Atualizar estado local
      setForms(prevForms => 
        prevForms.map(form => 
          form.id === id ? { ...form, ...data } : form
        )
      );

      toast.success('Formulário atualizado com sucesso!');
      return data;
    } catch (error) {
      console.error('=== ERRO EM updateForm ===');
      console.error('Detalhes do erro:', error);
      throw error; // Re-lançar para o componente tratar
    }
  };

  const deleteForm = async (id: string) => {
    try {
      console.log('=== TENTANDO EXCLUIR FORMULÁRIO ===');
      console.log('Form ID:', id);

      // Usar select para verificar se a exclusão foi bem-sucedida
      const { data, error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        console.error('Erro na exclusão:', error);
        throw error;
      }

      console.log('Resultado da exclusão:', data);

      // Verificar se realmente excluiu algo
      if (!data || data.length === 0) {
        console.warn('Nenhum formulário foi excluído - possível problema de permissão');
        toast.error('Não foi possível excluir o formulário. Verifique suas permissões.');
        return false;
      }

      console.log('=== FORMULÁRIO EXCLUÍDO COM SUCESSO ===');
      
      // Atualizar estado local apenas se a exclusão foi bem-sucedida
      setForms(prev => prev.filter(form => form.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Erro ao excluir formulário.');
      return false;
    }
  };

  const duplicateForm = async (id: string) => {
    const form = forms.find(f => f.id === id);
    if (!form) return null;

    const { id: _, created_at, updated_at, ...formData } = form;
    return createForm({
      ...formData,
      title: `${form.title} (Cópia)`,
      status: 'draft'
    });
  };

  const getFormResponses = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching form responses:', error);
      return [];
    }
  };

  const submitFormResponse = async (formId: string, responseData: any, metadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          response_data: responseData,
          submitted_by: user?.id,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting form response:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchForms();
  }, [user]);

  return {
    forms,
    loading,
    createForm,
    updateForm,
    deleteForm,
    duplicateForm,
    getFormResponses,
    submitFormResponse,
    refetch: fetchForms
  };
};
