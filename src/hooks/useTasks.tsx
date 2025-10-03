
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface Task {
  id: string;
  task_code: number;
  title: string;
  description: string | null;
  status: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  assigned_to: string | null;
  assigned_department: string | null;
  assigned_users: string[] | null;
  created_by: string;
  due_date: string | null;
  expected_completion_at: string | null;
  deadline_at: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[] | null;
  record_type: string | null;
  record_id: string | null;
  workflow_id: string | null;
  workflow_step_id: string | null;
  workflow_step_name: string | null;
  task_type_id: string | null;
  approval_title: string | null;
  approval_description: string | null;
  is_workflow_generated: boolean;
  created_at: string;
  updated_at: string;
  
  // Novos campos
  fixed_type: string;
  payload: any;
  template_id: string | null;
  template_snapshot: any;
  series_id: string | null;
  occurrence_no: number | null;
  occurrence_start: string | null;
  weblink: string | null;
  
  // Relacionamentos
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assigned_department_profile?: {
    id: string;
    name: string;
    color: string;
  } | null;
  assigned_users_profiles?: {
    id: string;
    name: string;
    email: string;
  }[];
  created_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  template?: {
    id: string;
    name: string;
    fixed_type: string;
  } | null;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  status?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  assigned_to?: string | null;
  assigned_department?: string | null;
  assigned_users?: string[] | null;
  due_date?: string | null;
  expected_completion_at?: string | null;
  deadline_at?: string | null;
  estimated_hours?: number | null;
  tags?: string[] | null;
  record_type?: string | null;
  record_id?: string | null;
  workflow_id?: string | null;
  workflow_step_id?: string | null;
  task_type_id?: string | null;
  approval_title?: string | null;
  approval_description?: string | null;
  fixed_type: string;
  payload?: any;
  template_id?: string | null;
  template_snapshot?: any;
  series_id?: string | null;
  occurrence_no?: number | null;
  occurrence_start?: string | null;
  attachments?: Array<{ id: string; name: string }>;
}

export interface TaskFilter {
  status?: string[];
  priority?: string[];
  assigned_to?: string[];
  assigned_department?: string[];
  assigned_users?: string[];
  created_by?: string[];
  record_type?: string;
  record_id?: string;
  workflow_id?: string;
  search?: string;
  tags?: string[];
  due_date_from?: string;
  due_date_to?: string;
  fixed_types?: string[];
  template_id?: string;
  only_pending?: boolean;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>({});

  // Buscar tarefas com filtros
  const fetchTasks = async (filterOptions: TaskFilter = {}) => {
    try {
      setLoading(true);

      // Query com JOINs para carregar dados relacionados
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, name, email),
          created_user:profiles!tasks_created_by_fkey(id, name, email),
          assigned_department_profile:departments(id, name, color),
          template:task_templates(id, name, fixed_type)
        `)
        .order('created_at', { ascending: false });

      // Filtro de visibilidade: usuário pode ver tarefas que:
      // 1. Foram criadas por ele
      // 2. Foram atribuídas a ele
      // 3. Ele está na lista de assigned_users
      // 4. São do departamento dele (se assigned_department estiver preenchido)
      // OU é admin/director que vê todas

      console.log('🔍 Fetching tasks for user:', user?.id);

      // Aplicar filtros
      if (filterOptions.status && filterOptions.status.length > 0) {
        query = query.in('status', filterOptions.status);
      }

      if (filterOptions.priority && filterOptions.priority.length > 0) {
        query = query.in('priority', filterOptions.priority);
      }

      if (filterOptions.assigned_to && filterOptions.assigned_to.length > 0) {
        query = query.in('assigned_to', filterOptions.assigned_to);
      }

      if (filterOptions.assigned_department && filterOptions.assigned_department.length > 0) {
        query = query.in('assigned_department', filterOptions.assigned_department);
      }

      if (filterOptions.created_by && filterOptions.created_by.length > 0) {
        query = query.in('created_by', filterOptions.created_by);
      }

      if (filterOptions.record_type) {
        query = query.eq('record_type', filterOptions.record_type);
      }

      if (filterOptions.record_id) {
        query = query.eq('record_id', filterOptions.record_id);
      }

      if (filterOptions.workflow_id) {
        query = query.eq('workflow_id', filterOptions.workflow_id);
      }

      if (filterOptions.due_date_from) {
        query = query.gte('due_date', filterOptions.due_date_from);
      }

      if (filterOptions.due_date_to) {
        query = query.lte('due_date', filterOptions.due_date_to);
      }

      if (filterOptions.tags && filterOptions.tags.length > 0) {
        query = query.overlaps('tags', filterOptions.tags);
      }

      if (filterOptions.search) {
        query = query.or(`title.ilike.%${filterOptions.search}%,description.ilike.%${filterOptions.search}%`);
      }

      if (filterOptions.fixed_types && filterOptions.fixed_types.length > 0) {
        query = query.in('fixed_type', filterOptions.fixed_types as any);
      }

      if (filterOptions.template_id) {
        query = query.eq('template_id', filterOptions.template_id);
      }

      const { data, error} = await query;

      if (error) {
        console.error('❌ Error fetching tasks:', error);
        toast.error('Erro ao buscar tarefas: ' + error.message);
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} tasks from database`);

