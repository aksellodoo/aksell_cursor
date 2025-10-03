import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Task } from './useTasks';

interface UseTaskResult {
  task: Task | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateTask: (updates: Partial<Task>) => Promise<boolean>;
}

export const useTask = (taskId: string | undefined): UseTaskResult => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTask = async () => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:assigned_to(
            id,
            name,
            email
          ),
          assigned_department_profile:assigned_department(
            id,
            name,
            color
          ),
          creator:created_by(
            id,
            name,
            email
          )
        `)
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      setTask(data as Task);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching task:', error);
      setError(error);
      toast.error(`Erro ao carregar tarefa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (updates: Partial<Task>): Promise<boolean> => {
    if (!taskId) return false;

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast.success('Tarefa atualizada com sucesso!');
      await fetchTask(); // Refresh task data
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating task:', error);
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
    updateTask,
  };
};
