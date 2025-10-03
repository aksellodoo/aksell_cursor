import { Task } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, User, MoreHorizontal, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskListViewProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onCreateNew?: () => void;
}

const priorityConfig = {
  urgent: { label: 'Urgente', class: 'bg-red-500 text-white' },
  high: { label: 'Alta', class: 'bg-orange-500 text-white' },
  medium: { label: 'Média', class: 'bg-blue-500 text-white' },
  low: { label: 'Baixa', class: 'bg-green-500 text-white' },
};

const statusConfig = {
  todo: { label: 'A Fazer', class: 'bg-gray-500 text-white', progress: 0 },
  in_progress: { label: 'Em Andamento', class: 'bg-blue-500 text-white', progress: 50 },
  review: { label: 'Em Revisão', class: 'bg-yellow-500 text-white', progress: 75 },
  done: { label: 'Concluída', class: 'bg-green-500 text-white', progress: 100 },
};

export const TaskListView = ({ tasks, onTaskSelect, onStatusChange, onCreateNew }: TaskListViewProps) => {
  const navigate = useNavigate();

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar do responsável */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs">
                  {getInitials(task.assigned_user?.name)}
                </AvatarFallback>
              </Avatar>

              {/* Conteúdo principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 
                      className="font-medium text-sm cursor-pointer hover:text-primary"
                      onClick={() => onTaskSelect?.(task)}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Menu de ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}/view`)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      {onStatusChange && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'in_progress')}
                            disabled={task.status === 'in_progress'}
                          >
                            Marcar como Em Andamento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'done')}
                            disabled={task.status === 'done'}
                          >
                            Marcar como Concluída
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badges e informações */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig].class}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                  </Badge>
                  
                  <Badge className={statusConfig[task.status as keyof typeof statusConfig].class}>
                    {statusConfig[task.status as keyof typeof statusConfig].label}
                  </Badge>

                  {isOverdue(task) && (
                    <Badge variant="destructive">
                      Atrasada
                    </Badge>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Informações adicionais */}
                <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {task.assigned_user && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.assigned_user.name}</span>
                      </div>
                    )}
                    
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {task.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{task.estimated_hours}h estimadas</span>
                      </div>
                    )}
                  </div>

                  {/* Progresso */}
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={statusConfig[task.status as keyof typeof statusConfig].progress} 
                      className="w-20 h-2"
                    />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {statusConfig[task.status as keyof typeof statusConfig].progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
            {onCreateNew && (
              <Button onClick={onCreateNew} variant="outline" className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Criar primeira tarefa
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};