import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface TaskType {
  id: string;
  name: string;
  description?: string;
  icon_name: string;
  icon_color: string;
  form_id?: string;
  goes_to_pending_list?: boolean;
  filling_type: 'none' | 'approval';
  approval_config?: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  confidentiality_level: 'public' | 'private' | 'department_leaders' | 'directors_admins';
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
  forms?: {
    id: string;
    title: string;
  };
}

export interface CreateTaskTypeData {
  name: string;
  description?: string;
  icon_name: string;
  icon_color: string;
  form_id?: string;
  goes_to_pending_list?: boolean;
  filling_type: 'none' | 'approval';
  approval_config?: any;
  confidentiality_level: 'public' | 'private' | 'department_leaders' | 'directors_admins';
  allowed_users?: string[];
  allowed_departments?: string[];
  allowed_roles?: string[];
}

export const useTaskTypes = () => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTaskTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_types')
        .select(`
          *,
          forms (
            id,
            title
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar tipos de tarefa:', error);
        throw error;
      }

      setTaskTypes(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de tarefa:', error);
      toast({
        title: "Erro ao carregar tipos de tarefa",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTaskType = async (data: CreateTaskTypeData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar tipos de tarefa.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('task_types')
        .insert({
          ...data,
          created_by: user.id,
        });

      if (error) {
        console.error('Erro ao criar tipo de tarefa:', error);
        throw error;
      }

      toast({
        title: "Tipo de tarefa criado!",
        description: `O tipo "${data.name}" foi criado com sucesso.`,
      });

      await fetchTaskTypes();
      return true;
    } catch (error) {
      console.error('Erro ao criar tipo de tarefa:', error);
      toast({
        title: "Erro ao criar tipo de tarefa",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTaskType = async (id: string, data: Partial<CreateTaskTypeData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_types')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar tipo de tarefa:', error);
        throw error;
      }

      toast({
        title: "Tipo de tarefa atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      await fetchTaskTypes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tipo de tarefa:', error);
      toast({
        title: "Erro ao atualizar tipo de tarefa",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTaskType = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir tipo de tarefa:', error);
        throw error;
      }

      toast({
        title: "Tipo de tarefa removido!",
        description: "O tipo foi removido com sucesso.",
      });

      await fetchTaskTypes();
      return true;
    } catch (error) {
      console.error('Erro ao excluir tipo de tarefa:', error);
      toast({
        title: "Erro ao excluir tipo de tarefa",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchTaskTypes();
    }
  }, [user]);

  return {
    taskTypes,
    loading,
    createTaskType,
    updateTaskType,
    deleteTaskType,
    refetch: fetchTaskTypes,
  };
};