      // Convert raw task data to Task interface format
      const formattedTasks: Task[] = (data || []).map((task: any) => ({
        ...task,
        workflow_step_name: null,
        fixed_type: task.fixed_type || 'simple_task',
        payload: task.payload || {},
        template_id: task.template_id || null,
        template_snapshot: task.template_snapshot || {},
        // Use joined data from query
        assigned_user: task.assigned_user || null,
        created_user: task.created_user || null,
        assigned_department_profile: task.assigned_department_profile || null,
        template: task.template || null,
        assigned_users_profiles: [],
      }));

      console.log('📋 Formatted tasks:', formattedTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      toast.error('Erro ao buscar tarefas');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova tarefa
  const createTask = async (taskData: CreateTaskData) => {
    console.log('🚀 createTask called with data:', taskData);

    if (!user) {
      console.error('❌ User not authenticated');
      toast.error('Usuário não autenticado');
      return false;
    }

    console.log('✅ User authenticated:', user.id);

    try {
      const assignmentType = (taskData as any).assignment_type;
      console.log('📝 Assignment type:', assignmentType);

      // Se o tipo de atribuição for "department", buscar todos os usuários do departamento
      // e converter para tipo "anyone" (assigned_users)
      if (assignmentType === 'department' && taskData.assigned_department) {
        const { data: departmentUsers, error: deptError } = await supabase
          .from('profiles')
          .select('id')
          .eq('department_id', taskData.assigned_department)
          .eq('status', 'active');

        if (deptError) {
          toast.error('Erro ao buscar usuários do departamento: ' + deptError.message);
          return false;
        }

        if (!departmentUsers || departmentUsers.length === 0) {
          toast.error('Nenhum usuário ativo encontrado neste departamento');
          return false;
        }

        // Converter para array de IDs
        const userIds = departmentUsers.map(u => u.id);

        // Criar tarefa tipo "anyone" com os usuários do departamento
        taskData.assigned_users = userIds;
        taskData.assigned_department = null; // Limpar o departamento
      }

      // Se o tipo de atribuição for "all", criar uma tarefa para cada usuário
      if (assignmentType === 'all' && taskData.assigned_users && taskData.assigned_users.length > 0) {
        const tasksToInsert = taskData.assigned_users.map(userId => ({
          title: taskData.title,
          description: taskData.description || null,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'P3',
          assigned_to: userId, // Atribuir individualmente
          assigned_department: null,
          assigned_users: null, // Não usar array para tipo "all"
          created_by: user.id,
          due_date: taskData.due_date || null,
          expected_completion_at: taskData.expected_completion_at || null,
          deadline_at: taskData.deadline_at || null,
          estimated_hours: taskData.estimated_hours || null,
          tags: taskData.tags || null,
          record_type: taskData.record_type || null,
          record_id: taskData.record_id || null,
          workflow_id: taskData.workflow_id || null,
          workflow_step_id: taskData.workflow_step_id || null,
          task_type_id: taskData.task_type_id || null,
          approval_title: taskData.approval_title || null,
          approval_description: taskData.approval_description || null,
          fixed_type: taskData.fixed_type,
          payload: taskData.payload || {},
          template_id: taskData.template_id || null,
          template_snapshot: taskData.template_snapshot || {},
          parent_task_id: null, // Será atualizado depois
        }));

        // Inserir todas as tarefas
        const { data, error } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select('*');

        if (error) {
          toast.error('Erro ao criar tarefas: ' + error.message);
          return false;
        }

        if (data && data.length > 0) {
          // Atualizar todas as tarefas com o ID da primeira como parent_task_id
          const parentTaskId = data[0].id;
          const taskIds = data.map(t => t.id);

          await supabase
            .from('tasks')
            .update({ parent_task_id: parentTaskId })
            .in('id', taskIds);

          // Note: duplication_type field removed as it doesn't exist in database

          // Converter para formato Task e adicionar ao estado
          const newTasks: Task[] = data.map((task: any) => ({
            ...task,
            workflow_step_name: null,
            fixed_type: task.fixed_type || 'simple_task',
            payload: task.payload || {},
                template_id: task.template_id || null,
            template_snapshot: task.template_snapshot || {},
            assigned_user: null,
            created_user: null,
            assigned_department_profile: null,
            template: null,
            assigned_users_profiles: [],
            parent_task_id: parentTaskId,
          }));

          setTasks(prev => [...newTasks, ...prev]);
          toast.success(`${data.length} tarefas criadas com sucesso! (uma para cada usuário)`);
          return true;
        }

        return false;
      }

      // Lógica padrão para outros tipos de atribuição
      const insertData: any = {
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'P3',
        assigned_to: taskData.assigned_to || null,
        assigned_department: taskData.assigned_department || null,
        assigned_users: taskData.assigned_users || null,
        created_by: user.id,
        due_date: taskData.due_date || null,
        expected_completion_at: taskData.expected_completion_at || null,
        deadline_at: taskData.deadline_at || null,
        estimated_hours: taskData.estimated_hours || null,
        tags: taskData.tags || null,
        record_type: taskData.record_type || null,
        record_id: taskData.record_id || null,
        workflow_id: taskData.workflow_id || null,
        workflow_step_id: taskData.workflow_step_id || null,
        task_type_id: taskData.task_type_id || null,
        approval_title: taskData.approval_title || null,
        approval_description: taskData.approval_description || null,
        fixed_type: taskData.fixed_type,
        payload: taskData.payload || {},
        template_id: taskData.template_id || null,
        template_snapshot: taskData.template_snapshot || {},
        parent_task_id: null,
      };

      console.log('💾 Inserting task data:', insertData);

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select('*')
        .single();

      console.log('📊 Insert result:', { data, error });

      if (error) {
        console.error('❌ Error creating task:', error);
        toast.error('Erro ao criar tarefa: ' + error.message);
        return false;
      }

      // Convert to Task format
      const taskWithDefaults: Task = {
        ...(data as any),
        workflow_step_name: null,
        fixed_type: (data as any).fixed_type || 'simple_task',
        payload: (data as any).payload || {},
        template_id: (data as any).template_id || null,
        template_snapshot: (data as any).template_snapshot || {},
        assigned_user: null,
        created_user: null,
        assigned_department_profile: null,
        template: null,
        assigned_users_profiles: [],
      };

      console.log('✅ Task created successfully:', taskWithDefaults);

      // Inserir anexos se houverem
      if (taskData.attachments && taskData.attachments.length > 0) {
        console.log('📎 Inserting attachments for task:', data.id);

        try {
          // Buscar metadados dos arquivos da tabela documents (Gestão de Documentos)
          const fileIds = taskData.attachments.map(att => att.id);
          const { data: filesData, error: filesError } = await supabase
            .from('documents')
            .select('id, name, file_url, storage_key, file_size, mime_type, created_by')
            .in('id', fileIds);

          if (filesError) {
            console.error('⚠️ Error fetching file metadata:', filesError);
            toast.error('Aviso: Erro ao buscar metadados dos anexos');
          } else if (filesData && filesData.length > 0) {
            // Inserir registros na tabela task_attachments
            const attachmentsToInsert = filesData.map(file => ({
              task_id: data.id,
              file_name: file.name,
              file_path: file.storage_key || file.file_url, // usar storage_key se disponível
              file_size: file.file_size,
              file_type: file.mime_type,
              uploaded_by: file.created_by || user.id,
            }));

            const { error: attachError } = await supabase
              .from('task_attachments')
              .insert(attachmentsToInsert);

            if (attachError) {
              console.error('⚠️ Error inserting attachments:', attachError);
              toast.error('Aviso: Anexos não foram salvos');
            } else {
              console.log(`✅ ${attachmentsToInsert.length} attachment(s) saved successfully`);
            }
          }
        } catch (attachError) {
          console.error('⚠️ Unexpected error saving attachments:', attachError);
        }
      }

      setTasks(prev => [taskWithDefaults, ...prev]);
      toast.success('Tarefa criada com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Unexpected error creating task:', error);
      toast.error('Erro ao criar tarefa');
      return false;
    }
  };

  // Atualizar tarefa
  const updateTask = async (taskId: string, updates: any) => {
    try {
      console.log('Updating task:', { taskId, updates });
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*')
        .single();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        if (error.code === 'PGRST301') {
          toast.error('Você não tem permissão para atualizar esta tarefa');
        } else if (error.code === '42501') {
          toast.error('Acesso negado - verifique suas permissões');
        } else {
          toast.error('Erro ao atualizar tarefa: ' + error.message);
        }
        return false;
      }

      if (!data) {
        console.error('No data returned from update');
        toast.error('Erro: nenhum dado retornado da atualização');
        return false;
      }

      // Convert to Task format  
      const taskWithDefaults: Task = {
        ...(data as any),
        workflow_step_name: null,
        fixed_type: (data as any).fixed_type || 'simple_task',
        payload: (data as any).payload || {},
        template_id: (data as any).template_id || null,
        template_snapshot: (data as any).template_snapshot || {},
        assigned_user: null,
        created_user: null,
        assigned_department_profile: null,
        template: null,
        assigned_users_profiles: [],
      };

      setTasks(prev => prev.map(task => 
        task.id === taskId ? taskWithDefaults : task
      ));
      toast.success('Tarefa atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao atualizar tarefa:', error);
      toast.error('Erro inesperado ao atualizar tarefa');
      return false;
    }
  };

