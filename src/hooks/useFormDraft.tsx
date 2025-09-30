
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FormDraft {
  id: string;
  form_id: string;
  user_id: string;
  response_data: any;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export const useFormDraft = (formId: string) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<FormDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar rascunho existente
  const loadDraft = async () => {
    if (!user || !formId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('form_response_drafts')
        .select('*')
        .eq('form_id', formId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setDraft(data || null);
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar ou atualizar rascunho
  const saveDraft = async (responseData: any, progressPercent: number = 0) => {
    if (!user || !formId) return false;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('form_response_drafts')
        .upsert(
          {
            form_id: formId,
            user_id: user.id,
            response_data: responseData,
            progress_percent: progressPercent,
          },
          {
            onConflict: 'form_id,user_id'
          }
        )
        .select()
        .single();

      if (error) throw error;

      setDraft(data);
      toast.success('Rascunho salvo com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Deletar rascunho
  const deleteDraft = async () => {
    if (!user || !formId || !draft) return false;

    try {
      const { error } = await supabase
        .from('form_response_drafts')
        .delete()
        .eq('form_id', formId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDraft(null);
      return true;
    } catch (error) {
      console.error('Erro ao deletar rascunho:', error);
      return false;
    }
  };

  // Calcular percentual de progresso baseado nos campos preenchidos
  const calculateProgress = (formData: any, fieldsDefinition: any[]): number => {
    if (!fieldsDefinition || fieldsDefinition.length === 0) return 0;

    const requiredFields = fieldsDefinition.filter(field => field.required);
    const allFields = fieldsDefinition;
    
    // Contar campos preenchidos (considerar tanto obrigatórios quanto opcionais)
    let filledFields = 0;
    
    allFields.forEach(field => {
      const value = formData[field.id];
      if (value !== undefined && value !== null && value !== '') {
        // Para arrays e objetos, verificar se não estão vazios
        if (Array.isArray(value) && value.length > 0) {
          filledFields++;
        } else if (typeof value === 'object' && Object.keys(value).length > 0) {
          filledFields++;
        } else if (typeof value === 'string' && value.trim() !== '') {
          filledFields++;
        } else if (typeof value !== 'object' && value !== '') {
          filledFields++;
        }
      }
    });

    return Math.round((filledFields / allFields.length) * 100);
  };

  useEffect(() => {
    loadDraft();
  }, [user, formId]);

  return {
    draft,
    loading,
    saving,
    saveDraft,
    deleteDraft,
    calculateProgress,
    refreshDraft: loadDraft
  };
};
