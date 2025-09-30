import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TaskCalendarProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
}

const priorityColors = {
  urgent: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-green-500',
};

const statusColors = {
  todo: 'bg-gray-500',
  in_progress: 'bg-blue-600',
  review: 'bg-yellow-600',
  done: 'bg-green-600',
};

export const TaskCalendar = ({ tasks, onTaskSelect }: TaskCalendarProps) => {
  const events = useMemo(() => {
    return tasks
      .filter(task => task.due_date)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date!),
        end: new Date(task.due_date!),
        resource: task,
      }));
  }, [tasks]);

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-500';
    
    return {
      style: {
        backgroundColor: `var(--${task.priority === 'P1' ? 'destructive' : task.priority === 'P2' ? 'orange' : task.priority === 'P3' ? 'primary' : 'muted'})`,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px',
      }
    };
  };

  const CustomEvent = ({ event }: { event: any }) => {
    const task = event.resource as Task;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        <Badge 
          variant="secondary" 
          className={`h-3 w-3 rounded-full p-0 ${statusColors[task.status as keyof typeof statusColors]}`}
        />
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Calendário de Tarefas</CardTitle>
      </CardHeader>
      <CardContent className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="pt-BR"
          messages={{
            allDay: 'Todo o dia',
            previous: 'Anterior',
            next: 'Próximo',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Não há tarefas neste período.',
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          onSelectEvent={(event) => {
            if (onTaskSelect) {
              onTaskSelect(event.resource);
            }
          }}
          style={{ height: '100%' }}
        />
      </CardContent>
    </Card>
  );
};