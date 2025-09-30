import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock, AlertCircle, FileText, Building2 } from 'lucide-react';
import { usePendingTaskForms, type PendingTaskForm } from '@/hooks/usePendingTaskForms';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TaskFormsPendingList: React.FC = () => {
  const { forms, loading, refetch } = usePendingTaskForms();  
  const navigate = useNavigate();

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'secondary' as const, text: 'Baixa', icon: Clock },
      medium: { variant: 'outline' as const, text: 'Média', icon: Clock },
      high: { variant: 'destructive' as const, text: 'Alta', icon: AlertCircle },
      urgent: { variant: 'destructive' as const, text: 'Urgente', icon: AlertCircle },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getDeadlineText = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const deadline = new Date(dueDate);
    const now = new Date();
    const isOverdue = deadline < now;
    
    return (
      <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Calendar className="h-3 w-3" />
        {isOverdue ? 'Venceu em' : 'Vence em'} {format(deadline, 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    );
  };

  const handleFillForm = (taskForm: PendingTaskForm) => {
    navigate(`/tarefas/formulario/${taskForm.form.id}?taskId=${taskForm.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando formulários de tarefas...</div>
      </div>
    );
  }

  if (forms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {forms.map((taskForm) => (
        <Card key={taskForm.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Formulário
                  </Badge>
                  {getPriorityBadge(taskForm.priority)}
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {taskForm.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {taskForm.form.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {taskForm.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {taskForm.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                <span>Criado em {format(new Date(taskForm.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                {taskForm.due_date && (
                  <>
                    <span>•</span>
                    <span className={new Date(taskForm.due_date) < new Date() ? 'text-destructive' : ''}>
                      {new Date(taskForm.due_date) < new Date() ? 'Venceu' : 'Vence'} em {format(new Date(taskForm.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </>
                )}
              </div>
              
              <Button 
                size="sm"
                onClick={() => handleFillForm(taskForm)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Preencher
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskFormsPendingList;