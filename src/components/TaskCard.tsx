import { Calendar, MessageSquare, Paperclip, User, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { type Task } from '@/hooks/useTasks';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
  statusConfig: Record<string, { label: string; color: string }>;
  priorityConfig: Record<string, { label: string; color: string }>;
}

export const TaskCard = ({ task, onStatusChange, statusConfig, priorityConfig }: TaskCardProps) => {
  const isOverdue = task.due_date && 
    isBefore(new Date(task.due_date), startOfDay(new Date())) && 
    !['done', 'cancelled'].includes(task.status);

  const isDueSoon = task.due_date && 
    isAfter(new Date(task.due_date), new Date()) &&
    isBefore(new Date(task.due_date), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days

  const getAssignmentDisplay = () => {
    if (task.assigned_user) {
      return {
        type: 'individual',
        content: task.assigned_user.name,
        avatar: task.assigned_user.name[0]
      };
    }
    
    if (task.assigned_department_profile) {
      return {
        type: 'department',
        content: task.assigned_department_profile.name,
        color: task.assigned_department_profile.color
      };
    }
    
    if (task.assigned_users_profiles && task.assigned_users_profiles.length > 0) {
      return {
        type: 'multiple',
        content: `${task.assigned_users_profiles.length} usuários`,
        users: task.assigned_users_profiles
      };
    }
    
    return null;
  };

  const assignmentDisplay = getAssignmentDisplay();

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header com prioridade e menu */}
        <div className="flex items-start justify-between">
          <Badge 
            className={`text-xs ${priorityConfig[task.priority]?.color || 'bg-gray-100 text-gray-600'}`}
            variant="secondary"
          >
            {priorityConfig[task.priority]?.label || task.priority}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="sr-only">Abrir menu</span>
                <div className="h-1 w-1 bg-current rounded-full"></div>
                <div className="h-1 w-1 bg-current rounded-full"></div>
                <div className="h-1 w-1 bg-current rounded-full"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(statusConfig).map(([status, config]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => {
                    console.log(`Moving task ${task.id} to ${status} via dropdown`);
                    onStatusChange(task.id, status);
                  }}
                  disabled={task.status === status || status === 'overdue'}
                >
                  Mover para {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Código e Título */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
              #{task.task_code}
            </Badge>
          </div>
          <h3 className="font-medium text-sm text-foreground line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Data de vencimento */}
        {task.due_date && (
          <div className={`flex items-center gap-1.5 text-xs ${
            isOverdue ? 'text-red-600' : 
            isDueSoon ? 'text-orange-600' : 
            'text-muted-foreground'
          }`}>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Estimativa de tempo */}
        {task.estimated_hours && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.estimated_hours}h estimado</span>
          </div>
        )}

        {/* Footer com atribuição e indicadores */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {assignmentDisplay && (
              <>
                {assignmentDisplay.type === 'individual' && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignmentDisplay.content}`} />
                      <AvatarFallback className="text-xs">
                        {assignmentDisplay.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-20">
                      {assignmentDisplay.content.split(' ')[0]}
                    </span>
                  </div>
                )}
                
                {assignmentDisplay.type === 'department' && (
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: assignmentDisplay.color + '20' }}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: assignmentDisplay.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-20">
                      {assignmentDisplay.content}
                    </span>
                  </div>
                )}
                
                {assignmentDisplay.type === 'multiple' && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      {assignmentDisplay.users?.slice(0, 2).map((user, index) => (
                        <Avatar key={user.id} className="h-5 w-5 border border-background">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                          <AvatarFallback className="text-xs">
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {assignmentDisplay.users && assignmentDisplay.users.length > 2 && (
                        <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center border border-background text-xs">
                          +{assignmentDisplay.users.length - 2}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-20">
                      {assignmentDisplay.content}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Indicadores de comentários e anexos serão implementados posteriormente */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Indicador de workflow */}
        {task.is_workflow_generated && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            <span>Gerado por workflow</span>
          </div>
        )}

        {/* Chip "Recorrente" */}
        {task.series_id && (
          <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
            <span>Recorrente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};