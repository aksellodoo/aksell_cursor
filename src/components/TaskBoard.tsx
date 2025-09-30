import { useState } from 'react';
import { Plus, Filter, Search, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { TaskCard } from './TaskCard';
import { useTasks, type Task, type TaskFilter } from '@/hooks/useTasks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  todo: { label: 'A Fazer', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

interface TaskBoardProps {
  recordType?: string;
  recordId?: string;
  title?: string;
}

export const TaskBoard = ({ recordType, recordId, title = "Gestão de Tarefas" }: TaskBoardProps) => {
  const { tasks, loading, filter, setFilter, updateTaskStatus, getTaskStats } = useTasks();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  
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
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const stats = getTaskStats();

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskStatus(taskId, newStatus);
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

  const handleCreateTask = () => {
    const params = new URLSearchParams();
    params.set('origin', 'fixed');
    if (recordType) params.set('record_type', recordType);
    if (recordId) params.set('record_id', recordId);
    navigate(`/tasks/new?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">
            {stats.total} tarefas • {stats.assigned_to_me} atribuídas a mim
          </p>
        </div>
        
        <Button className="gap-2" onClick={handleCreateTask}>
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats[status as keyof typeof stats] || 0}</div>
                <div className="text-sm text-muted-foreground">{config.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Atrasadas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Board Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{config.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {groupedTasks[status]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 space-y-3">
              {groupedTasks[status]?.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  statusConfig={statusConfig}
                  priorityConfig={priorityConfig}
                />
              ))}
              {(!groupedTasks[status] || groupedTasks[status].length === 0) && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Nenhuma tarefa {config.label.toLowerCase()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};