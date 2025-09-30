import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Filter, Search, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useTasks, type Task, type TaskFilter } from '@/hooks/useTasks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const statusConfig = {
  todo: { label: 'A Fazer', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  done: { label: 'Concluído', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
  overdue: { label: 'Atrasadas', color: 'bg-red-100 text-red-700 border-red-200' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

interface ModernTaskBoardProps {
  recordType?: string;
  recordId?: string;
  title?: string;
}

export const ModernTaskBoard = ({ recordType, recordId, title = "Gestão de Tarefas" }: ModernTaskBoardProps) => {
  const navigate = useNavigate();
  const { tasks, loading, filter, setFilter, updateTaskStatus, getTaskStats } = useTasks();
  const { profile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Filtrar tarefas baseado nos filtros atuais
  const filteredTasks = tasks.filter(task => {
    // Filtrar por registro específico se fornecido
    if (recordType && recordId) {
      if (task.record_type !== recordType || task.record_id !== recordId) {
        return false;
      }
    }

    // Filtrar por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!task.title.toLowerCase().includes(searchLower) && 
          !task.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filtrar por status
    if (selectedStatus !== 'all' && task.status !== selectedStatus) {
      return false;
    }

    // Filtrar por prioridade
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
      return false;
    }

    return true;
  });

  // Agrupar tarefas por status
  const groupedTasks = Object.keys(statusConfig).reduce((acc, status) => {
    if (status === 'overdue') {
      // Tarefas atrasadas são aquelas com due_date anterior a hoje e não concluídas
      acc[status] = filteredTasks.filter(task => {
        if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
    } else {
      acc[status] = filteredTasks.filter(task => {
        // Excluir tarefas atrasadas das outras colunas
        if (task.due_date && task.status !== 'done' && task.status !== 'cancelled') {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) return false;
        }
        return task.status === status;
      });
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const stats = getTaskStats();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    console.log('Drag ended:', { destination, source, draggableId });

    if (!destination) {
      console.log('No destination');
      return;
    }
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('Same position');
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId;

    // Prevent dropping on overdue column
    if (newStatus === 'overdue') {
      console.log('Cannot drop on overdue column');
      return;
    }

    console.log(`Updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    console.log('Update result:', success);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilter({ ...filter, search: value || undefined });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setFilter({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 pb-4 border-b">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              {stats.total} tarefas • {stats.assigned_to_me} atribuídas a mim
            </p>
            <Button 
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 ml-4"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('origin', 'fixed');
                if (recordType) params.set('record_type', recordType);
                if (recordId) params.set('record_id', recordId);
                navigate(`/tasks/new?${params.toString()}`);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40 h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-40 h-11">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  {Object.entries(priorityConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="h-11">
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${status === 'overdue' ? 'text-destructive' : ''}`}>
                  {status === 'overdue' ? groupedTasks[status]?.length || 0 : stats[status as keyof typeof stats] || 0}
                </div>
                <div className="text-sm text-muted-foreground">{config.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board com Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[70vh] pb-8"
             style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Card key={status} className="flex flex-col shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
              <CardHeader className={`pb-3 rounded-t-lg border-b ${config.color}`}>
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span>{config.label}</span>
                  <Badge variant="outline" className="text-xs bg-background/80">
                    {groupedTasks[status]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <CardContent 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 space-y-3 min-h-[300px] transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-muted/30' : ''
                    }`}
                    style={{ overflow: 'visible' }}
                  >
                    {groupedTasks[status]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                           <div
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             {...provided.dragHandleProps}
                             className={`group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                               snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : 'hover:scale-[1.02] hover:shadow-md'
                             }`}
                           >
                             <div className="relative">
                               <div className="absolute -left-2 top-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                                 <GripVertical className="h-4 w-4 text-muted-foreground" />
                               </div>
                                <TaskCard
                                  task={task}
                                  onStatusChange={async (taskId, newStatus) => {
                                    if (newStatus === 'overdue') return; // Prevent manual assignment to overdue
                                    console.log(`TaskCard onStatusChange: ${taskId} -> ${newStatus}`);
                                    const success = await updateTaskStatus(taskId, newStatus);
                                    console.log('TaskCard update result:', success);
                                  }}
                                  statusConfig={statusConfig}
                                  priorityConfig={priorityConfig}
                                />
                             </div>
                           </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {(!groupedTasks[status] || groupedTasks[status].length === 0) && (
                      <div className="text-center text-muted-foreground text-sm py-12 border-2 border-dashed border-border rounded-lg">
                        <div className="space-y-2">
                          <div>Nenhuma tarefa {config.label.toLowerCase()}</div>
                          <div className="text-xs">Arraste tarefas aqui</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};