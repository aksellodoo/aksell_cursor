import { useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskGanttProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
}

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500', 
  medium: 'bg-blue-500',
  low: 'bg-green-500',
};

const statusProgress = {
  todo: 0,
  in_progress: 50,
  review: 80,
  done: 100,
};

export const TaskGantt = ({ tasks, onTaskSelect }: TaskGanttProps) => {
  const ganttData = useMemo(() => {
    const tasksWithDates = tasks.filter(task => task.due_date);
    
    if (tasksWithDates.length === 0) return { tasks: [], dateRange: { start: new Date(), end: new Date() } };

    // Calcular range de datas
    const dates = tasksWithDates.map(task => new Date(task.due_date!));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Adicionar margem de 7 dias
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const totalDays = differenceInDays(maxDate, minDate);
    
    const processedTasks = tasksWithDates.map(task => {
      const taskDate = new Date(task.due_date!);
      const daysFromStart = differenceInDays(taskDate, minDate);
      const position = (daysFromStart / totalDays) * 100;
      
      return {
        ...task,
        position: Math.max(0, Math.min(100, position)),
        width: 2, // Largura mínima da barra
        isOverdue: isBefore(taskDate, new Date()) && task.status !== 'done',
      };
    });

    return {
      tasks: processedTasks,
      dateRange: { start: minDate, end: maxDate },
      totalDays,
    };
  }, [tasks]);

  const generateDateMarkers = () => {
    const { start, end } = ganttData.dateRange;
    const markers = [];
    const current = new Date(start);
    
    while (isBefore(current, end)) {
      const position = (differenceInDays(current, start) / ganttData.totalDays) * 100;
      markers.push({
        date: new Date(current),
        position,
      });
      current.setDate(current.getDate() + 7); // Marcador a cada semana
    }
    
    return markers;
  };

  if (ganttData.tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma tarefa com prazo definido encontrada.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma de Tarefas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header com datas */}
        <div className="relative h-8 border-b">
          {generateDateMarkers().map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 text-xs text-muted-foreground"
              style={{ left: `${marker.position}%` }}
            >
              <div className="w-px h-6 bg-border absolute left-0"></div>
              <div className="ml-1 whitespace-nowrap">
                {format(marker.date, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Lista de tarefas */}
        <div className="space-y-3">
          {ganttData.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-4 group hover:bg-muted/50 p-2 rounded-lg cursor-pointer transition-colors"
              onClick={() => onTaskSelect?.(task)}
            >
              {/* Informações da tarefa */}
              <div className="w-64 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-white border-0`}
                  >
                    {task.priority === 'urgent' && 'Urgente'}
                    {task.priority === 'high' && 'Alta'}
                    {task.priority === 'medium' && 'Média'}
                    {task.priority === 'low' && 'Baixa'}
                  </Badge>
                  {task.isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Atrasada
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-sm mt-1 truncate">{task.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Prazo: {format(new Date(task.due_date!), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>

              {/* Timeline visual */}
              <div className="flex-1 relative h-8">
                <div className="absolute inset-0 bg-muted rounded"></div>
                <div
                  className={`absolute h-full rounded transition-all duration-200 ${
                    task.isOverdue ? 'bg-destructive' : priorityColors[task.priority as keyof typeof priorityColors]
                  } opacity-80 group-hover:opacity-100`}
                  style={{
                    left: `${task.position}%`,
                    width: `${Math.max(task.width, 2)}%`,
                  }}
                >
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium px-1 truncate">
                      {task.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progresso */}
              <div className="w-20 flex-shrink-0">
                <Progress 
                  value={statusProgress[task.status as keyof typeof statusProgress]} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {statusProgress[task.status as keyof typeof statusProgress]}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};