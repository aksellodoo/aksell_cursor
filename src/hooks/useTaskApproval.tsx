import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface TaskApprovalData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  fixed_type: string;
  payload: {
    data_source: 'file' | 'form' | 'text';
    file_id?: string;
    form_response_id?: string;
    text_content?: string;
    require_justification?: boolean;
  };
  created_by: string;
  assigned_to: string;
  creator: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  assigned_user: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  uploader: {
    name: string;
    email: string;
  };
}

export interface FormResponseData {
  form: {
    id: string;
    title: string;
    description: string;
    fields_definition: any[];
  };
  response: {
    id: string;
    response_data: any;
    submitted_at: string;
    submitted_by: string;
    user_name: string;
    user_email: string;
    user_department: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    name: string;
    email: string;
  };
}

export const useTaskApproval = (taskId: string) => {
  const { user } = useAuth();
  const [task, setTask] = useState<TaskApprovalData | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [formResponseData, setFormResponseData] = useState<FormResponseData | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    fetchTaskData();
  }, [taskId]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);

      // Buscar dados da tarefa com informações do criador e responsável
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          fixed_type,
          payload,
          created_by,
          assigned_to,
          creator:created_by(id, name, email, department),
          assigned_user:assigned_to(id, name, email, department)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      if (!taskData) throw new Error('Tarefa não encontrada');

      setTask(taskData as any);

      const payload = taskData.payload as any;

      // Buscar anexos se data_source for "file"
      if (payload?.data_source === 'file') {
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from('task_attachments')
          .select(`
            id,
            task_id,
            file_name,
            file_path,
            file_size,
            file_type,
            uploaded_by,
            uploaded_at,
            uploader:uploaded_by(name, email)
          `)
          .eq('task_id', taskId)
          .order('uploaded_at', { ascending: false });

        if (attachmentsError) throw attachmentsError;
        setAttachments(attachmentsData as any || []);
      }

      // Buscar formulário e resposta se data_source for "form"
      if (payload?.data_source === 'form' && payload?.form_response_id) {
        const { data: responseData, error: responseError } = await supabase
          .from('form_responses')
          .select(`
            id,
            response_data,
            submitted_at,
            submitted_by,
            user_name,
            user_email,
            user_department,
            form:form_id(
              id,
              title,
              description,
              fields_definition
            )
          `)
          .eq('id', payload.form_response_id)
          .single();

        if (responseError) throw responseError;
        setFormResponseData(responseData as any);
      }

      // Buscar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          id,
          task_id,
          content,
          created_at,
          author_id,
          author:author_id(name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData as any || []);

    } catch (error: any) {
      console.error('Error fetching task approval data:', error);
      toast.error('Erro ao carregar dados da tarefa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processApproval = async (
    decision: 'approved' | 'rejected' | 'correction_requested',
    justification: string
  ) => {
    if (!task) return false;

    // Validar se é o responsável pela aprovação
    if (task.assigned_to !== user?.id) {
      toast.error('Você não tem permissão para processar esta aprovação');
      return false;
    }

    // Validar justificativa se necessário
    if (task.payload.require_justification && !justification.trim()) {
      toast.error('Justificativa é obrigatória para esta aprovação');
      return false;
    }

    setProcessing(true);

    try {
      // Chamar edge function para processar aprovação
      const { data, error } = await supabase.functions.invoke('process-unified-approval', {
        body: {
          taskId: task.id,
          decision,
          justification: justification.trim(),
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          decision === 'approved'
            ? 'Aprovação concedida com sucesso!'
            : decision === 'rejected'
            ? 'Aprovação rejeitada'
            : 'Correção solicitada com sucesso'
        );
        return true;
      } else {
        throw new Error(data?.message || 'Erro ao processar aprovação');
      }
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error('Erro ao processar aprovação: ' + error.message);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const addComment = async (content: string) => {
    if (!task || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: task.id,
          content: content.trim(),
          author_id: user?.id
        });

      if (error) throw error;

      toast.success('Comentário adicionado');
      await fetchTaskData(); // Recarregar comentários
      return true;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
      return false;
    }
  };

  return {
    task,
    attachments,
    formResponseData,
    comments,
    loading,
    processing,
    processApproval,
    addComment,
    refetch: fetchTaskData
  };
};
