import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { FixedTaskType } from '@/lib/taskTypesFixed';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  fixed_type: FixedTaskType;
  department_id?: string;
  default_assignee_id?: string;
  default_sla_hours?: number;
  default_checklist?: string[];
  required_attachments?: string[];
  default_payload: any;
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
  confidentiality_level: 'public' | 'private' | 'department_leaders' | 'directors_admins';
  list_in_pending?: boolean;
  default_priority?: 'P1' | 'P2' | 'P3' | 'P4';
  default_tags?: string[];
  default_expected_offset_hours?: number;
  default_deadline_offset_hours?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  departments?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskTemplateData {
  name: string;
  description?: string;
  fixed_type: FixedTaskType;
  department_id?: string;
  default_assignee_id?: string;
  default_sla_hours?: number;
  default_checklist?: string[];
  required_attachments?: string[];
  default_payload: any;
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
  confidentiality_level: 'public' | 'private' | 'department_leaders' | 'directors_admins';
  list_in_pending?: boolean;
  default_priority?: 'P1' | 'P2' | 'P3' | 'P4';
  default_tags?: string[];
  default_expected_offset_hours?: number;
  default_deadline_offset_hours?: number;
}

export const useTaskTemplates = () => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          departments (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar templates de tarefa:', error);
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates de tarefa:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (data: CreateTaskTemplateData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar templates.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('task_templates')
        .insert({
          ...data,
          created_by: user.id,
        });

      if (error) {
        console.error('Erro ao criar template:', error);
        throw error;
      }

      toast({
        title: "Template criado!",
        description: `O template "${data.name}" foi criado com sucesso.`,
      });

      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: "Erro ao criar template",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTemplate = async (id: string, data: Partial<CreateTaskTemplateData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_templates')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar template:', error);
        throw error;
      }

      toast({
        title: "Template atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: "Erro ao atualizar template",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir template:', error);
        throw error;
      }

      toast({
        title: "Template removido!",
        description: "O template foi removido com sucesso.",
      });

      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro ao excluir template",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTemplate = async (id: string): Promise<TaskTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          departments (
            id,
            name
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao buscar template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
  };

  const getTemplatesByType = (fixedType: FixedTaskType) => {
    return templates.filter(template => template.fixed_type === fixedType);
  };

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    getTemplatesByType,
    refetch: fetchTemplates,
  };
};