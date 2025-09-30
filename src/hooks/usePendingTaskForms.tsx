
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PendingTaskForm {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  created_at: string;
  assigned_to?: string;
  assigned_users?: string[];
  assigned_department?: string;
  form: {
    id: string;
    title: string;
    description?: string;
    status: string;
  };
  creator: {
    name: string;
  };
  assignedUser?: {
    name: string;
  };
  department?: {
    name: string;
  };
}

export const usePendingTaskForms = () => {
  const [forms, setForms] = useState<PendingTaskForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPendingTaskForms = async () => {
    if (!user) {
      setForms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch tasks with associated forms where user is assigned and form status is task_usage
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          priority,
          status,
          due_date,
          created_at,
          assigned_to,
          assigned_users,
          assigned_department,
          form_id,
          forms!inner (
            id,
            title,
            description,
            status
          ),
          created_by
        `)
        .not('form_id', 'is', null)
        .eq('forms.status', 'task_usage')
        .neq('status', 'done')
        .or(`assigned_to.eq.${user.id},assigned_users.cs.{"${user.id}"}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately for better type safety
      const userIds = new Set<string>();
      (data || []).forEach(task => {
        if (task.created_by) userIds.add(task.created_by);
        if (task.assigned_to) userIds.add(task.assigned_to);
      });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(userIds));

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

      // Fetch department data separately
      const departmentIds = new Set<string>();
      (data || []).forEach(task => {
        if (task.assigned_department) departmentIds.add(task.assigned_department);
      });

      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', Array.from(departmentIds));

      const departmentsMap = new Map(departmentsData?.map(d => [d.id, d.name]) || []);

      const transformedData = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        created_at: task.created_at,
        assigned_to: task.assigned_to,
        assigned_users: task.assigned_users,
        assigned_department: task.assigned_department,
        form: {
          id: task.forms.id,
          title: task.forms.title,
          description: task.forms.description,
          status: task.forms.status,
        },
        creator: {
          name: profilesMap.get(task.created_by) || 'Usuário desconhecido',
        },
        assignedUser: task.assigned_to ? {
          name: profilesMap.get(task.assigned_to) || 'Usuário desconhecido',
        } : undefined,
        department: task.assigned_department ? {
          name: departmentsMap.get(task.assigned_department) || 'Departamento desconhecido',
        } : undefined,
      }));

      setForms(transformedData);
    } catch (error) {
      console.error('Error fetching pending task forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTaskForms();
  }, [user]);

  return {
    forms,
    loading,
    refetch: fetchPendingTaskForms,
  };
};
