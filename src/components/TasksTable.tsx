import React, { useState, useMemo, useEffect } from 'react';
import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MoreHorizontal, Search, ArrowUpDown, Calendar, Clock, User, Plus, CheckCircle2, Circle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TASK_TYPES, FixedTaskType } from '@/lib/taskTypesFixed';
import { useNavigate } from 'react-router-dom';

interface TasksTableProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onCreateNew?: () => void;
  onProcessTask?: (task: Task) => void;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'fixed_type';
type SortOrder = 'asc' | 'desc';

const priorityConfig = {
  // Legacy format
  urgent: { label: 'Urgente', variant: 'destructive' as const },
  high: { label: 'Alta', variant: 'default' as const },
  medium: { label: 'Média', variant: 'secondary' as const },
  low: { label: 'Baixa', variant: 'outline' as const },
  // New P1-P4 format
  P1: { label: 'Crítica', variant: 'destructive' as const },
  P2: { label: 'Alta', variant: 'default' as const },
  P3: { label: 'Média', variant: 'secondary' as const },
  P4: { label: 'Baixa', variant: 'outline' as const },
};

const statusConfig = {
  todo: { label: 'A Fazer', variant: 'outline' as const, progress: 0 },
  in_progress: { label: 'Em Andamento', variant: 'default' as const, progress: 50 },
  review: { label: 'Em Revisão', variant: 'secondary' as const, progress: 75 },
  done: { label: 'Concluída', variant: 'default' as const, progress: 100 },
};

export const TasksTable = ({ tasks, onTaskSelect, onStatusChange, onCreateNew, onProcessTask }: TasksTableProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'subordinates'>('mine');
  const [subordinateIds, setSubordinateIds] = useState<string[]>([]);

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Buscar subordinados recursivamente
  useEffect(() => {
    const fetchSubordinates = async () => {
      if (!user?.id) return;

      const getAllSubordinates = async (supervisorId: string): Promise<string[]> => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('supervisor_id', supervisorId)
          .eq('status', 'active');

        if (error || !data) return [];

        const directSubordinates = data.map(p => p.id);

        // Buscar subordinados dos subordinados (recursivo)
        const indirectSubordinates = await Promise.all(
          directSubordinates.map(id => getAllSubordinates(id))
        );

        return [...directSubordinates, ...indirectSubordinates.flat()];
      };

      const allSubordinates = await getAllSubordinates(user.id);
      setSubordinateIds(allSubordinates);
    };

    fetchSubordinates();
  }, [user?.id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Filtro de busca por texto
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro por status (pendentes vs concluídas)
      const isPending = task.status !== 'done';
      const matchesStatus = statusFilter === 'pending' ? isPending : !isPending;

      if (!matchesStatus) return false;

      // Filtro por escopo (minhas vs subordinados)
      if (scopeFilter === 'mine') {
        // Minhas tarefas: onde eu sou assigned_to ou created_by
        return task.assigned_to === user?.id || task.created_by === user?.id;
      } else {
        // Tarefas dos subordinados
        return task.assigned_to && subordinateIds.includes(task.assigned_to);
      }
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'due_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, searchTerm, sortField, sortOrder, statusFilter, scopeFilter, subordinateIds, user?.id]);

  if (tasks.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Toggle de Status */}
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(value) => value && setStatusFilter(value as 'pending' | 'completed')}
          className="justify-start"
        >
          <ToggleGroupItem value="pending" aria-label="Tarefas pendentes" className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            Pendentes
          </ToggleGroupItem>
          <ToggleGroupItem value="completed" aria-label="Tarefas concluídas" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Concluídas
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Toggle de Escopo */}
        <ToggleGroup
          type="single"
          value={scopeFilter}
          onValueChange={(value) => value && setScopeFilter(value as 'mine' | 'subordinates')}
          className="justify-start"
        >
          <ToggleGroupItem value="mine" aria-label="Minhas tarefas" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Minhas
          </ToggleGroupItem>
          <ToggleGroupItem value="subordinates" aria-label="Tarefas de subordinados" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subordinados {subordinateIds.length > 0 && `(${subordinateIds.length})`}
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Barra de busca */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('title')}
                  className="h-8 px-2"
                >
                  Título
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('fixed_type')}
                  className="h-8 px-2"
                >
                  Tipo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-8 px-2"
                >
                  Status
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('priority')}
                  className="h-8 px-2"
                >
                  Prioridade
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Responsável</TableHead>
              <TableHead className="hidden xl:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('due_date')}
                  className="h-8 px-2"
                >
                  Vencimento
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Progresso</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskSelect?.(task)}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{task.title}</span>
                    {task.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.fixed_type ? (
                    <Badge variant="outline" className="text-xs">
                      {TASK_TYPES[task.fixed_type as FixedTaskType]?.label || task.fixed_type}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={statusConfig[task.status as keyof typeof statusConfig]?.variant}>
                      {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                    </Badge>
                    {isOverdue(task) && (
                      <Badge variant="destructive" className="text-xs">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig]?.variant}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {task.assigned_user ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assigned_user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assigned_user.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {task.due_date ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={statusConfig[task.status as keyof typeof statusConfig]?.progress || 0}
                      className="w-16 h-2"
                    />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {statusConfig[task.status as keyof typeof statusConfig]?.progress || 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {/* Botão de ação contextual */}
                    {task.fixed_type && TASK_TYPES[task.fixed_type as FixedTaskType] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProcessTask?.(task);
                        }}
                        disabled={task.status === 'done'}
                        className="h-8 text-xs"
                        style={{
                          borderColor: TASK_TYPES[task.fixed_type as FixedTaskType]?.color,
                          color: TASK_TYPES[task.fixed_type as FixedTaskType]?.color
                        }}
                      >
                        <span className="hidden sm:inline">
                          {TASK_TYPES[task.fixed_type as FixedTaskType]?.actionLabel}
                        </span>
                        <span className="sm:hidden">
                          {React.createElement(TASK_TYPES[task.fixed_type as FixedTaskType]?.icon, { className: "h-4 w-4" })}
                        </span>
                      </Button>
                    )}

                    {/* Menu de 3 pontos */}
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
                            {/* Ocultar "Marcar como Concluída" para tipos com processamento especial */}
                            {(!task.fixed_type || !TASK_TYPES[task.fixed_type as FixedTaskType]?.hasSpecialProcessing) && (
                              <DropdownMenuItem
                                onClick={() => onStatusChange(task.id, 'done')}
                                disabled={task.status === 'done'}
                              >
                                Marcar como Concluída
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Informações de contagem */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredAndSortedTasks.length} de {tasks.length} tarefa(s)
      </div>
    </div>
  );
};
