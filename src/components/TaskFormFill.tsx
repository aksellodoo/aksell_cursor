import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useForms } from '@/hooks/useForms';
import { FormRenderer } from '@/components/FormRenderer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TaskFormFillProps {}

const TaskFormFill: React.FC<TaskFormFillProps> = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submitFormResponse } = useForms();
  
  const [form, setForm] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFormAndTask = async () => {
      if (!formId || !taskId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch form
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .eq('status', 'task_usage')
          .single();

        if (formError) throw formError;

        // Fetch task to verify user has permission
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            *,
            creator:profiles!created_by (
              name
            ),
            assignedUser:profiles!assigned_to (
              name
            ),
            departments:assigned_department (
              name
            )
          `)
          .eq('id', taskId)
          .eq('form_id', formId)
          .single();

        if (taskError) throw taskError;

        // Check if user has permission to fill this form
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('department_id')
          .eq('id', user.id)
          .single();

        const canFill = 
          taskData.assigned_to === user.id ||
          (taskData.assigned_users && taskData.assigned_users.includes(user.id)) ||
          (taskData.assigned_department && userProfile?.department_id === taskData.assigned_department);

        setForm(formData);
        setTask(taskData);
        setHasPermission(canFill);
      } catch (error) {
        console.error('Error fetching form and task:', error);
        toast.error('Erro ao carregar formulário');
      } finally {
        setLoading(false);
      }
    };

    fetchFormAndTask();
  }, [formId, taskId, user]);

  const handleSubmit = async (formData: any) => {
    if (!form || !task || !user) return;

    try {
      setSubmitting(true);
      
      // Submit form response with task metadata
      await submitFormResponse(form.id, {
        ...formData,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        task_id: task.id,
        task_title: task.title,
      });

      // Update task to mark form as completed (if needed)
      await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      toast.success('Formulário enviado com sucesso!');
      navigate('/tarefas', { state: { activeTab: 'pending' } });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erro ao enviar formulário');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!form || !task) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Formulário não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O formulário ou tarefa solicitada não foi encontrada.
            </p>
            <Button onClick={() => navigate('/tarefas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Tarefas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Acesso negado</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para preencher este formulário.
            </p>
            <Button onClick={() => navigate('/tarefas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Tarefas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/tarefas', { state: { activeTab: 'pending' } })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Tarefas Pendentes
        </Button>
        
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>
                Formulário: {form.title}
              </CardDescription>
              {task.description && (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      <FormRenderer
        form={form}
        onSubmit={handleSubmit}
        submitting={submitting}
        showBackButton={false}
        backTo="/tarefas"
      />
    </div>
  );
};

export default TaskFormFill;