  // Deletar tarefa
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        toast.error('Erro ao deletar tarefa: ' + error.message);
        return false;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Tarefa deletada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      toast.error('Erro ao deletar tarefa');
      return false;
    }
  };

  // Atualizar status da tarefa
  const updateTaskStatus = async (taskId: string, status: string) => {
    return updateTask(taskId, { status });
  };

  // Atribuir tarefa a usuário
  const assignTask = async (taskId: string, userId: string | null) => {
    return updateTask(taskId, { assigned_to: userId });
  };

  // Buscar tarefas por registro específico
  const getTasksByRecord = async (recordType: string, recordId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas do registro:', error);
        return [];
      }

      // Convert to Task format
      const tasksWithDefaults: Task[] = (data || []).map((task: any) => ({
        ...task,
        workflow_step_name: null,
        fixed_type: task.fixed_type || 'simple_task',
        payload: task.payload || {},
        template_id: task.template_id || null,
        template_snapshot: task.template_snapshot || {},
        assigned_user: null,
        created_user: null,
        assigned_department_profile: null,
        template: null,
        assigned_users_profiles: [],
      }));

      return tasksWithDefaults;
    } catch (error) {
      console.error('Erro ao buscar tarefas do registro:', error);
      return [];
    }
  };

  // Buscar minhas tarefas (atribuídas ou criadas por mim ou do meu departamento)
  const getMyTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile to check department
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id},assigned_department.eq.${profile?.department_id || 'null'},assigned_users.cs.{"${user.id}"}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert to Task format
      const formattedTasks: Task[] = (data || []).map((task: any) => ({
        ...task,
        workflow_step_name: null,
        fixed_type: task.fixed_type || 'simple_task',
        payload: task.payload || {},
        template_id: task.template_id || null,
        template_snapshot: task.template_snapshot || {},
        assigned_user: null,
        created_user: null,
        assigned_department_profile: null,
        template: null,
        assigned_users_profiles: [],
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      toast.error('Erro ao buscar tarefas');
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas de tarefas
  const getTaskStats = () => {
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < new Date() && 
        !['done', 'cancelled'].includes(t.status)
      ).length,
      assigned_to_me: tasks.filter(t => 
        t.assigned_to === user?.id || 
        (t.assigned_users && t.assigned_users.includes(user?.id || ''))
      ).length,
      created_by_me: tasks.filter(t => t.created_by === user?.id).length,
    };

    return stats;
  };

  // Efeito para buscar tarefas quando filtros mudam
  useEffect(() => {
    if (user) {
      fetchTasks(filter);
    }
  }, [user, filter]);

  // Setup de tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchTasks(filter);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filter]);

  return {
    tasks,
    loading,
    filter,
    setFilter,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    getTasksByRecord,
    getMyTasks,
    getTaskStats,
    refetch: () => fetchTasks(filter),
  };
};
